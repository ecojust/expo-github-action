import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import NativeTestModule, {
  DeviceInfo,
} from "../pages/productIn/NativeTestModule";

import * as PX from "@/app/pages/config";
interface FaceRecognitionProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  onFrameCapture?: (frameData: {
    uri: string;
    base64?: string;
  }) => Promise<boolean>;
  captureInterval?: number; // 捕获间隔，毫秒
}

const { width, height } = Dimensions.get("window");
const faceAreaSize = width * 0.8;

let startTime = -1;

const FaceRecognition: React.FC<FaceRecognitionProps> = ({
  visible,
  onClose,
  onSuccess,
  title = "人脸识别",
  onFrameCapture,
  captureInterval = 1000, // 默认每秒捕获一帧
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [recognizing, setRecognizing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const colorAnim = useRef(new Animated.Value(0)).current;

  // 捕获单帧图片
  const captureFrame = useCallback(async () => {
    const far = new Date().getTime() - startTime;
    if (far > 15000) {
      stopFrameCapture();
      setRecognizing(false);
      onClose();
      // Alert.alert("识别超时，请重试");
      NativeTestModule.showToast("识别超时，请重试");
      return;
    }
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
          // skipProcessing: true, // 跳过处理以提高速度
          // mute: true, // 静音拍照
          shutterSound: false,
        });
        if (photo && onFrameCapture) {
          const pass = await onFrameCapture({
            uri: photo.uri,
            base64: photo.base64,
          });

          if (pass) {
            console.log("识别成功");
            stopFrameCapture();
            setRecognizing(false);
            onSuccess();
          } else {
            console.log("识别失败，继续识别");
            captureFrame();
          }
        }
      } catch (error) {
        console.error("捕获帧失败:", error);
      }
    }
  }, [onFrameCapture]);

  // 开始颜色变化动画
  const startColorAnimation = useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(colorAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [colorAnim]);

  // 停止颜色变化动画
  const stopColorAnimation = useCallback(() => {
    colorAnim.stopAnimation();
    colorAnim.setValue(0);
  }, [colorAnim]);

  // 开始定期捕获帧
  const startFrameCapture = useCallback(() => {
    console.log("逻辑触发：开始捕获帧");
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
    }

    startTime = new Date().getTime();

    setIsCapturing(true);
    startColorAnimation();
    // captureIntervalRef.current = setInterval(() => {
    captureFrame();
    // }, captureInterval);
  }, [captureFrame, captureInterval, startColorAnimation]);

  // 停止捕获帧
  const stopFrameCapture = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    setIsCapturing(false);
    stopColorAnimation();
  }, [stopColorAnimation]);

  useEffect(() => {
    const getCameraPermissions = async () => {
      if (visible && !permission?.granted) {
        const permissionResult = await requestPermission();
        if (!permissionResult.granted) {
          Alert.alert("权限被拒绝", "需要相机权限才能进行人脸识别");
          onClose();
        }
      }
    };

    if (visible) {
      getCameraPermissions();
      setRecognizing(false);
    } else {
      // 关闭时停止捕获
      stopFrameCapture();
    }

    setTimeout(() => {
      if (visible && !recognizing) {
        handleFaceRecognition();
      }
    }, 1000);

    return () => {
      stopFrameCapture();
    };
  }, [visible, permission, requestPermission, onClose, stopFrameCapture]);

  const handleFaceRecognition = () => {
    if (isCapturing) {
      // 如果正在捕获，则停止
      stopFrameCapture();
      setRecognizing(false);
    } else {
      // 开始捕获帧进行识别
      setRecognizing(true);
      startFrameCapture();

      // 模拟人脸识别过程（实际项目中这里应该是真实的识别逻辑）
      // setTimeout(() => {
      //   stopFrameCapture();
      //   setRecognizing(false);
      //   Alert.alert("识别成功", "人脸识别通过", [
      //     {
      //       text: "确定",
      //       onPress: () => {
      //         onSuccess();
      //         onClose();
      //       },
      //     },
      //   ]);
      // }, 5000); // 5秒后自动停止
    }
  };

  const handleClose = () => {
    stopFrameCapture();
    setRecognizing(false);
    onClose();
  };

  if (permission === null) {
    return null;
  }

  if (!permission?.granted) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionText}>
              需要相机权限才能进行人脸识别
            </Text>
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

            {/* 人脸识别区域 */}
            <Animated.View
              style={[
                styles.faceAreaContainer,
                recognizing && {
                  borderColor: colorAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["#4F8EF7", "#FF6B6B"],
                  }),
                },
              ]}
            >
              <CameraView
                style={styles.camera}
                facing="front"
                mode="picture"
                mute={true}
                animateShutter={false}
                autofocus={"on"}
                enableTorch={false}
                ref={cameraRef}
              />
              <View style={styles.faceFrame}>
                <View
                  style={[
                    styles.faceOutline,
                    // recognizing ? styles.recognizing : "",
                  ]}
                />
                {/* {recognizing && (
                  <View style={styles.recognizingIndicator}>
                    <Text style={styles.recognizingText}>
                      识别中...
                    </Text>
                  </View>
                )} */}
              </View>
            </Animated.View>

            {/* 右侧遮罩 */}
            <View style={styles.maskSide} />
          </View>

          {/* 下方遮罩 */}
          <View style={styles.maskBottom} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.instruction}>请将面部放入框内进行识别</Text>
          {/* <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.recognizeButton]}
              onPress={handleFaceRecognition}
            >
              <Text style={styles.recognizeButtonText}>
                {recognizing ? "停止识别" : "开始识别"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View> */}
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>取消</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 1)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: PX.n20,
    paddingTop: PX.n50 * 2,
  },
  title: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    color: "#fff",
  },
  closeIcon: {
    width: 30,
    height: 30,
    borderRadius: PX.n15,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeIconText: {
    fontSize: PX.h20,
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
    height: faceAreaSize,
  },
  maskSide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  faceAreaContainer: {
    width: faceAreaSize,
    height: faceAreaSize,
    position: "relative",
    overflow: "hidden",
    borderRadius: faceAreaSize / 2,
    borderWidth: 5,
    borderStyle: "solid",
    // backgroundColor: "rgba(255, 0, 0, 0.1)",
  },

  camera: {
    width: faceAreaSize,
    height: faceAreaSize,
  },
  faceFrame: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  faceOutline: {
    width: faceAreaSize - 40,
    height: faceAreaSize - 40,
    borderRadius: (faceAreaSize - 40) / 2,
    // borderWidth: 3,
    // borderColor: "#4F8EF7",
    // borderStyle: "dashed",
  },

  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#4F8EF7",
    borderWidth: 4,
    borderRadius: PX.n8,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 20,
    right: 20,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  recognizingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -20 }],
    backgroundColor: "rgba(79, 142, 247, 0.9)",
    borderRadius: PX.n20,
    paddingHorizontal: PX.n20,
    paddingVertical: PX.n8,
    zIndex: 10,
  },
  recognizingText: {
    color: "#fff",
    fontSize: PX.h16,
    fontFamily: "SongTi",
  },
  footer: {
    paddingHorizontal: PX.n20,
    paddingBottom: 90,
    alignItems: "center",
  },
  instruction: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#fff",
    textAlign: "center",
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 15,
  },
  actionButton: {
    borderRadius: PX.n25,
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n30,
    minWidth: 120,
    alignItems: "center",
  },
  recognizeButton: {
    backgroundColor: "#4F8EF7",
  },
  recognizeButtonText: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#fff",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: PX.n25,
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    minWidth: 120,
    alignItems: "center",
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
    marginBottom: 30,
  },
  closeButton: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n25,
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n30,
  },
  closeButtonText: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#fff",
  },
});

export default FaceRecognition;
