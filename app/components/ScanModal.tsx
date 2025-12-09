import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  Dimensions,
} from "react-native";
import { CameraView, Camera } from "expo-camera";

import * as PX from "@/app/pages/config";
interface ScanModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess: (data: string) => void;
  title?: string;
}

export default function ScanModal({
  visible,
  onClose,
  onScanSuccess,
  title = "扫描二维码",
}: ScanModalProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    if (visible) {
      getCameraPermissions();
      setScanned(false);
    }
  }, [visible]);

  const handleBarCodeScanned = ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (!scanned) {
      setScanned(true);
      onScanSuccess(data);
      onClose();
    }
  };

  const handleClose = () => {
    setScanned(false);
    onClose();
  };

  if (hasPermission === null) {
    return null;
  }

  if (hasPermission === false) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>需要相机权限才能扫描</Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>关闭</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {/* <TouchableOpacity style={styles.closeIcon} onPress={handleClose}>
            <Text style={styles.closeIconText}>×</Text>
          </TouchableOpacity> */}
        </View>

        <View style={styles.cameraContainer}>
          {/* 上方遮罩 */}
          <View style={styles.maskTop} />

          <View style={styles.middleRow}>
            {/* 左侧遮罩 */}
            <View style={styles.maskSide} />

            {/* 扫描区域 */}
            <View style={styles.scanAreaContainer}>
              <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>

            {/* 右侧遮罩 */}
            <View style={styles.maskSide} />
          </View>

          {/* 下方遮罩 */}
          <View style={styles.maskBottom} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.instruction}>将二维码放入框内进行扫描</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const { width, height } = Dimensions.get("window");
const scanAreaSize = width * 0.7;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    // backgroundColor: "rgba(0, 0, 0, 0.9)",
    backgroundColor: "rgba(0, 0, 0, 1)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    // paddingHorizontal: PX.n20,
    paddingTop: PX.n50 * 2,
    paddingBottom: PX.n20,
  },
  title: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    color: "#fff",
  },

  closeIconText: {
    fontSize: PX.h28,
    color: "#fff",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  maskTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  maskBottom: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  middleRow: {
    flexDirection: "row",
    height: scanAreaSize,
  },
  maskSide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  scanAreaContainer: {
    width: scanAreaSize,
    height: scanAreaSize,
    position: "relative",
    overflow: "hidden",
    borderRadius: PX.n8,
  },
  camera: {
    width: scanAreaSize,
    height: scanAreaSize,
  },
  scanFrame: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  corner: {
    position: "absolute",
    width: PX.n40,
    height: PX.n40,
    borderColor: "#4f8ef7",
    borderWidth: 4,
  },
  topLeft: {
    top: PX.n15,
    left: PX.n15,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: PX.n8,
  },
  topRight: {
    top: PX.n15,
    right: PX.n15,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: PX.n8,
  },
  bottomLeft: {
    bottom: PX.n15,
    left: PX.n15,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: PX.n8,
  },
  bottomRight: {
    bottom: PX.n15,
    right: PX.n15,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: PX.n8,
  },
  footer: {
    // paddingHorizontal: PX.n20,
    paddingBottom: PX.n45 * 2,
    alignItems: "center",
  },
  instruction: {
    fontSize: PX.h22,
    fontFamily: "SongTi",
    color: "#fff",
    textAlign: "center",
    marginBottom: PX.n30,
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: PX.n25,
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n40,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  cancelButtonText: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#fff",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: PX.n40,
  },
  permissionText: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#fff",
    textAlign: "center",
    marginBottom: PX.n30,
  },
  closeButton: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n25,
    paddingVertical: PX.n12,
    // paddingHorizontal: PX.n30,
  },
  closeButtonText: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#fff",
  },
});
