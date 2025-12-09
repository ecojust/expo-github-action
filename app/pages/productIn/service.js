import FileUploadUtils from "@/utils/FileUploadUtils";
import { uploadFile, getUploadUrl } from "@/app/api/common";
import AndroidNetworkFix from "@/utils/AndroidNetworkFix";
import AndroidUploadTest from "@/utils/AndroidUploadTest";
import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";
import { Toast } from "expo-react-native-toastify";

export default class Service {
  static async requestPermissions() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("权限不足", "需要相机权限才能拍照");
      return false;
    }
    return true;
  }

  static async uploadImageFile(imageUri, fileName) {
    try {
      // 使用新的文件上传工具类
      const formData = await FileUploadUtils.prepareFileForUpload({
        uri: imageUri,
        fileName: fileName,
        quality: 0.8,
      });

      const uploadUrl = getUploadUrl();

      // 调用上传接口 - Android特殊处理
      let uploadResult;

      if (Platform.OS === "android") {
        console.log("=== Android平台，尝试多种上传方法 ===");

        try {
          // 首先尝试标准方法
          console.log("尝试标准axios上传...");
          uploadResult = await uploadFile(formData);
          console.log("✅ 标准上传成功:", uploadResult);
        } catch (axiosError) {
          // 如果标准方法失败，尝试Android专用方法
          console.log("❌ 标准上传失败,尝试Android专用上传方法...");
          try {
            let processedUri = imageUri;
            if (Platform.OS === "android" && !imageUri.startsWith("file://")) {
              processedUri = `file://${imageUri}`;
            }
            uploadResult = await AndroidNetworkFix.uploadWithFallback({
              uri: processedUri,
              fileName: fileName,
              uploadUrl: uploadUrl,
              fieldName: "file",
              timeout: 30000,
            });
            console.log("✅ Android专用上传成功:", uploadResult);
            // 转换响应格式以匹配原有格式
            if (uploadResult && !uploadResult.data) {
              uploadResult = { data: uploadResult };
            }
            Toast.info("上传文件成功", {
              duration: 1500,
            });
          } catch (androidError) {
            console.error("❌ Android专用上传也失败:", androidError);

            // 诊断网络问题
            const issues =
              await AndroidNetworkFix.diagnoseNetworkIssues(uploadUrl);
            console.error("网络诊断结果:", issues);

            throw new Error(
              `所有上传方法都失败了。网络问题: ${issues.join(", ")}`
            );
          }
        }
      } else {
        // iOS使用标准方法
        console.log("iOS平台，使用标准上传方法");
        uploadResult = await uploadFile(formData);
      }

      if (uploadResult && uploadResult.data) {
        console.log("Upload successful:", uploadResult.data);
        return uploadResult.data;
      } else {
        throw new Error("Upload failed - no data returned");
      }
    } catch (error) {
      // Android平台进行详细诊断
      if (Platform.OS === "android") {
        console.log("=== Android上传失败，开始诊断 ===");
        try {
          const issues = await AndroidUploadTest.quickDiagnose(imageUri);
          console.log("诊断结果:", issues);
          // 如果是开发环境，可以运行完整测试
          if (__DEV__) {
            console.log("开发环境，运行完整测试...");
            // 注意：这会花费一些时间，可以根据需要启用
            // await AndroidUploadTest.runFullUploadTest(imageUri, fileName);
          }
        } catch (diagnoseError) {
          console.error("诊断过程出错:", diagnoseError);
        }
      }
      return null;
    }
  }

  static async takePhoto() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        // mediaTypes: ImagePicker.MediaType.Images,
        // allowsEditing: true,
        // aspect: [4, 3],
        quality: 0.6,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        // setSelectedImage(imageUri);

        // 生成文件名
        const fileName = `camera_${Date.now()}.jpg`;

        // 上传文件
        const uploadResult = await this.uploadImageFile(imageUri, fileName);
        console.log("takephoto 上传文件成功", uploadResult);

        return uploadResult || imageUri;
      }
    } catch (error) {
      Alert.alert("错误", "拍照失败，请重试");
      console.error("Camera error:", error);
    }
  }

  static async pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        // mediaTypes: ImagePicker.MediaType.Images,
        // allowsEditing: true,
        // aspect: [4, 3],
        quality: 0.6,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        // setSelectedImage(imageUri);

        // 生成文件名
        const fileName = `gallery_${Date.now()}.jpg`;

        // 上传文件
        const uploadResult = await this.uploadImageFile(imageUri, fileName);

        console.log("pickImage 上传文件成功", uploadResult);

        return uploadResult || imageUri;
      }
    } catch (error) {
      Alert.alert("错误", "选择图片失败，请重试");
      console.error("Image picker error:", error);
    }
  }

  /**
   * 生成二维码配置对象，供React组件使用
   * 注意：由于react-native-qrcode-svg需要在React组件中渲染才能生成base64，
   * 建议使用 QRCodeGenerator 组件或 QRCodeUtils 工具类
   * @param {string} value - 二维码内容
   * @param {Object} options - 配置选项
   * @returns {Object} 二维码配置对象
   */
  static generateQRCodeConfig(value, options = {}) {
    const {
      size = 200,
      backgroundColor = "white",
      color = "black",
      logo = null,
      logoSize = 50,
      logoBackgroundColor = "transparent",
      quietZone = 10,
    } = options;

    return {
      value,
      size,
      backgroundColor,
      color,
      logo,
      logoSize,
      logoBackgroundColor,
      quietZone,
      // 验证二维码内容
      isValid: this.validateQRCodeValue(value),
    };
  }

  /**
   * 验证二维码内容
   * @param {string} value - 要验证的内容
   * @returns {boolean}
   */
  static validateQRCodeValue(value) {
    if (!value || typeof value !== "string") {
      return false;
    }

    // 检查长度限制 (一般二维码最大容量约为4296个字符)
    if (value.length > 4000) {
      console.warn("二维码内容过长，可能无法正常识别");
      return false;
    }

    return true;
  }

  /**
   * 获取二维码配置，供React组件使用
   * @param {string} value - 二维码内容
   * @param {Object} options - 配置选项
   * @returns {Object} 二维码配置对象
   */
  static getQRCodeConfig(value, options = {}) {
    const {
      size = 200,
      backgroundColor = "white",
      color = "black",
      logo = null,
      logoSize = 50,
      logoBackgroundColor = "transparent",
    } = options;

    return {
      value,
      size,
      backgroundColor,
      color,
      logo,
      logoSize,
      logoBackgroundColor,
      // 其他可选配置
      quietZone: 10,
      enableLinearGradient: false,
      gradientDirection: ["0%", "0%", "100%", "100%"],
      linearGradient: ["rgb(255,0,0)", "rgb(0,255,255)"],
    };
  }
}
