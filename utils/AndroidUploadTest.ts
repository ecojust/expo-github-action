/**
 * Android上传测试工具
 * 专门用于测试和调试Android平台的文件上传问题
 */

import { Platform, Alert } from "react-native";
import * as FileSystem from "expo-file-system";

export class AndroidUploadTest {
  /**
   * 测试基本网络连接
   */
  static async testNetworkConnection(): Promise<void> {
    console.log("=== 测试网络连接 ===");

    const testUrls = [
      "https://www.google.com",
      "http://139.224.0.239:50000",
      process.env.EXPO_PUBLIC_API_URL || "http://139.224.0.239:50000",
    ];

    for (const url of testUrls) {
      try {
        console.log(`测试连接: ${url}`);
        const response = await fetch(url, {
          method: "HEAD",
          timeout: 5000,
        });
        console.log(`✅ ${url} - 状态: ${response.status}`);
      } catch (error) {
        console.error(`❌ ${url} - 失败:`, error.message);
      }
    }
  }

  /**
   * 测试简单的POST请求
   */
  static async testSimplePost(): Promise<void> {
    console.log("=== 测试简单POST请求 ===");

    const host =
      process.env.EXPO_PUBLIC_API_URL || "http://139.224.0.239:50000";
    const testUrl = `${host}/api/test`; // 假设有一个测试端点

    try {
      const response = await fetch(testUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ test: "data" }),
      });

      console.log("POST响应状态:", response.status);
      const responseText = await response.text();
      console.log("POST响应内容:", responseText);
    } catch (error) {
      console.error("POST请求失败:", error);
    }
  }

  /**
   * 测试FormData上传（使用fetch）
   */
  static async testFormDataUpload(
    imageUri: string,
    fileName: string
  ): Promise<void> {
    console.log("=== 测试FormData上传 (Fetch) ===");

    try {
      // 处理URI
      let processedUri = imageUri;
      if (Platform.OS === "android" && !imageUri.startsWith("file://")) {
        processedUri = `file://${imageUri}`;
      }

      // 验证文件
      const fileInfo = await FileSystem.getInfoAsync(processedUri);
      console.log("文件信息:", fileInfo);

      if (!fileInfo.exists) {
        throw new Error("文件不存在");
      }

      // 创建FormData
      const formData = new FormData();
      formData.append("file", {
        uri: processedUri,
        type: "image/jpeg",
        name: fileName,
      } as any);

      const host =
        process.env.EXPO_PUBLIC_API_URL || "http://139.224.0.239:50000";
      const uploadUrl = `${host}/api/File/UploadFile`;

      console.log("上传URL:", uploadUrl);
      console.log("开始Fetch上传...");

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          // 不设置Content-Type，让浏览器自动设置
        },
      });

      console.log("Fetch响应状态:", response.status);
      console.log(
        "Fetch响应头:",
        Object.fromEntries(response.headers.entries())
      );

      const responseText = await response.text();
      console.log("Fetch响应内容:", responseText);

      if (response.ok) {
        console.log("✅ Fetch上传成功");
        Alert.alert("成功", "Fetch上传测试成功");
      } else {
        console.error("❌ Fetch上传失败");
        Alert.alert("失败", `Fetch上传失败: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Fetch上传测试失败:", error);
      Alert.alert("错误", `Fetch测试失败: ${error.message}`);
    }
  }

  /**
   * 测试FileSystem.uploadAsync
   */
  static async testFileSystemUpload(
    imageUri: string,
    fileName: string
  ): Promise<void> {
    console.log("=== 测试FileSystem.uploadAsync ===");

    try {
      // 处理URI
      let processedUri = imageUri;
      if (Platform.OS === "android" && !imageUri.startsWith("file://")) {
        processedUri = `file://${imageUri}`;
      }

      const host =
        process.env.EXPO_PUBLIC_API_URL || "http://139.224.0.239:50000";
      const uploadUrl = `${host}/api/File/UploadFile`;

      console.log("FileSystem上传URL:", uploadUrl);
      console.log("FileSystem上传URI:", processedUri);

      const uploadResult = await FileSystem.uploadAsync(
        uploadUrl,
        processedUri,
        {
          httpMethod: FileSystem.FileSystemUploadType.MULTIPART,
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          fieldName: "file",
          mimeType: "image/jpeg",
          headers: {
            Accept: "application/json",
          },
        }
      );

      console.log("FileSystem上传结果:", uploadResult);

      if (uploadResult.status === 200) {
        console.log("✅ FileSystem上传成功");
        Alert.alert("成功", "FileSystem上传测试成功");
      } else {
        console.error("❌ FileSystem上传失败");
        Alert.alert("失败", `FileSystem上传失败: ${uploadResult.status}`);
      }
    } catch (error) {
      console.error("❌ FileSystem上传测试失败:", error);
      Alert.alert("错误", `FileSystem测试失败: ${error.message}`);
    }
  }

  /**
   * 完整的上传测试套件
   */
  static async runFullUploadTest(
    imageUri: string,
    fileName: string
  ): Promise<void> {
    console.log("=== 开始完整上传测试 ===");
    console.log("平台:", Platform.OS);
    console.log("图片URI:", imageUri);
    console.log("文件名:", fileName);

    // 1. 测试网络连接
    await this.testNetworkConnection();

    // 等待1秒
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 2. 测试简单POST
    await this.testSimplePost();

    // 等待1秒
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 3. 测试Fetch上传
    await this.testFormDataUpload(imageUri, fileName);

    // 等待1秒
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 4. 测试FileSystem上传
    await this.testFileSystemUpload(imageUri, fileName);

    console.log("=== 完整上传测试结束 ===");
  }

  /**
   * 快速诊断Android上传问题
   */
  static async quickDiagnose(imageUri: string): Promise<string[]> {
    const issues: string[] = [];

    try {
      console.log("=== 快速诊断Android上传问题 ===");

      // 1. 检查平台
      if (Platform.OS !== "android") {
        issues.push("当前不是Android平台");
        return issues;
      }

      // 2. 检查文件URI
      let processedUri = imageUri;
      if (!imageUri.startsWith("file://")) {
        processedUri = `file://${imageUri}`;
        issues.push("URI格式已自动修正为file://格式");
      }

      // 3. 检查文件存在
      const fileInfo = await FileSystem.getInfoAsync(processedUri);
      if (!fileInfo.exists) {
        issues.push("文件不存在");
      } else if (fileInfo.size === 0) {
        issues.push("文件大小为0");
      }

      // 4. 检查网络连接
      try {
        const host =
          process.env.EXPO_PUBLIC_API_URL || "http://139.224.0.239:50000";
        const response = await fetch(host, { method: "HEAD", timeout: 5000 });
        if (!response.ok) {
          issues.push(`服务器连接异常: ${response.status}`);
        }
      } catch (networkError) {
        issues.push(`网络连接失败: ${networkError.message}`);
      }

      // 5. 检查HTTP vs HTTPS
      const host =
        process.env.EXPO_PUBLIC_API_URL || "http://139.224.0.239:50000";
      if (host.startsWith("http://")) {
        issues.push("使用HTTP协议，Android可能需要网络安全配置");
      }

      console.log("诊断结果:", issues);
      return issues;
    } catch (error) {
      issues.push(`诊断过程出错: ${error.message}`);
      return issues;
    }
  }
}

export default AndroidUploadTest;
