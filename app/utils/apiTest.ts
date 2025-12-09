import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 简单的API测试函数
export const testApiConnection = async () => {
  console.log("=== API连接测试开始 ===");

  const baseURL = "http://139.224.0.239:50000";
  const endpoint = "/api/app/out-storage-record/out-storage-record";

  try {
    // 1. 测试基本连接
    console.log("1. 测试服务器连接...");
    const basicTest = await axios.get(baseURL, { timeout: 5000 });
    console.log("✅ 服务器连接成功");
  } catch (error) {
    console.log("❌ 服务器连接失败:", error.message);
  }

  try {
    // 2. 测试具体的API端点
    console.log("2. 测试API端点...");

    const token = await AsyncStorage.getItem("token");
    console.log("当前token:", token ? "已设置" : "未设置");

    const config = {
      method: "POST",
      url: baseURL + endpoint,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      data: {
        pageNumber: 1,
        pageSize: 10,
      },
      timeout: 10000,
    };

    console.log("请求配置:", config);

    const response = await axios(config);
    console.log("✅ API调用成功:", response.data);
  } catch (error) {
    console.log("❌ API调用失败:");
    console.log("错误类型:", error.constructor.name);
    console.log("错误消息:", error.message);

    if (error.response) {
      console.log("响应状态:", error.response.status);
      console.log("响应数据:", error.response.data);
      console.log("响应头:", error.response.headers);
    } else if (error.request) {
      console.log("请求已发送但无响应");
      console.log("请求详情:", error.request);
    } else {
      console.log("请求配置错误:", error.message);
    }
  }

  console.log("=== API连接测试结束 ===");
};

// 测试不同的HTTP方法
export const testDifferentMethods = async () => {
  const baseURL = "http://139.224.0.239:50000";
  const endpoint = "/api/app/out-storage-record/out-storage-record";
  const data = { pageNumber: 1, pageSize: 10 };

  const methods = ["GET", "POST"];

  for (const method of methods) {
    try {
      console.log(`测试 ${method} 方法...`);

      const config = {
        method,
        url: baseURL + endpoint,
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (method === "GET") {
        config.params = data;
      } else {
        config.data = data;
      }

      const response = await axios(config);
      console.log(`✅ ${method} 方法成功:`, response.data);
    } catch (error) {
      console.log(
        `❌ ${method} 方法失败:`,
        error.response?.status,
        error.message
      );
    }
  }
};
