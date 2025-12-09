import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { BluetoothDevice } from "react-native-bluetooth-classic";
import { useRouter } from "expo-router";
import BluetoothService from "../../utils/BluetoothService";
import * as PX from "@/app/pages/config";
export default function BluetoothDevices() {
  const router = useRouter();
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectedDevice, setConnectedDevice] =
    useState<BluetoothDevice | null>(null);

  useEffect(() => {
    // console.log("BluetoothService", BluetoothService.isBluetoothEnabled);
    initializeBluetooth();
    return () => {
      BluetoothService.stopDiscovery();
    };
  }, []);

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

      // 获取已配对设备
      await loadPairedDevices();
    } catch (error) {
      console.error("初始化蓝牙失败:", error);
      Alert.alert("错误", "初始化蓝牙失败");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPairedDevices = async () => {
    try {
      const pairedDevices = await BluetoothService.getPairedDevices();
      setDevices(pairedDevices);
    } catch (error) {
      console.error("获取已配对设备失败:", error);
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    try {
      const discoveredDevices = await BluetoothService.startDiscovery();
      // 合并已配对设备和发现的设备，去重
      const allDevices = [...devices];
      discoveredDevices.forEach((device) => {
        if (!allDevices.find((d) => d.address === device.address)) {
          allDevices.push(device);
        }
      });
      setDevices(allDevices);
    } catch (error) {
      console.error("扫描设备失败:", error);
      Alert.alert("扫描失败", "无法扫描蓝牙设备");
    } finally {
      setIsScanning(false);
    }
  };

  const handleDeviceConnect = async (device: BluetoothDevice) => {
    try {
      // 如果已有连接的设备，先断开
      if (connectedDevice) {
        await BluetoothService.disconnect();
        setConnectedDevice(null);
      }

      const connected = await BluetoothService.connectToDevice(device);
      if (connected) {
        setConnectedDevice(device);
        Alert.alert(
          "连接成功",
          `已连接到设备 ${device.name || device.address}`
        );
      } else {
        Alert.alert(
          "连接失败",
          `无法连接到设备 ${device.name || device.address}`
        );
      }
    } catch (error) {
      console.error("连接设备失败:", error);
      Alert.alert("连接错误", "连接设备时发生错误");
    }
  };

  const handleDeviceDisconnect = async () => {
    try {
      const disconnected = await BluetoothService.disconnect();
      if (disconnected) {
        setConnectedDevice(null);
        Alert.alert("断开成功", "设备已断开连接");
      }
    } catch (error) {
      console.error("断开连接失败:", error);
      Alert.alert("断开失败", "断开连接时发生错误");
    }
  };

  const renderDevice = ({ item }: { item: BluetoothDevice }) => {
    const isConnected = connectedDevice?.address === item.address;

    return (
      <TouchableOpacity
        style={[styles.deviceItem, isConnected && styles.connectedDevice]}
        onPress={() =>
          isConnected ? handleDeviceDisconnect() : handleDeviceConnect(item)
        }
      >
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name || "未知设备"}</Text>
          <Text style={styles.deviceAddress}>{item.address}</Text>
        </View>
        <View style={styles.deviceStatus}>
          {item.bonded && <Text style={styles.pairedText}>已配对</Text>}
          {isConnected && <Text style={styles.connectedText}>已连接</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>初始化蓝牙...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>蓝牙设备</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
          onPress={startScan}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.scanButtonText}>扫描设备</Text>
          )}
        </TouchableOpacity>
      </View>

      {connectedDevice && (
        <View style={styles.connectedInfo}>
          <Text style={styles.connectedInfoText}>
            当前连接: {connectedDevice.name || connectedDevice.address}
          </Text>
        </View>
      )}

      <FlatList
        data={devices}
        keyExtractor={(item) => item.address}
        renderItem={renderDevice}
        style={styles.deviceList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isScanning ? "正在扫描设备..." : "未找到蓝牙设备"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: PX.n10,
    fontSize: PX.h16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: PX.n16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: PX.h20,
    fontWeight: "bold",
    color: "#333",
  },
  backButton: {
    padding: PX.n8,
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: PX.h16,
  },
  actions: {
    padding: PX.n16,
    backgroundColor: "#fff",
    marginBottom: PX.n10,
  },
  scanButton: {
    backgroundColor: "#007AFF",
    padding: PX.n12,
    borderRadius: PX.n8,
    alignItems: "center",
  },
  scanButtonDisabled: {
    backgroundColor: "#ccc",
  },
  scanButtonText: {
    color: "#fff",
    fontSize: PX.h16,
    fontWeight: "bold",
  },
  connectedInfo: {
    backgroundColor: "#4CAF50",
    padding: PX.n12,
    marginHorizontal: PX.n16,
    marginBottom: PX.n10,
    borderRadius: PX.n8,
  },
  connectedInfoText: {
    color: "#fff",
    fontSize: PX.h14,
    textAlign: "center",
  },
  deviceList: {
    flex: 1,
  },
  deviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: PX.n16,
    backgroundColor: "#fff",
    marginHorizontal: PX.n16,
    marginBottom: PX.n8,
    borderRadius: PX.n8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  connectedDevice: {
    backgroundColor: "#E8F5E8",
    borderColor: "#4CAF50",
    borderWidth: 1,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: PX.h16,
    fontWeight: "bold",
    marginBottom: PX.n4,
    color: "#333",
  },
  deviceAddress: {
    fontSize: PX.h14,
    color: "#666",
  },
  deviceStatus: {
    alignItems: "flex-end",
  },
  pairedText: {
    fontSize: PX.h12,
    color: "#4CAF50",
    backgroundColor: "#E8F5E8",
    paddingHorizontal: PX.n8,
    paddingVertical: PX.n4,
    borderRadius: PX.n4,
    marginBottom: 4,
  },
  connectedText: {
    fontSize: PX.h12,
    color: "#fff",
    backgroundColor: "#4CAF50",
    paddingHorizontal: PX.n8,
    paddingVertical: PX.n4,
    borderRadius: PX.n4,
  },
  emptyContainer: {
    padding: PX.n32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: PX.h16,
    color: "#666",
    textAlign: "center",
  },
});
