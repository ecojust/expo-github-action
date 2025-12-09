import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AnimatedBackground from "../../components/AnimatedBackground";
import ScanModal from "../../components/ScanModal";

import * as PX from "@/app/pages/config";
export default function Stock() {
  const router = useRouter();
  const [scanModalVisible, setScanModalVisible] = useState(false);

  const handleScanSuccess = (dataStr: any) => {
    const data = JSON.parse(dataStr);
    try {
      console.log("handleScanSuccess", data);

      if (data.tag == "productQRCode") {
        router.push({
          pathname: "/pages/stock/detail",
          params: {
            productCode: data?.productCode,
            color: data?.color,
            size: data?.size,
            needleType: data?.needleType,
            productName: data?.productName,
          },
        });
      } else {
        Alert.alert("错误", "请扫描产品码");
      }
    } catch (error) {
      Alert.alert("错误", "数据不对");
    }
  };
  return (
    <AnimatedBackground
      source={require("../../../assets/images/background2.png")}
      duration={600}
    >
      <View style={styles.container}>
        <Text style={styles.title}>库存查询</Text>
        <TouchableOpacity
          style={styles.btnContainer}
          onPress={() => router.push("/pages/stock/manual")}
        >
          <LinearGradient
            colors={["#4F8EF7", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>手动输入</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnContainer}
          onPress={() => setScanModalVisible(true)}
        >
          <LinearGradient
            colors={["#4F8EF7", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>扫描输入</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.exitBtn}
          onPress={() => router.replace("/menus")}
        >
          <Text style={styles.exitText}>返回主页</Text>
        </TouchableOpacity>

        {/* 扫描模态框 */}
        <ScanModal
          visible={scanModalVisible}
          onClose={() => setScanModalVisible(false)}
          onScanSuccess={handleScanSuccess}
          title="扫描产品二维码"
        />
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: PX.n50,
  },
  title: {
    fontSize: PX.h26,
    fontFamily: "SongTi",
    color: "#222",
    marginBottom: PX.n160,
    textAlign: "center",
  },
  btnContainer: {
    width: "50%",
    marginBottom: PX.n32,
    borderRadius: PX.n25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  btn: {
    // borderRadius: PX.n25,
    // alignItems: "center",
    // paddingVertical: PX.n18,
    // paddingHorizontal: PX.n24,
    borderRadius: PX.n22,
    alignItems: "center",
    paddingVertical: PX.n12,
  },
  btnText: {
    color: "#fff",
    fontSize: PX.h24,
    fontFamily: "SongTi",

    letterSpacing: 2,
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
    fontFamily: "SongTi",

    letterSpacing: 2,
  },
});
