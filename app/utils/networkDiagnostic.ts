import { postPayload } from "../api/axios";

export const networkDiagnostic = async () => {
  console.log("=== 网络诊断开始 ===");

  // 1. 检查基本网络连接
  try {
    const response = await fetch("https://www.google.com", {
      method: "HEAD",
      mode: "no-cors",
    });
    console.log("✅ 基本网络连接正常");
  } catch (error) {
    console.log("❌ 基本网络连接失败:", error);
  }

  // 2. 检查API服务器连接
  const apiHost = "http://139.224.0.239:50000";
  try {
    const response = await fetch(apiHost, {
      method: "HEAD",
      timeout: 5000,
    });
    console.log("✅ API服务器可达");
  } catch (error) {
    console.log("❌ API服务器连接失败:", error);
  }

  // 3. 测试简单的API调用
  try {
    console.log("测试API调用...");
    const testResponse = await postPayload("/api/test", { test: true });
    console.log("✅ API调用测试成功:", testResponse);
  } catch (error) {
    console.log("❌ API调用测试失败:", error);
  }

  console.log("=== 网络诊断结束 ===");
};

// 检查网络状态的简单函数
export const checkNetworkStatus = async () => {
  try {
    const response = await fetch("https://httpbin.org/status/200", {
      method: "HEAD",
      timeout: 3000,
    });
    return response.ok;
  } catch (error) {
    console.log("网络状态检查失败:", error);
    return false;
  }
};
