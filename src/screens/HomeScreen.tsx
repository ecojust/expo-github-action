import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/navigation";

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;

interface Props {
  navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>欢迎使用蓝牙打印机应用</Text>

      <View style={styles.section}>
        <Text style={styles.description}>
          这是一个用于测试蓝牙打印机功能的应用程序。
          您可以扫描附近的蓝牙设备，连接打印机并发送打印指令。
        </Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("BluetoothTest")}
      >
        <Text style={styles.buttonText}>进入蓝牙测试</Text>
      </TouchableOpacity>

      <View style={styles.featureList}>
        <Text style={styles.featureTitle}>功能特性：</Text>
        <Text style={styles.featureItem}>• 蓝牙设备扫描</Text>
        <Text style={styles.featureItem}>• 设备连接管理</Text>
        <Text style={styles.featureItem}>• 打印指令发送</Text>
        <Text style={styles.featureItem}>• 设备信息获取</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: PX.n20,
    justifyContent: "center",
  },
  title: {
    fontSize: h28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    color: "#333",
  },
  section: {
    backgroundColor: "white",
    padding: PX.n20,
    borderRadius: PX.n10,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  description: {
    fontSize: h16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: PX.n30,
    paddingVertical: PX.n12,
    borderRadius: PX.n10,
    alignItems: "center",
    marginBottom: 30,
  },
  buttonText: {
    color: "white",
    fontSize: h18,
    fontWeight: "600",
  },
  featureList: {
    backgroundColor: "white",
    padding: PX.n20,
    borderRadius: PX.n10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureTitle: {
    fontSize: h18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  featureItem: {
    fontSize: h16,
    color: "#666",
    marginBottom: 8,
  },
});
