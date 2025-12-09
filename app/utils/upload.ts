import FileUploadUtils from "@/utils/FileUploadUtils";
import { uploadFile, getUploadUrl } from "@/app/api/common";
import AndroidNetworkFix from "@/utils/AndroidNetworkFix";
import AndroidUploadTest from "@/utils/AndroidUploadTest";
import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";
import ToastManager, { Toast } from "expo-react-native-toastify";

export default class Upload {
  static async uploadImageFile(imageUri: string, fileName: string) {
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

  static async faceRecognize(url: string, imageUri: string, userName: string) {
    console.log(url, imageUri, userName);

    // const url = getUploadUrl();
    // 创建FormData
    const formData = new FormData();

    const fileName = `face_${new Date().getTime()}.jpg`;

    const fileObject = {
      uri: imageUri,
      type: fileName.toLowerCase().endsWith(".png")
        ? "image/png"
        : "image/jpeg",
      name: fileName,
    };

    formData.append("file", fileObject as any);
    formData.append("userName", userName);

    console.log("正在人脸识别", formData);

    // 使用fetch上传
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
        // 不设置Content-Type，让浏览器自动设置
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("error", errorText);

      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log("face path", result);

    return result;
  }
}
