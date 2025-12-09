import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ScanModal from "./ScanModal";
import * as PX from "@/app/pages/config";

interface FloatingPackageButtonProps {
  onScanSuccess: (data: string) => void;
}

export default function FloatingPackageButton({
  onScanSuccess,
}: FloatingPackageButtonProps) {
  const [scanModalVisible, setScanModalVisible] = useState(false);

  // 容器扫码成功处理
  const handlePackageScanSuccess = async (dataStr: string) => {
    try {
      // const data = JSON.parse(dataStr);
      onScanSuccess(dataStr);
      setScanModalVisible(false);
    } catch (error) {
      setScanModalVisible(false);
    }
  };

  // 按钮点击效果
  const handleButtonPress = () => {
    // 直接打开扫描
    setScanModalVisible(true);
  };

  return (
    <>
      {/* 固定底部按钮 */}
      <View style={styles.fixedContainer}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleButtonPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#4f46e5", "#7c3aed"]}
            style={styles.floatingButtonGradient}
          >
            {/* <Text style={styles.floatingButtonIcon}>包</Text> */}

            <Image
              style={[styles.qrCodeImage]}
              source={require("../../assets/images/qrcode.png")}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* 扫码模态框 */}
      <ScanModal
        visible={scanModalVisible}
        onClose={() => setScanModalVisible(false)}
        onScanSuccess={handlePackageScanSuccess}
        title="扫描容器码"
      />
    </>
  );
}

const styles = StyleSheet.create({
  fixedContainer: {
    position: "absolute",
    bottom: PX.n10 * 12, // 距离底部100px，避免与其他底部按钮重叠
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  floatingButton: {
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingButtonGradient: {
    // width: 100,
    // height: PX.n50,
    borderRadius: PX.n25 * 9,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: PX.n10 * 1.4,
  },
  floatingButtonIcon: {
    fontSize: PX.h18,
    marginRight: PX.n5,
  },
  floatingButtonText: {
    color: "#fff",
    fontSize: PX.h14,
    fontWeight: "bold",
  },
  badge: {
    position: "absolute",
    top: -PX.n5,
    right: -PX.n5,
    backgroundColor: "#ef4444",
    borderRadius: PX.n10,
    minWidth: PX.n20,
    height: PX.n20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: PX.h10,
    fontWeight: "bold",
  },

  qrCodeImage: {
    width: PX.n10 * 4,
    height: PX.n10 * 4,
  },
});
