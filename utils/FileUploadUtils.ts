/**
 * 文件上传工具类
 * 处理Android和iOS平台的文件上传差异
 */

import { Platform, Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import AndroidFileUploadFix from "./AndroidFileUploadFix";

export interface FileUploadOptions {
  uri: string;
  fileName?: string;
  mimeType?: string;
  quality?: number;
}

export interface FileInfo {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

export class FileUploadUtils {
  /**
   * 创建适用于FormData的文件对象
   * @param options 文件选项
   * @returns 格式化的文件信息
   */
  static async createFileForUpload(
    options: FileUploadOptions
  ): Promise<FileInfo> {
    const { uri, fileName, mimeType, quality = 0.8 } = options;

    try {
      // 处理URI格式
      let processedUri = uri;

      if (Platform.OS === "android") {
        // Android平台URI处理
        if (!uri.startsWith("file://")) {
          processedUri = `file://${uri}`;
        }

        // 检查文件是否存在
        const fileExists = await FileSystem.getInfoAsync(processedUri);
        if (!fileExists.exists) {
          throw new Error(`文件不存在: ${processedUri}`);
        }

        console.log("Android file info:", fileExists);
      } else if (Platform.OS === "ios") {
        // iOS平台URI处理
        processedUri = uri;

        // 检查文件是否存在
        const fileExists = await FileSystem.getInfoAsync(processedUri);
        if (!fileExists.exists) {
          throw new Error(`文件不存在: ${processedUri}`);
        }

        console.log("iOS file info:", fileExists);
      }

      // 生成文件名
      const finalFileName = fileName || this.generateFileName(uri);

      // 确定MIME类型
      const finalMimeType = mimeType || this.getMimeTypeFromUri(uri);

      // 获取文件大小
      let fileSize: number | undefined;
      try {
        const fileInfo = await FileSystem.getInfoAsync(processedUri);
        fileSize = fileInfo.size;
      } catch (error) {
        console.warn("无法获取文件大小:", error);
      }

      const fileInfo: FileInfo = {
        uri: processedUri,
        type: finalMimeType,
        name: finalFileName,
        size: fileSize,
      };

      console.log("Created file info:", fileInfo);
      return fileInfo;
    } catch (error) {
      console.error("创建文件对象失败:", error);
      throw error;
    }
  }

  /**
   * 创建FormData对象
   * @param fileInfo 文件信息
   * @param fieldName 字段名称，默认为'file'
   * @returns FormData对象
   */
  static async createFormData(
    fileInfo: FileInfo,
    fieldName: string = "file"
  ): Promise<FormData> {
    // 根据平台创建不同的文件对象
    if (Platform.OS === "android") {
      // Android使用专门的修复方法
      try {
        return await AndroidFileUploadFix.createFormDataWithFallback({
          uri: fileInfo.uri,
          fileName: fileInfo.name,
          mimeType: fileInfo.type,
        });
      } catch (error) {
        console.error("Android FormData创建失败，使用标准方法:", error);
        // 如果Android特殊方法失败，回退到标准方法
        const formData = new FormData();
        formData.append(fieldName, {
          uri: fileInfo.uri,
          type: fileInfo.type,
          name: fileInfo.name,
        } as any);
        return formData;
      }
    } else {
      // iOS使用标准方法
      const formData = new FormData();
      formData.append(fieldName, {
        uri: fileInfo.uri,
        type: fileInfo.type,
        name: fileInfo.name,
      } as any);
      return formData;
    }
  }

  /**
   * 从URI生成文件名
   * @param uri 文件URI
   * @returns 生成的文件名
   */
  static generateFileName(uri: string): string {
    const timestamp = Date.now();
    const extension = this.getFileExtension(uri);
    return `upload_${timestamp}.${extension}`;
  }

  /**
   * 从URI获取文件扩展名
   * @param uri 文件URI
   * @returns 文件扩展名
   */
  static getFileExtension(uri: string): string {
    const parts = uri.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "jpg";
  }

  /**
   * 根据URI确定MIME类型
   * @param uri 文件URI
   * @returns MIME类型
   */
  static getMimeTypeFromUri(uri: string): string {
    const extension = this.getFileExtension(uri);

    const mimeTypes: { [key: string]: string } = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      bmp: "image/bmp",
      tiff: "image/tiff",
      svg: "image/svg+xml",
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      txt: "text/plain",
      mp4: "video/mp4",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      mp3: "audio/mpeg",
      wav: "audio/wav",
    };

    return mimeTypes[extension] || "application/octet-stream";
  }

  /**
   * 验证文件类型
   * @param uri 文件URI
   * @param allowedTypes 允许的文件类型数组
   * @returns 是否为允许的类型
   */
  static validateFileType(uri: string, allowedTypes: string[]): boolean {
    const extension = this.getFileExtension(uri);
    return allowedTypes.includes(extension);
  }

  /**
   * 验证文件大小
   * @param fileSize 文件大小（字节）
   * @param maxSize 最大允许大小（字节）
   * @returns 是否在允许范围内
   */
  static validateFileSize(fileSize: number, maxSize: number): boolean {
    return fileSize <= maxSize;
  }

  /**
   * 格式化文件大小显示
   * @param bytes 字节数
   * @returns 格式化的大小字符串
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * 压缩图片（如果需要）
   * @param uri 图片URI
   * @param quality 压缩质量 0-1
   * @returns 压缩后的URI
   */
  static async compressImage(
    uri: string,
    quality: number = 0.8
  ): Promise<string> {
    try {
      // 这里可以集成图片压缩库，如 expo-image-manipulator
      // 暂时返回原URI
      return uri;
    } catch (error) {
      console.error("图片压缩失败:", error);
      return uri;
    }
  }

  /**
   * 完整的文件上传准备流程
   * @param options 上传选项
   * @returns 准备好的FormData
   */
  static async prepareFileForUpload(
    options: FileUploadOptions
  ): Promise<FormData> {
    try {
      // 验证文件类型（如果指定了）
      const allowedImageTypes = ["jpg", "jpeg", "png", "gif", "webp"];
      if (!this.validateFileType(options.uri, allowedImageTypes)) {
        throw new Error("不支持的文件类型");
      }

      // 创建文件信息
      const fileInfo = await this.createFileForUpload(options);

      // 验证文件大小（10MB限制）
      if (
        fileInfo.size &&
        !this.validateFileSize(fileInfo.size, 10 * 1024 * 1024)
      ) {
        throw new Error(`文件过大: ${this.formatFileSize(fileInfo.size)}`);
      }

      // 创建FormData
      const formData = await this.createFormData(fileInfo);

      console.log("文件上传准备完成:", {
        platform: Platform.OS,
        fileName: fileInfo.name,
        fileSize: fileInfo.size
          ? this.formatFileSize(fileInfo.size)
          : "Unknown",
        mimeType: fileInfo.type,
      });

      return formData;
    } catch (error) {
      console.error("文件上传准备失败:", error);
      throw error;
    }
  }
}

export default FileUploadUtils;
