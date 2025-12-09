import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedBackground from "../../components/AnimatedBackground";
import ScanModal from "../../components/ScanModal";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";

import * as PX from "@/app/pages/config";
export default function ProductIn() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [showScanModal, setShowScanModal] = useState(false);

  const handleScanSuccess = (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      if (data.tag == "packageQRCode") {
        console.log(data);
        router.push({
          pathname: "/pages/productIn/add",
          params: data,
        });
      } else {
        Alert.alert("错误", "请扫描容器码");
      }
    } catch (error) {
      Alert.alert("错误", "请扫描容器码");
    }
  };

  const handleAddProductPress = () => {
    setShowScanModal(true);
  };

  useEffect(() => {
    // search();

    if (params.autoscan) {
      handleAddProductPress();
    }
  }, []);

  return (
    <AnimatedBackground
      source={require("../../../assets/images/background2.png")}
      duration={600}
    >
      <View style={styles.container}>
        <Text style={styles.title}>产品入库</Text>
        <TouchableOpacity
          style={styles.btnContainer}
          onPress={() => router.push("/pages/productIn/new")}
        >
          <LinearGradient
            colors={["#4F8EF7", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>新包入库</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnContainer}
          onPress={handleAddProductPress}
        >
          <LinearGradient
            colors={["#4F8EF7", "#8B5CF6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>扫码入库</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.exitBtn}
          onPress={() => router.replace("/menus")}
        >
          <Text style={styles.exitText}>返回主页</Text>
        </TouchableOpacity>

        <ScanModal
          visible={showScanModal}
          onClose={() => setShowScanModal(false)}
          onScanSuccess={handleScanSuccess}
          title="扫描容器二维码"
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
    color: "#222",
    marginBottom: 160,
    textAlign: "center",
    fontFamily: "SongTi",
  },
  btnContainer: {
    width: "45%",
    marginBottom: PX.n32,
    borderRadius: PX.n50,
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
    borderRadius: PX.n22,
    alignItems: "center",
    paddingVertical: PX.n12,
  },
  btnText: {
    color: "#fff",
    fontSize: PX.h22,
    letterSpacing: 2,
    fontFamily: "SongTi",
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
    paddingHorizontal: PX.n32,
  },
  exitText: {
    color: "#fff",
    fontSize: PX.h20,
    letterSpacing: 2,
    fontFamily: "SongTi",
  },
});
