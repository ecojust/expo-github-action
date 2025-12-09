import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// const host = process.env.EXPO_PUBLIC_API_URL || "http://139.224.0.239:50000";
const host = process.env.EXPO_PUBLIC_API_URL || "http://218.90.252.27:50000";

// const host = "https://mini-taskagent.b14f.com";

const xhr = axios.create({
  xsrfCookieName: "xsrf-token",
});

//请求拦截器
xhr.interceptors.request.use(
  async function (config) {
    config = await setConfig(config);
    // console.log(config);
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

//响应拦截器
xhr.interceptors.response.use(
  function (response) {
    // console.log("Response received:", response.data);

    switch (response.data.code) {
      case 200:
        return response.data;
      case 401:
        console.warn("当前令牌已过期，需要重新登录");
        // 可以在这里触发重新登录逻辑
        AsyncStorage.removeItem("token");
        break;
      default:
        console.error("API Error:", response.data.message);

        break;
    }
    return response.data;
  },
  function (res) {
    console.error("axios,Network Error:", res);
    return Promise.reject({
      messageCode: "sysError",
      res: res,
    });
  }
);

//设置请求头相关配置
async function setConfig(config) {
  const url = config.url;
  const token = await AsyncStorage.getItem("token");

  // console.log("发送请求携带token", token);

  config.headers = {
    Authorization: "Bearer " + token,
  };
  config.url = host + url;
  return config;
}

export function get(url, params) {
  return xhr({
    method: "GET",
    url: url,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    params: params,
  });
}

//form data
export function getFormdata(url, data) {
  return xhr({
    method: "GET",
    url: url,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    params: data, // GET 请求应该使用 params 而不是 data
  });
}

//query string parameters
export function postQuery(url, params) {
  return xhr({
    method: "POST",
    url: url,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    params: params,
  });
}

//request payload
export function postPayload(url, data) {
  return xhr({
    method: "POST",
    url: url,
    headers: { "Content-Type": "application/json;charset=utf-8" },
    data: data,
  });
}

//request payload
export function postBlob(url, data) {
  return xhr({
    method: "POST",
    url: url,
    headers: { "Content-Type": "application/json;charset=utf-8" },
    data: data,
    responseType: "blob",
  });
}

//form data
export function postFormdata(url, data) {
  return xhr({
    method: "POST",
    url: url,
    // 不要手动设置Content-Type，让axios自动处理FormData
    // axios会自动设置 "multipart/form-data; boundary=..."
    data: data,
  });
}

export function put(url, data) {
  return xhr({
    method: "PUT",
    url: url,
    headers: { "Content-Type": "application/json" },
    data: data,
  });
}

export function del(url, data) {
  return xhr({
    method: "DELETE",
    url: url,
    headers: { "Content-Type": "Content-Type: application/json" },
    data: data,
  });
}

// 结果封装成 [res, err] 的数组返回
function byRequest(p) {
  return p.then((res) => [res, undefined]).catch((err) => [undefined, err]);
}

/**
 * 处理get请求
 * @param p
 * @returns
 */
export async function Get({ url, params }) {
  const [res, err] = await byRequest(xhr.get(url, { params: params }));
  return [res, err];
}
/**
 * 处理post请求
 * @param p
 * @returns
 */
export async function Post({ url, data }) {
  const [res, err] = await byRequest(xhr.post(url, data));
  return [res, err];
}
