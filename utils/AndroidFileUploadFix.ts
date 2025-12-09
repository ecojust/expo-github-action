/**
 * Android文件上传修复工具
 * 专门处理Android平台FormData上传的特殊问题
 */

import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

export interface AndroidFileUploadOptions {
  uri: string;
  fileName: string;
  mimeType?: string;
}

export class AndroidFileUploadFix {
  /**
   * 为Android平台创建特殊的FormData
   * @param options 文件选项
   * @returns FormData对象
   */
  static async createAndroidFormData(
    options: AndroidFileUploadOptions
  ): Promise<FormData> {
    const { uri, fileName, mimeType = "image/jpeg" } = options;

    if (Platform.OS !== "android") {
      throw new Error("此方法仅适用于Android平台");
    }

    try {
      // 确保URI格式正确
      let processedUri = uri;
      if (!uri.startsWith("file://")) {
        processedUri = `file://${uri}`;
      }

      // 验证文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(processedUri);
      if (!fileInfo.exists) {
        throw new Error(`文件不存在: ${processedUri}`);
      }

      console.log("Android file info:", fileInfo);

      const formData = new FormData();

      // Android特殊处理方式1: 使用标准格式
      const fileObject = {
        uri: processedUri,
        type: mimeType,
        name: fileName,
      };

      formData.append("file", fileObject as any);

      // 添加调试信息
      console.log("Android FormData created:", {
        uri: processedUri,
        type: mimeType,
        name: fileName,
        fileSize: fileInfo.size,
      });

      return formData;
    } catch (error) {
      console.error("Android FormData创建失败:", error);
      throw error;
    }
  }

  /**
   * 创建Android兼容的文件对象（方法2）
   * 使用不同的文件对象格式
   */
  static async createAndroidFormDataV2(
    options: AndroidFileUploadOptions
  ): Promise<FormData> {
    const { uri, fileName, mimeType = "image/jpeg" } = options;

    try {
      let processedUri = uri;
      if (!uri.startsWith("file://")) {
        processedUri = `file://${uri}`;
      }

      const formData = new FormData();

      // Android特殊处理方式2: 使用Blob-like对象
      const fileBlob = {
        uri: processedUri,
        type: mimeType,
        name: fileName,
        // 添加额外的属性可能有助于Android识别
        filename: fileName,
        contentType: mimeType,
      };

      formData.append("file", fileBlob as any);

      console.log("Android FormData V2 created:", fileBlob);
      return formData;
    } catch (error) {
      console.error("Android FormData V2创建失败:", error);
      throw error;
    }
  }

  /**
   * 创建Android兼容的文件对象（方法3）
   * 使用base64编码
   */
  static async createAndroidFormDataV3(
    options: AndroidFileUploadOptions
  ): Promise<FormData> {
    const { uri, fileName, mimeType = "image/jpeg" } = options;

    try {
      let processedUri = uri;
      if (!uri.startsWith("file://")) {
        processedUri = `file://${uri}`;
      }

      // 读取文件为base64
      const base64 = await FileSystem.readAsStringAsync(processedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const formData = new FormData();

      // 使用base64数据
      const dataUri = `data:${mimeType};base64,${base64}`;

      const fileObject = {
        uri: dataUri,
        type: mimeType,
        name: fileName,
      };

      formData.append("file", fileObject as any);

      console.log("Android FormData V3 (base64) created");
      return formData;
    } catch (error) {
      console.error("Android FormData V3创建失败:", error);
      throw error;
    }
  }

  /**
   * 尝试多种方法创建FormData
   * 按优先级尝试不同的方法
   */
  static async createFormDataWithFallback(
    options: AndroidFileUploadOptions
  ): Promise<FormData> {
    const methods = [
      this.createAndroidFormData,
      this.createAndroidFormDataV2,
      this.createAndroidFormDataV3,
    ];

    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(`尝试Android FormData方法 ${i + 1}`);
        const formData = await methods[i](options);
        console.log(`Android FormData方法 ${i + 1} 成功`);
        return formData;
      } catch (error) {
        console.warn(`Android FormData方法 ${i + 1} 失败:`, error);
        if (i === methods.length - 1) {
          throw error; // 所有方法都失败了
        }
      }
    }

    throw new Error("所有Android FormData创建方法都失败了");
  }

  /**
   * 检查Android文件上传的常见问题
   */
  static async diagnoseAndroidUploadIssues(uri: string): Promise<string[]> {
    const issues: string[] = [];

    try {
      // 检查URI格式
      if (!uri.startsWith("file://") && !uri.startsWith("content://")) {
        issues.push("URI格式可能不正确，应该以file://或content://开头");
      }

      // 检查文件是否存在
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        issues.push("文件不存在");
      } else {
        console.log("文件信息:", fileInfo);

        // 检查文件大小
        if (fileInfo.size === 0) {
          issues.push("文件大小为0");
        }

        // 检查文件权限（如果可能）
        if (!fileInfo.isDirectory && fileInfo.size > 0) {
          try {
            // 尝试读取文件的一小部分来检查权限
            await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
              length: 100,
            });
          } catch (error) {
            issues.push("文件读取权限问题");
          }
        }
      }
    } catch (error) {
      issues.push(`文件检查失败: ${error.message}`);
    }

    return issues;
  }
}

export default AndroidFileUploadFix;
