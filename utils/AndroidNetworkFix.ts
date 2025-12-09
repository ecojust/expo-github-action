/**
 * Android网络请求修复工具
 * 专门解决Android平台的网络请求问题
 */

import { Platform, Alert } from "react-native";
import * as FileSystem from "expo-file-system";

export interface AndroidUploadOptions {
  uri: string;
  fileName: string;
  uploadUrl: string;
  fieldName?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export class AndroidNetworkFix {
  /**
   * 使用FileSystem.uploadAsync进行Android文件上传
   * 这是专门为Android优化的上传方法
   */
  static async uploadWithFileSystem(
    options: AndroidUploadOptions
  ): Promise<any> {
    const {
      uri,
      fileName,
      uploadUrl,
      fieldName = "file",
      headers = {},
      timeout = 30000,
    } = options;

    try {
      console.log("=== 使用FileSystem.uploadAsync上传 ===");
      console.log("URI:", uri);
      console.log("文件名:", fileName);
      console.log("上传URL:", uploadUrl);
      console.log("平台:", Platform.OS);

      // 处理URI格式
      let processedUri = uri;
      if (Platform.OS === "android" && !uri.startsWith("file://")) {
        processedUri = `file://${uri}`;
      }

      // 验证文件存在
      const fileInfo = await FileSystem.getInfoAsync(processedUri);
      if (!fileInfo.exists) {
        throw new Error("文件不存在");
      }

      console.log("文件信息:", fileInfo);

      // 准备上传参数
      const uploadOptions: FileSystem.FileSystemUploadOptions = {
        httpMethod: FileSystem.FileSystemUploadType.MULTIPART,
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: fieldName,
        mimeType: fileName.toLowerCase().endsWith(".png")
          ? "image/png"
          : "image/jpeg",
        parameters: {
          // 可以添加额外的表单参数
        },
        headers: {
          Accept: "application/json",
          ...headers,
        },
      };

      console.log("上传选项:", uploadOptions);

      // 执行上传
      const uploadResult = await FileSystem.uploadAsync(
        uploadUrl,
        processedUri,
        uploadOptions
      );

      console.log("FileSystem上传结果:", uploadResult);

      // 解析响应
      if (uploadResult.status === 200) {
        try {
          const responseData = JSON.parse(uploadResult.body);
          console.log("解析后的响应:", responseData);
          return responseData;
        } catch (parseError) {
          console.warn("响应解析失败，返回原始响应:", uploadResult.body);
          return { success: true, data: uploadResult.body };
        }
      } else {
        throw new Error(
          `上传失败，状态码: ${uploadResult.status}, 响应: ${uploadResult.body}`
        );
      }
    } catch (error) {
      console.error("FileSystem上传失败:", error);
      throw error;
    }
  }

  /**
   * 创建Android兼容的FormData（使用base64）
   */
  static async createBase64FormData(
    uri: string,
    fileName: string
  ): Promise<FormData> {
    try {
      console.log("=== 创建Base64 FormData ===");

      let processedUri = uri;
      if (Platform.OS === "android" && !uri.startsWith("file://")) {
        processedUri = `file://${uri}`;
      }

      // 读取文件为base64
      const base64String = await FileSystem.readAsStringAsync(processedUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log("Base64长度:", base64String.length);

      // 创建FormData
      const formData = new FormData();

      // 方法1: 使用base64字符串
      formData.append("file", base64String);
      formData.append("fileName", fileName);
      formData.append(
        "mimeType",
        fileName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg"
      );

      return formData;
    } catch (error) {
      console.error("创建Base64 FormData失败:", error);
      throw error;
    }
  }

  /**
   * 使用fetch API进行上传（Android兼容性更好）
   */
  static async uploadWithFetch(options: AndroidUploadOptions): Promise<any> {
    const {
      uri,
      fileName,
      uploadUrl,
      fieldName = "file",
      headers = {},
      timeout = 30000,
    } = options;

    try {
      let processedUri = uri;
      if (Platform.OS === "android" && !uri.startsWith("file://")) {
        processedUri = `file://${uri}`;
      }

      // 创建FormData
      const formData = new FormData();

      const fileObject = {
        uri: processedUri,
        type: fileName.toLowerCase().endsWith(".png")
          ? "image/png"
          : "image/jpeg",
        name: fileName,
      };

      formData.append(fieldName, fileObject as any);

      // 使用fetch上传
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          // 不设置Content-Type，让浏览器自动设置
          ...headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      return result;
    } catch (error) {
      console.error("Fetch上传失败:", error);
      throw error;
    }
  }

  /**
   * 多种方法尝试上传（回退机制）
   */
  static async uploadWithFallback(options: AndroidUploadOptions): Promise<any> {
    console.log("=== 开始多方法上传尝试 ===");

    const methods = [
      {
        name: "Fetch API",
        method: () => this.uploadWithFetch(options),
      },
      {
        name: "FileSystem.uploadAsync",
        method: () => this.uploadWithFileSystem(options),
      },
    ];

    for (let i = 0; i < methods.length; i++) {
      const { name, method } = methods[i];

      try {
        console.log(`尝试方法 ${i + 1}: ${name}`);
        const result = await method();
        console.log(`✅ ${name} 上传成功`);
        return result;
      } catch (error) {
        console.error(`❌ ${name} 上传失败:`, error);

        if (i === methods.length - 1) {
          // 所有方法都失败了
          throw new Error(
            `所有上传方法都失败了。最后一个错误: ${error.message}`
          );
        }
      }
    }
  }

  /**
   * 检查网络连接
   */
  static async checkNetworkConnection(testUrl: string): Promise<boolean> {
    try {
      console.log("检查网络连接:", testUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(testUrl, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("网络检查结果:", response.status);
      return response.ok;
    } catch (error) {
      console.error("网络检查失败:", error);
      return false;
    }
  }

  /**
   * 诊断Android网络问题
   */
  static async diagnoseNetworkIssues(uploadUrl: string): Promise<string[]> {
    const issues: string[] = [];

    try {
      console.log("=== 诊断Android网络问题 ===");

      // 1. 检查URL格式
      if (
        !uploadUrl.startsWith("http://") &&
        !uploadUrl.startsWith("https://")
      ) {
        issues.push("URL格式错误，应该以http://或https://开头");
      }

      // 2. 检查网络连接
      const baseUrl = uploadUrl.split("/api")[0];
      const networkOk = await this.checkNetworkConnection(baseUrl);
      if (!networkOk) {
        issues.push("无法连接到服务器");
      }

      // 3. 检查HTTPS证书（如果是HTTPS）
      if (uploadUrl.startsWith("https://")) {
        try {
          await fetch(uploadUrl, { method: "HEAD" });
        } catch (error) {
          if (
            error.message.includes("certificate") ||
            error.message.includes("SSL")
          ) {
            issues.push("HTTPS证书问题");
          }
        }
      }

      // 4. 检查Android网络安全配置
      if (Platform.OS === "android" && uploadUrl.startsWith("http://")) {
        issues.push("Android可能阻止HTTP请求，建议使用HTTPS或配置网络安全策略");
      }

      console.log("诊断结果:", issues);
      return issues;
    } catch (error) {
      console.error("诊断失败:", error);
      issues.push(`诊断过程出错: ${error.message}`);
      return issues;
    }
  }
}

export default AndroidNetworkFix;
