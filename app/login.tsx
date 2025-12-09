import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  BackHandler,
} from "react-native";
import { useRouter } from "expo-router";
import FaceRecognition from "./components/FaceRecognition";
import AnimatedBackground from "./components/AnimatedBackground";
import VersionModal from "./components/VersionModal";
import * as Notifications from "expo-notifications";
import { NotificationService } from "../services/NotificationService";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NativeTestModule, {
  DeviceInfo,
} from "./pages/productIn/NativeTestModule";
import { CameraView, useCameraPermissions } from "expo-camera";

import { login, loginFaceUrl } from "@/app/api/system";
import Upload from "./utils/upload";
import BluetoothService from "./utils/BluetoothService";

import * as PX from "@/app/pages/config";

// 防止 SplashScreen 自动隐藏
SplashScreen.preventAutoHideAsync();

export default function LoginScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [faceVisible, setFaceVisible] = useState(false);
  const [versionModalVisible, setVersionModalVisible] = useState(false);
  const [loaded, error] = useFonts({
    // SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    // XinHuaFangSongTi: require("../assets/fonts/XinHuaFangSongTi.ttf"),
    SongTi: require("../assets/fonts/SongTi.ttf"),
  });

  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  const loginWithFace = async () => {
    const hasPermission = await getCameraPermissions();
    if (hasPermission) {
      setFaceVisible(true);
    }
  };

  const getCameraPermissions = async () => {
    if (!permission?.granted) {
      const permissionResult = await requestPermission();
      if (!permissionResult.granted) {
        Alert.alert("权限被拒绝", "需要相机权限才能进行人脸识别");
        return false;
      }
      return true;
    }
    return true;
  };

  const loginWithAccount = async () => {
    try {
      const res = await login({ userName: username, password });
      console.log("loginWithAccount", res);

      await AsyncStorage.setItem("token", res?.data);
      // @ts-ignore
      await AsyncStorage.setItem("mac", res?.otherData.mac);
      // @ts-ignore
      await AsyncStorage.setItem("permission", res?.otherData.permission);

      await AsyncStorage.setItem("username", username);
      //@ts-ignore
      if (res?.code === 200) {
        // 清空路由栈并导航到菜单页
        router.dismissAll();
        router.replace("/menus");
        NativeTestModule.showToast("登录成功");
      } else {
        NativeTestModule.showToast("登录失败");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const varifyFrame = async (frameData: {
    uri: string;
    base64?: string;
  }): Promise<boolean> => {
    // console.log("verifyFrame", frameData.uri);

    try {
      const res = await Upload.faceRecognize(
        loginFaceUrl(),
        frameData.uri,
        username
      );
      console.log("loginWithFace", res);
      const pass = res?.code === 200;
      if (pass) {
        await AsyncStorage.setItem("token", res?.data);
        await AsyncStorage.setItem("mac", res?.otherData?.mac);
        await AsyncStorage.setItem("username", username);
        // @ts-ignore
        await AsyncStorage.setItem("permission", res?.otherData.permission);
      }

      return pass;
    } catch (error) {
      console.error("Face recognition failed:", error);
      return false;
    }
  };

  const initUser = async () => {
    const username = await AsyncStorage.getItem("username");
    if (username) {
      setUsername(username);
    }
  };

  const initializeBluetooth = async () => {
    try {
      // 请求权限
      const hasPermission =
        await BluetoothService.requestBluetoothPermissions();
      if (!hasPermission) {
        Alert.alert("权限错误", "需要蓝牙权限才能使用此功能");
        return;
      }

      // 检查蓝牙可用性
      const isAvailable = await BluetoothService.isBluetoothAvailable();
      if (!isAvailable) {
        Alert.alert("蓝牙不可用", "此设备不支持蓝牙功能");
        return;
      }

      // 检查蓝牙是否启用
      const isEnabled = await BluetoothService.isBluetoothEnabled();
      if (!isEnabled) {
        const enabled = await BluetoothService.enableBluetooth();
        if (!enabled) {
          Alert.alert("蓝牙未启用", "请启用蓝牙后重试");
          return;
        }
      }
    } catch (error) {
      console.error("初始化蓝牙失败:", error);
      Alert.alert("错误", "初始化蓝牙失败");
    } finally {
      // setIsLoading(false);
    }
  };

  useEffect(() => {
    // 注册通知权限
    NotificationService.registerForPushNotificationsAsync().then((token) => {
      console.log("Push Notification Token:", token);
    });
    console.log("useEffect:", 999);

    // 监听收到通知
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("收到通知:", notification);
      });

    // 监听点击通知
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("点击通知:", response);
      });

    initializeBluetooth();
    // getCameraPermissions();
    initUser();
    return () => {
      // Notifications.removeNotificationSubscription(
      //   notificationListener.current
      // );
      // Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // 单独处理字体加载完成后隐藏 SplashScreen
  useEffect(() => {
    if (loaded || error) {
      // 字体加载完成或出错时隐藏 SplashScreen
      SplashScreen.hideAsync().catch((err) => {
        console.warn("Failed to hide splash screen:", err);
      });
    }
  }, [loaded, error]);

  // 如果字体还没加载完成，返回 null 让 SplashScreen 继续显示
  if (!loaded && !error) {
    return null;
  }

  return (
    <AnimatedBackground
      source={require("../assets/images/background.png")}
      duration={600}
    >
      <View style={styles.container}>
        <View style={styles.overlay} />

        {/* 版本信息图标 */}
        <TouchableOpacity
          style={styles.versionIcon}
          onPress={() => setVersionModalVisible(true)}
        >
          <Text style={styles.versionIconText}>ⓘ</Text>
        </TouchableOpacity>

        <Text style={styles.title}>SPC-Pro管理平台</Text>
        <View style={styles.inputContainer}>
          {/* <View style={styles.labelRow}>
            <Text style={styles.label}>账号</Text>
          </View> */}

          <View>
            <TouchableOpacity activeOpacity={0.7}>
              <View style={styles.labelRow}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>账号</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="请输入账号"
            placeholderTextColor="#999"
          />

          <View style={{ height: 20 }} />
          {/* 密码区域 */}
          <View>
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <View style={styles.labelRow}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>密码</Text>
                  <Text style={styles.arrow}>{showPassword ? "▲" : "▼"}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {showPassword && (
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="请输入密码"
              placeholderTextColor="#999"
            />
          )}
        </View>
        <TouchableOpacity
          style={styles.faceButton}
          onPress={async () => {
            if (showPassword) {
              await loginWithAccount();
            } else {
              await loginWithFace();
            }
          }}
        >
          <Text style={styles.faceButtonText}>
            {showPassword ? "账号登录" : "人脸识别"}
          </Text>
        </TouchableOpacity>

        <FaceRecognition
          visible={faceVisible}
          onClose={() => {
            setFaceVisible(false);
            // router.replace("/menus");
          }}
          onSuccess={async () => {
            setFaceVisible(false);
            // 清空路由栈并导航到菜单页
            router.dismissAll();
            router.replace("/menus");
            NativeTestModule.showToast("登录成功");
          }}
          onFrameCapture={async (frameData: { uri: string; base64?: string }) =>
            varifyFrame(frameData)
          }
        />

        <VersionModal
          visible={versionModalVisible}
          onClose={() => setVersionModalVisible(false)}
        />
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative", // 确保 overlay 不会遮挡内容
    fontFamily: "SongTi",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -10, // 调整为更低的层级，确保不会遮挡输入框
    opacity: 0.3,
    backgroundColor: "rgba(247, 250, 255, 0.8)", // 使用半透明白色覆盖层
  },
  title: {
    fontSize: PX.n32,
    color: "#2563eb",
    marginBottom: 60,
    marginTop: -60,
    textAlign: "center",
    fontWeight: "700",
    // fontFamily: "SongTi",
  },
  inputContainer: {
    width: "85%",
    marginBottom: 40,
  },

  labelRow: {
    fontSize: PX.h24,
    color: "#222",
    marginBottom: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  label: {
    fontSize: PX.h24,
    color: "#222",
    marginBottom: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "SongTi",
  },
  arrow: {
    position: "absolute",
    right: "-50%",
    // right: -10,
    top: "50%",
    transform: [{ translateY: "-50%" }],
    fontSize: PX.h20,
    // color: "#2563eb",
    color: "#000000",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    // backgroundColor: "transparent",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: PX.n25,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: PX.n20,
    height: 50,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    fontFamily: "SongTi",
  },
  input: {
    // flex: 1,
    fontSize: PX.h18,
    // color: "#222",
    // fontFamily: "SongTi",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n30,
    paddingHorizontal: PX.n15,
    paddingVertical: PX.pv8,
    fontFamily: "SongTi",

    // backgroundColor: "rgb(255,255,0)",
  },
  arrowIcon: {
    marginLeft: 8,
  },
  faceButton: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n32,
    paddingVertical: PX.pv12,
    paddingHorizontal: PX.n36,
    alignItems: "center",
    marginTop: PX.n10,
  },
  faceButtonText: {
    color: "#fff",
    fontSize: PX.h20,
    letterSpacing: 2,
    fontFamily: "SongTi",
  },
  passwordRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
    marginLeft: PX.n5,
    marginTop: 0,
  },
  passwordLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordLabel: {
    fontSize: PX.h20,
    color: "#2563eb",
    marginBottom: PX.n10,
    marginRight: PX.n4,

    textAlign: "center",
  },
  passwordArrow: {
    fontSize: PX.h18,
    color: "#2563eb",
    marginBottom: PX.n10,
  },
  versionIcon: {
    position: "absolute",
    top: 60,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    opacity: 0.1,
  },
  versionIconText: {
    fontSize: 18,
    color: "#2563eb",
    fontWeight: "bold",
  },
});
