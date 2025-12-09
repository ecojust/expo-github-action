# Android 原生模块测试项目

这是一个用于测试在 TSX 页面中调用 Android 原生模块的 Expo 项目，包含了打印机 SDK 集成功能。

## 项目结构

```
my-app/
├── App.tsx                          # 主应用页面，测试原生模块调用
├── src/
│   └── NativeTestModule.ts         # TypeScript 接口定义
├── android/
│   └── app/src/main/java/com/jusizanggmail/myapp/
│       ├── MainActivity.kt         # 主活动
│       ├── MainApplication.kt      # 主应用类
│       ├── NativeTestModule.kt     # Android 原生模块实现
│       └── NativeTestPackage.kt    # 原生模块包
│   └── app/src/main/libs/
│       └── 4.0.0-release.aar       # 打印机 SDK AAR 包
└── package.json
```

## 功能特性

### 原生模块功能

1. **问候消息**: `hello()` - 返回来自 Android 原生模块的问候消息
2. **配置设置**: `setOptions()` - 向原生模块传递配置选项
3. **设备信息**: `getDeviceInfo()` - 获取详细的 Android 设备信息
4. **Toast 显示**: `showToast()` - 显示 Android Toast 消息
5. **打印机功能**:
   - `initPrinter()` - 初始化打印机 SDK
   - `connectPrinter()` - 连接到指定地址的打印机
   - `printText()` - 打印文本内容
   - `getPrinterStatus()` - 获取打印机状态信息

### TSX 页面功能

- 应用启动时自动调用问候和配置方法
- 按钮触发获取设备信息
- 按钮触发显示 Toast
- 显示详细设备信息（品牌、型号、制造商、设备名、Android版本、SDK版本）
- 打印机功能测试界面：
  - 初始化打印机 SDK
  - 输入打印机地址并连接
  - 输入文本内容并打印
  - 获取和显示打印机状态
- 完善的错误处理和加载状态
- 滚动界面支持多个功能模块

## 运行项目

1. 确保 Android 开发环境已设置
2. 启动 Android 模拟器或连接 Android 设备
3. 安装依赖并运行：

```bash
cd my-app
npm install
npm run android
```

或使用启动脚本：

```bash
./start-android.sh
```

## AAR 包集成说明

项目集成了 `com.gengcon.www.jcprintersdk` 打印机 SDK：

1. **AAR 位置**: `android/app/src/main/libs/4.0.0-release.aar`
2. **Gradle 配置**: 在 `build.gradle` 中添加了 flatDir 仓库和 AAR 依赖
3. **原生调用**: 在 `NativeTestModule.kt` 中导入并调用 AAR 包的方法

## 原生模块说明

### Android 实现 (Kotlin)

- **NativeTestModule.kt**: 主要的原生模块实现，包含打印机 SDK 调用
- **NativeTestPackage.kt**: 模块包，用于注册原生模块
- **MainApplication.kt**: 在应用中注册原生模块包

### TypeScript 接口

- **NativeTestModule.ts**: 提供类型安全的接口定义，包含打印机方法类型

## 测试内容

1. **异步调用测试**: 页面加载时显示原生模块返回的问候消息
2. **设备信息测试**: 点击按钮获取并显示详细设备信息
3. **Toast 测试**: 点击按钮显示 Android Toast 消息
4. **打印机 SDK 测试**:
   - 初始化打印机 SDK
   - 连接指定 IP 地址的打印机
   - 打印自定义文本内容
   - 获取打印机状态信息
5. **错误处理**: 捕获和显示调用失败的情况

## 故障排除

如果遇到问题：

1. 确保 Android 开发环境正确设置
2. 确保 AAR 包位于正确位置
3. 清理并重新构建项目：
   ```bash
   npx expo run:android --clear
   ```
4. 检查 Android 日志：
   ```bash
   adb logcat
   ```
5. 确保设备/模拟器正在运行：
   ```bash
   adb devices
   ```

## 打印机 SDK 使用说明

本项目演示了如何在 React Native 中集成第三方 AAR 包：

1. **添加 AAR 依赖**: 将 AAR 文件放入 `libs` 目录并在 `build.gradle` 中配置
2. **原生模块封装**: 在 Kotlin 中创建 React Native 模块来调用 AAR 方法
3. **TypeScript 接口**: 提供类型安全的 JavaScript 接口
4. **React 组件调用**: 在 TSX 组件中调用原生方法

这个项目演示了完整的 React Native 原生模块开发流程，包括第三方 SDK 集成。
