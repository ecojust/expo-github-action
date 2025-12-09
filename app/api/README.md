# HTTP 请求工具类使用说明

这是一个为 React Native 项目设计的通用 HTTP 请求工具类，基于 axios 封装，提供了完整的请求拦截、响应处理、错误处理和重试机制。

## 安装依赖

```bash
# 运行安装脚本
chmod +x install-http-deps.sh && ./install-http-deps.sh

# 或手动安装
npm install axios
npx expo install @react-native-async-storage/async-storage
npm install --save-dev @types/axios
```

## 环境配置

复制 `.env.example` 为 `.env` 并配置你的 API 地址：

```env
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
EXPO_PUBLIC_API_TIMEOUT=10000
EXPO_PUBLIC_ENV=development
```

## 主要功能

### 1. 自动请求拦截

- 自动添加 Authorization token
- 添加设备信息和用户代理
- 请求日志记录

### 2. 响应处理

- 统一的响应数据格式
- 自动处理 token 过期（401）
- 响应日志记录

### 3. 错误处理

- 网络错误处理
- HTTP 状态码错误处理
- 自定义错误消息
- 可选的错误提示显示

### 4. 重试机制

- 支持请求失败自动重试
- 可配置重试次数
- 延迟重试避免频繁请求

### 5. 文件上传

- 支持 FormData 文件上传
- 上传进度回调
- 自动设置正确的 Content-Type

## 基本使用

```typescript
import httpClient from "./api/axios";

// GET 请求
const response = await httpClient.get("/users");

// POST 请求
const response = await httpClient.post("/users", {
  name: "John",
  email: "john@example.com",
});

// 带配置的请求
const response = await httpClient.get("/users", {
  retry: 2, // 失败时重试2次
  showLoading: true, // 显示加载状态
  showError: true, // 显示错误信息
});
```

## API 服务封装

推荐创建专门的 API 服务类：

```typescript
export class UserService {
  static async getUsers(): Promise<ApiResponse<User[]>> {
    return httpClient.get<User[]>("/users");
  }

  static async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    return httpClient.post<User>("/users", data);
  }
}
```

## Token 管理

```typescript
// 设置 token
await httpClient.setToken("your-jwt-token");

// 获取 token
const token = await httpClient.getToken();

// 清除 token
await httpClient.clearToken();
```

## 配置选项

### RequestConfig 接口

```typescript
interface RequestConfig extends AxiosRequestConfig {
  showLoading?: boolean; // 是否显示加载状态
  showError?: boolean; // 是否显示错误信息
  retry?: number; // 重试次数
}
```

### ApiResponse 接口

```typescript
interface ApiResponse<T = any> {
  code: number; // 状态码
  message: string; // 消息
  data: T; // 数据
  success: boolean; // 是否成功
}
```

## 文件上传示例

```typescript
const uploadFile = async (file: any) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await httpClient.upload("/upload", formData, {
    onUploadProgress: (progressEvent) => {
      const progress = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      console.log(`上传进度: ${progress}%`);
    },
  });

  return response;
};
```

## 自定义配置

```typescript
// 设置基础 URL
httpClient.setBaseURL("https://new-api.example.com");

// 设置超时时间
httpClient.setTimeout(15000);
```

## 错误处理

工具类会自动处理以下错误：

- 400: 请求参数错误
- 401: 未授权，自动清除 token
- 403: 拒绝访问
- 404: 请求地址不存在
- 500: 服务器内部错误
- 网络连接失败

## 注意事项

1. 确保在使用前配置正确的 API 基础地址
2. Token 会自动存储在 AsyncStorage 中
3. 401 错误会自动清除 token，需要重新登录
4. 可以根据项目需求自定义错误处理逻辑
5. 建议为不同的 API 模块创建专门的服务类
