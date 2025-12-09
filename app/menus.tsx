import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useState, useEffect } from "react";

import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedBackground from "./components/AnimatedBackground";
import ScrollingMessage from "./components/ScrollingMessage";
import * as PX from "@/app/pages/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NativeTestModule from "@/src/NativeTestModule";

import { getUnfinishedTask } from "@/app/api/out";
import { transferOrderWaitConfirm } from "@/app/api/order";

const menuData = [
  {
    title: "产品入库",
    icon: require("../assets/icons/out.png"),
    colors: ["#4A90E2", "#7B68EE"],
  },
  {
    title: "产品出库",
    icon: require("../assets/icons/putin.png"),
    colors: ["#5B2C87", "#1E88E5"],
  },
  {
    title: "库存查询",
    icon: require("../assets/icons/search.png"),
    colors: ["#1976D2", "#42A5F5"],
  },
  {
    title: "标签打印",
    icon: require("../assets/icons/print.png"),
    colors: ["#00ACC1", "#26C6DA"],
  },
  {
    title: "人工操作",
    icon: require("../assets/icons/transfer.png"),
    colors: ["#1565C0", "#1976D2"],
  },
  {
    title: "订单转发",
    icon: require("../assets/icons/forward.png"),
    colors: ["#1976D2", "#42A5F5"],
  },
  // {
  //   title: "蓝牙设备",
  //   icon: require("../assets/icons/print.png"),
  //   colors: ["#6A1B9A", "#8E24AA"],
  // },
];

const CARD_SIZE = (Dimensions.get("window").width - 3 * PX.n32) / 2;

interface Message {
  content: string;
}

export default function Menus() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);

  const [putoutNum, setPutOutNum] = useState(0);
  const [transferNum, setTransferNum] = useState(0);

  // 加载统计数据
  const loadStats = async () => {
    console.log("更新数据");
    try {
      const allMessages: Message[] = [];

      // 获取出库待确认订单
      const res1 = await getUnfinishedTask();
      if (res1?.code === 200 && Array.isArray(res1.data)) {
        const outMessages = res1.data.map((d: any) => ({
          content: `订单${d.orderId}出库待确认`,
        }));
        setPutOutNum(outMessages.length);
        allMessages.push(...outMessages);
      }

      // 获取转发待确认订单
      const res2 = await transferOrderWaitConfirm({
        pageNumber: 1,
        pageSize: 100,
      });
      if (res2?.code === 200 && Array.isArray(res2.data)) {
        const forwardMessages = res2.data.map((d: any) => ({
          content: `订单${d.orderId}转发待确认`,
        }));
        setTransferNum(forwardMessages.length);
        allMessages.push(...forwardMessages);
      }

      console.log("消息列表:", allMessages);
      setMessages(allMessages);
    } catch (error) {
      console.error("加载统计数据失败:", error);
      setMessages([]); // 出错时清空消息
    }
  };

  const toMenuItem = async (item: any) => {
    console.log(item);

    const permissionStr = await AsyncStorage.getItem("permission");
    const permissionArr = permissionStr.split(",");
    console.log(permissionArr);
    if (item.title === "产品入库") {
      if (permissionArr.includes("putin_read")) {
        router.push("/pages/productIn");
      } else {
        NativeTestModule.showToast("无操作权限");
      }
    }
    if (item.title === "产品出库") {
      if (permissionArr.includes("putout_read")) {
        router.push("/pages/productOut");
      } else {
        NativeTestModule.showToast("无操作权限");
      }
    }
    if (item.title === "库存查询") {
      if (permissionArr.includes("stock_read")) {
        router.push("/pages/stock");
      } else {
        NativeTestModule.showToast("无操作权限");
      }
    }
    if (item.title === "标签打印") {
      if (permissionArr.includes("package_code_read")) {
        router.push("/pages/print");
      } else {
        NativeTestModule.showToast("无操作权限");
      }
    }
    if (item.title === "人工操作") {
      if (permissionArr.includes("location_transfer_read")) {
        router.push("/pages/productTransfer");
      } else {
        NativeTestModule.showToast("无操作权限");
      }
    }
    if (item.title === "订单转发") {
      // router.push("/pages/orderForward");

      if (permissionArr.includes("order_confirm_read")) {
        router.push("/pages/orderForward");
      } else {
        NativeTestModule.showToast("无操作权限");
      }
    }
  };

  useEffect(() => {
    loadStats();

    const timer = setInterval(() => {
      loadStats();
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <AnimatedBackground
      source={require("../assets/images/background2.png")}
      duration={600}
    >
      <ScrollingMessage messages={messages} />
      <View style={styles.container}>
        <View style={styles.grid}>
          {menuData.map((item) => (
            <TouchableOpacity
              key={item.title}
              activeOpacity={0.85}
              onPress={() => {
                toMenuItem(item);
              }}
              // style={[styles.title]}
            >
              {/* <View
              style={[
                styles.cardBg,
                {
                  backgroundColor: "#fff",
                  // 可用LinearGradient组件实现渐变色背景
                  // 这里只用纯色做占位，实际可用react-native-linear-gradient
                },
              ]}
            /> */}

              <LinearGradient
                style={[styles.card]}
                colors={[item.colors[0], item.colors[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.iconWrap}>
                  <Image source={item.icon} style={styles.icon} />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>

                {/* 数字标记badge */}
                {((item.title === "产品出库" && putoutNum > 0) ||
                  (item.title === "订单转发" && transferNum > 0)) && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {item.title === "产品出库" ? putoutNum : transferNum}
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.exitBtn}
          onPress={async () => {
            // 清除用户数据
            await AsyncStorage.removeItem("token");
            await AsyncStorage.removeItem("mac");
            // 使用 dismissAll 清空所有路由栈，然后导航到登录页
            router.dismissAll();
            router.replace("/login");
          }}
        >
          <Text style={styles.exitText}>退出程序</Text>
        </TouchableOpacity>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 100,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: PX.n40,
  },
  // title: {
  //   shadowColor: "#000",
  //   shadowOffset: {
  //     width: 0,
  //     height: 4,
  //   },
  //   shadowOpacity: 0.3,
  //   shadowRadius: 4.65,
  //   elevation: 8,
  //   fontFamily: "SongTi",
  // },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: PX.h16,
    alignItems: "center", // 居中
    justifyContent: "center", // 居中
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 12,
    overflow: "hidden",
    margin: PX.n32 / 2,
  },
  cardTitle: {
    color: "#fff", // 深色
    fontSize: PX.h20,
    marginTop: 0,
    marginLeft: 0,
    textAlign: "center", // 居中
    textShadowColor: "rgba(0,0,0,0.08)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontFamily: "SongTi",
  },
  cardBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: PX.n32,
    opacity: 0.95,
  },
  iconWrap: {
    width: PX.n40,
    height: PX.n40,
    borderRadius: PX.n12,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: PX.n12,
  },
  icon: {
    width: PX.n32,
    height: PX.n32,
    resizeMode: "contain",
  },
  exitBtn: {
    position: "absolute",
    bottom: PX.n50 + 8,
    backgroundColor: "#2563eb",
    borderRadius: PX.n30,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
    paddingVertical: PX.pv8,
    paddingHorizontal: PX.n36,
  },
  exitText: {
    color: "#fff",
    fontSize: PX.h20,

    letterSpacing: 2,
    fontFamily: "SongTi",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ff4444",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
});
