import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { BUILD_INFO } from "../../build";
import BluetoothService from "../utils/BluetoothService";
import { BluetoothDevice } from "react-native-bluetooth-classic";
import { scale } from "../pages/config";

interface VersionModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get("window");

export default function VersionModal({ visible, onClose }: VersionModalProps) {
  const [devices, setDevices] = useState<BluetoothDevice[]>([
    // {
    //   name: "test",
    //   address: "test",
    // },
    // {
    //   name: "test",
    //   address: "test",
    // },
    // {
    //   name: "test",
    //   address: "test",
    // },
    // {
    //   name: "test",
    //   address: "test",
    // },
    // {
    //   name: "test",
    //   address: "test",
    // },
    // {
    //   name: "test",
    //   address: "test",
    // },
  ]);

  const getDevices = async () => {
    const pairedDevices = await BluetoothService.getPairedDevices();
    setDevices(pairedDevices);
    //@ts-ignore
    // setDevices([
    //   {
    //     name: "345678909876546787678",
    //     address: "345678909876546787678",
    //   },
    // ]);
  };

  useEffect(() => {
    if (visible) {
      getDevices();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>版本信息</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>版本号:</Text>
            <Text style={styles.value}>{BUILD_INFO.version}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>构建时间:</Text>
            <Text style={styles.value}>{BUILD_INFO.buildTime}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>构建号:</Text>
            <Text style={styles.value}>{BUILD_INFO.buildNumber}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>自适应缩放比:</Text>
            <Text style={styles.value}>{scale}</Text>
          </View>

          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {devices.map((device, index) => (
              <View key={index} style={styles.infoRow}>
                <Text
                  style={styles.deviceName}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {device.name}
                </Text>
                <Text
                  style={styles.deviceAddress}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {device.address}
                </Text>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>确定</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    width: width * 0.8,
    maxWidth: 320,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  value: {
    fontSize: 14,
    color: "#333",
    fontWeight: "400",
    flex: 1,
    textAlign: "right",
  },
  closeButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  scrollContainer: {
    maxHeight: 100,
  },
  deviceName: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
    flex: 1,
    maxWidth: 120,
  },
  deviceAddress: {
    fontSize: 14,
    color: "#333",
    fontWeight: "400",
    flex: 1,
    textAlign: "right",
    maxWidth: 120,
  },
});
