import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import AnimatedBackground from "../../components/AnimatedBackground";
import ScanModal from "../../components/ScanModal";
import { getStockList, getStockListByProcess } from "../../api/stock";
import StorageLocationPicker from "../../components/StorageLocationPicker";

import { transferOrder } from "@/app/api/transfer";
import * as PX from "@/app/pages/config";
import NativeTestModule from "@/src/NativeTestModule";
import { getPackageDetails, packagerRelocation } from "@/app/api/package";

export default function ProductTransfer() {
  const router = useRouter();
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [formCodeScaned, setFormCodeScaned] = useState(false);
  const [scanType, setScanType] = useState<
    "package" | "fromLocation" | "toLocation"
  >("package");

  const [validFromStorageCode, setValidFromStorageCode] = useState("");
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);

  const [productScaned, setProductScaned] = useState({
    productCode: "",
    color: "",
    size: "",
    needleType: "",
    productName: "",
    processCode: "",
    storageCode: "",
    productLineCode: "",
    tag: "",
    totalQuantity: "",
    finishedProcess: "",
    orderId: "",
  });

  const [transferData, setTransferData] = useState({
    productCode: "",
    packageId: "",
    fromLocationCode: "",
    toLocationCode: "",
    // fromStock: "0",
    // toStock: "0",
    // transferQuantity: "0",
    remark: "",
  });

  // 控制库位码输入框的禁用状态
  const [locationInputDisabled, setLocationInputDisabled] = useState(false);

  // 根据容器码是否为空来控制库位码输入框的禁用状态
  React.useEffect(() => {
    // 如果容器码为空或只有默认值，则禁用库位码输入
    if (!transferData.productCode || !formCodeScaned) {
      setLocationInputDisabled(true);
    } else {
      setLocationInputDisabled(false);
    }
  }, [transferData.productCode, formCodeScaned]);

  // 监控packageId的变化
  React.useEffect(() => {
    console.log("transferData.packageId 变化:", transferData.packageId);
  }, [transferData.packageId]);

  const searchOriginData = (packageid: string) => {
    console.log("packageId值:", packageid);

    setTransferData((prev) => ({
      ...prev,
      fromLocationCode: "",
      toLocationCode: "",
      packageId: prev.packageId, // 确保保留packageId
    }));

    setValidFromStorageCode("");

    getPackageDetails({ productProcessId: packageid })
      .then((res) => {
        //@ts-ignore
        if (res.code == 200) {
          setProductScaned({
            productCode: res.data.productCode,
            productName: res.data.productName,
            color: res.data.color,
            needleType: res.data.needleType,
            size: res.data.size,
            processCode: res.data.finishedProcess,
            storageCode: res.data.currentStorage,
            productLineCode: "",
            tag: "packageQRCode",
            totalQuantity: res.data.currentQuantity,
            finishedProcess: res.data.finishedProcess.replaceAll(",", "  "),
            orderId: res.data.orderId,
          });

          console.log("searchOriginData", res.data);

          if (!res.data.currentStorage) {
            Alert.alert("错误", "当前容器不在库位");
          } else {
            setTransferData((prev) => ({
              ...prev,
              fromLocationCode: res.data.currentStorage,
              toLocationCode: "",
              packageId: prev.packageId, // 确保保留packageId
            }));

            setValidFromStorageCode(res.data.currentStorage);
            setFormCodeScaned(true);
          }
        }
      })
      .catch((error) => {
        console.error("获取容器信息失败:", error);
        Alert.alert("错误", "获取容器信息失败");
      });
  };

  const handleScanSuccess = (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      console.log("扫描结果:", data);
      console.log("data.id:", data.id);
      if (scanType === "package") {
        if (data.tag == "packageQRCode") {
          // 扫描容器码后，获取容器详细信息
          const newTransferData = {
            ...transferData,
            packageId: data.id,
            productCode: data.productCode || "",
          };

          setTransferData(newTransferData);

          console.log("设置后的transferData:", newTransferData);

          // 如果扫描的是容器，获取详细信息
          if (data.id) {
            searchOriginData(data.id);
          } else {
            // 兼容原有数据结构
            setProductScaned(data);
            setValidFromStorageCode(data.storageCode);
            setFormCodeScaned(true);
          }
        } else {
          Alert.alert("错误", "请扫描容器码");
        }
      } else if (scanType === "fromLocation") {
        if (data.tag == "storageQRCode") {
          // if (data.storageCode !== validFromStorageCode) {
          //   Alert.alert("错误", "上述商品不属于当前库位");
          // } else {

          // }

          setTransferData((prev) => ({
            ...prev,
            fromLocationCode: data.id,
          }));
          //todo：查询当前from库位商品库存
          // searchStockQuantity("from", data.id);
          setFormCodeScaned(true);
        } else {
          Alert.alert("错误", "请扫描库位码");
        }
      } else if (scanType === "toLocation") {
        if (data.tag == "storageQRCode") {
          setTransferData((prev) => ({
            ...prev,
            toLocationCode: data.id,
          }));
          //todo：查询当前to库位商品库存
          // searchStockQuantity("to", data.storageCode);
        } else {
          Alert.alert("错误", "请扫描库位码");
        }
      }
    } catch (error) {
      Alert.alert("错误", "请扫描正确的二维码");
    }
  };

  const confirmDialog = async () => {
    // 如果是容器移库，使用容器移库API
    if (transferData.packageId) {
      const transferDataPackage = {
        productProcessId: parseInt(transferData.packageId),
        putInStorageCode: transferData.toLocationCode,
        remark: transferData.remark,
        fromStorage:
          transferData.fromLocationCode !== productScaned.storageCode
            ? transferData.fromLocationCode
            : "",
      };

      console.log("confirmDialog", transferDataPackage);

      const res = await packagerRelocation(transferDataPackage);

      console.log("confirmDialog", res);
      //@ts-ignore
      if (res && res.code === 200) {
        setConfirmDialogVisible(false);

        setProductScaned({
          productCode: "",
          color: "",
          size: "",
          needleType: "",
          productName: "",
          processCode: "",
          storageCode: "",
          productLineCode: "",
          tag: "",
          totalQuantity: "",
          finishedProcess: "",
          orderId: "",
        });

        setTransferData({
          productCode: "",
          packageId: "",
          fromLocationCode: "",
          toLocationCode: "",
          // fromStock: "0",
          // toStock: "0",
          // transferQuantity: "0",
          remark: "",
        });

        setValidFromStorageCode("");
        setFormCodeScaned(false);

        // searchOriginData(transferDataPackage.productProcessId + "");
        NativeTestModule.showToast("移库成功");
      } else {
        Alert.alert("错误", "移库失败，请重试");
      }
    }
  };

  // 检查确认转移按钮是否可用
  const isConfirmButtonDisabled = () => {
    return (
      !transferData.packageId || // 没有容器码
      !transferData.toLocationCode || // 没有目标库位
      transferData.fromLocationCode === transferData.toLocationCode // 源库位和目标库位相同
    );
  };

  const handleConfirmTransfer = async () => {
    // 1. 验证容器码已扫，有packageId
    if (!transferData.packageId) {
      Alert.alert("错误", "请先扫描容器码");
      return;
    }

    // 2. 验证有toLocationCode
    if (!transferData.toLocationCode) {
      Alert.alert("错误", "请选择目标库位");
      return;
    }

    // 3. 验证fromLocationCode和toLocationCode不相同
    if (transferData.fromLocationCode === transferData.toLocationCode) {
      Alert.alert("错误", "目标库位不能与当前库位相同");
      return;
    }

    setConfirmDialogVisible(true);
  };

  return (
    <AnimatedBackground
      source={require("../../../assets/images/background2.png")}
      duration={600}
    >
      <View style={styles.container}>
        <Text style={styles.title}>容器移库</Text>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentContainer}>
            {/* 容器码部分 */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>容器码</Text>

              <TouchableOpacity
                style={styles.qrCodeContainer}
                onPress={() => {
                  setScanType("package");
                  setScanModalVisible(true);
                }}
              >
                <View
                  style={[
                    styles.qrCodePlaceholder,
                    transferData.packageId && styles.qrCodeScanned,
                  ]}
                >
                  <Image
                    style={styles.qrCodeImage}
                    source={require("../../../assets/images/qrcode.png")}
                  />
                  {transferData.packageId && (
                    <View style={styles.scanSuccessIndicator}>
                      <Text style={styles.scanSuccessText}>✓</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.scanHint,
                    transferData.packageId && styles.scanHintSuccess,
                  ]}
                >
                  {transferData.packageId ? "扫描成功" : "点击扫描容器码"}
                </Text>
              </TouchableOpacity>

              {!transferData.packageId && (
                <Text style={styles.scanInstruction}>
                  请先扫描容器二维码开始移库操作
                </Text>
              )}
            </View>

            {/* 产品信息展示区域 */}
            {productScaned.productCode && (
              <View style={styles.productInfoSection}>
                <View style={styles.productInfoHeader}>
                  <Text style={styles.productInfoTitle}>产品信息</Text>
                  <Text style={styles.packageIdBadge}>
                    ID: {transferData.packageId}
                  </Text>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>订单：</Text>
                    <Text style={styles.infoValue}>
                      {productScaned.orderId}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>货号：</Text>
                    <Text style={styles.infoValue}>
                      {productScaned.productCode}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>品名：</Text>
                    <Text style={styles.infoValue}>
                      {productScaned.productName}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>颜色：</Text>
                    <Text style={styles.infoValue}>{productScaned.color}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>针型：</Text>
                    <Text style={styles.infoValue}>
                      {productScaned.needleType}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>尺码：</Text>
                    <Text style={styles.infoValue}>{productScaned.size}</Text>
                  </View>

                  {productScaned.totalQuantity && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>数量：</Text>
                      <Text
                        style={[styles.infoValue, styles.quantityHighlight]}
                      >
                        {productScaned.totalQuantity}
                      </Text>
                    </View>
                  )}

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>工序：</Text>
                    <Text style={styles.infoValue}>
                      {productScaned.finishedProcess}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* 库位码部分 */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>库位码</Text>
              </View>

              <View style={styles.locationRow}>
                {/* From */}
                <View style={styles.locationItem}>
                  <TouchableOpacity
                    style={[
                      styles.smallQrCode,
                      !formCodeScaned && styles.smallQrCodeDisabled,
                    ]}
                    onPress={() => {
                      if (formCodeScaned) {
                        setScanType("fromLocation");
                        setScanModalVisible(true);
                      }
                    }}
                    disabled={formCodeScaned ? false : true}
                  >
                    <Image
                      style={[
                        styles.qrCodeImage,
                        !formCodeScaned && styles.qrCodeTextDisabled,
                      ]}
                      source={require("../../../assets/images/qrcode.png")}
                    />
                  </TouchableOpacity>
                  {/* <TextInput
                    style={[
                      styles.locationInput,
                      (!transferData.productCode || !formCodeScaned) &&
                        styles.locationInputDisabled,
                    ]}
                    value={transferData.fromLocationCode}
                    onChangeText={(value) =>
                      setTransferData((prev) => ({
                        ...prev,
                        fromLocationCode: value,
                      }))
                    }
                    placeholder="输入库位码"
                    placeholderTextColor="#999"
                    editable={!(!transferData.productCode || !formCodeScaned)}
                  /> */}
                  <StorageLocationPicker
                    value={transferData.fromLocationCode}
                    editable={formCodeScaned}
                    onValueChange={(value) =>
                      setTransferData((prev) => ({
                        ...prev,
                        fromLocationCode: value,
                      }))
                    }
                    placeholder="选择库位"
                    style={styles.locationInput}
                    pickerTextStyle={{ fontSize: PX.h14 }}
                  />

                  {/* <Text style={styles.stockLabel}>在库数</Text>
                  <Text style={styles.stockValue}>
                    {productScaned.totalQuantity}
                  </Text> */}
                </View>

                <View style={styles.arrowContainer}>
                  <Text style={styles.arrow}>→</Text>
                </View>

                {/* To */}
                <View style={styles.locationItem}>
                  <TouchableOpacity
                    style={[
                      styles.smallQrCode,
                      !formCodeScaned && styles.smallQrCodeDisabled,
                    ]}
                    onPress={() => {
                      if (formCodeScaned) {
                        setScanType("toLocation");
                        setScanModalVisible(true);
                      }
                    }}
                    disabled={formCodeScaned ? false : true}
                  >
                    <Image
                      style={[
                        styles.qrCodeImage,
                        !formCodeScaned && styles.qrCodeTextDisabled,
                      ]}
                      source={require("../../../assets/images/qrcode.png")}
                    />
                  </TouchableOpacity>
                  {/* <TextInput
                    style={[
                      styles.locationInput,
                      !transferData.productCode && styles.locationInputDisabled,
                    ]}
                    value={transferData.toLocationCode}
                    onChangeText={(value) =>
                      setTransferData((prev) => ({
                        ...prev,
                        toLocationCode: value,
                      }))
                    }
                    placeholder="输入库位码"
                    placeholderTextColor="#999"
                    editable={transferData.productCode ? true : false}
                  /> */}

                  <StorageLocationPicker
                    value={transferData.toLocationCode}
                    editable={formCodeScaned ? true : false}
                    onValueChange={(value) =>
                      setTransferData((prev) => ({
                        ...prev,
                        toLocationCode: value,
                      }))
                    }
                    placeholder="选择库位"
                    style={styles.locationInput}
                    pickerTextStyle={{ fontSize: PX.h14 }}
                  />
                  {/* <Text style={styles.stockLabel}>在库数</Text>
                  <Text style={styles.stockValue}>{transferData.toStock}</Text> */}
                </View>
              </View>
            </View>

            {/* 备注部分 - 只在容器模式下显示 */}
            {transferData.packageId && (
              <View style={styles.remarkSection}>
                <Text style={styles.remarkLabel}>备注说明</Text>
                <TextInput
                  style={styles.remarkInput}
                  value={transferData.remark}
                  onChangeText={(value) =>
                    setTransferData((prev) => ({
                      ...prev,
                      remark: value,
                    }))
                  }
                  placeholder="您可以输入一些此次移库的相关说明"
                  placeholderTextColor="#999"
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            )}
          </View>
        </ScrollView>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.btnWrap,
              {
                backgroundColor: isConfirmButtonDisabled() ? "#ccc" : "#2563eb",
              },
            ]}
            onPress={handleConfirmTransfer}
            disabled={isConfirmButtonDisabled()}
          >
            <Text style={[styles.btnText, { color: "#fff" }]}>确认转移</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnWrap, { backgroundColor: "#dbdbdb" }]}
            // onPress={() => router.replace("/menus")}
            onPress={() => router.back()}
          >
            <Text style={styles.btnText}>返回上页</Text>
          </TouchableOpacity>
        </View>

        {/* 扫描模态框 */}
        <ScanModal
          visible={scanModalVisible}
          onClose={() => setScanModalVisible(false)}
          onScanSuccess={handleScanSuccess}
          title={
            scanType === "package"
              ? "扫描容器二维码"
              : scanType === "fromLocation"
                ? "扫描源库位二维码"
                : "扫描目标库位二维码"
          }
        />

        {/* 确认 弹窗 */}
        <Modal
          visible={confirmDialogVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={[styles.modalTitle, { fontSize: PX.h16 }]}>
                请核对提交数据是否正确
              </Text>

              <View
                style={[styles.modalButtonContainer, { marginTop: PX.n20 }]}
              >
                <TouchableOpacity
                  style={[styles.printButton]}
                  onPress={() => {
                    confirmDialog();
                  }}
                >
                  <Text style={styles.printButtonText}>确认</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setConfirmDialogVisible(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: PX.n50,
  },
  title: {
    fontSize: PX.h26,
    fontFamily: "SongTi",
    color: "#222",
    textAlign: "center",
    marginBottom: PX.n20,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: PX.n20,
    marginBottom: PX.n20,
  },
  qrCodeImage: {
    width: "100%",
    height: "100%",
  },
  contentContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: PX.n15,
    padding: PX.n20,
    marginBottom: 20,
  },
  sectionContainer: {
    marginBottom: PX.n5,
    alignItems: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: PX.n15,
    width: "100%",
  },
  sectionTitle: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#333",
    flex: 1,
    textAlign: "center",
    marginBottom: PX.n5,
  },
  toggleButton: {
    position: "absolute",
    right: 0,
    backgroundColor: "#2563eb",
    borderRadius: PX.n15,
    paddingHorizontal: PX.n12,
    paddingVertical: PX.n6,
  },
  toggleButtonText: {
    fontSize: PX.h18,
    color: "#fff",
    fontFamily: "SongTi",
  },
  qrCodeContainer: {
    marginVertical: PX.n8,
    alignItems: "center",
  },
  qrCodePlaceholder: {
    width: 70,
    height: 70,
    backgroundColor: "#f0f0f0",
    borderRadius: PX.n8,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  qrCodeScanned: {
    backgroundColor: "#e8f5e8",
    borderColor: "#4caf50",
    borderStyle: "solid",
  },
  scanSuccessIndicator: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    backgroundColor: "#4caf50",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  scanSuccessText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  scanHint: {
    fontSize: PX.h14,
    fontFamily: "SongTi",
    color: "#666",
    textAlign: "center",
    marginTop: PX.n5,
  },
  scanHintSuccess: {
    color: "#4caf50",
    fontWeight: "600",
  },
  scanInstruction: {
    fontSize: PX.h12,
    fontFamily: "SongTi",
    color: "#999",
    textAlign: "center",
    marginTop: PX.n8,
    fontStyle: "italic",
  },
  qrCodeText: {
    fontSize: PX.h24,
    color: "#000",
    fontFamily: "SongTi",
  },
  qrCodeTextDisabled: {
    // color: "#aaa",
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
  },
  locationItem: {
    alignItems: "center",
    flex: 1,
    // backgroundColor: "red",
  },
  smallQrCode: {
    width: 80,
    height: 80,
    backgroundColor: "#f0f0f0",
    borderRadius: PX.n8,
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: PX.n10,
  },
  smallQrCodeDisabled: {
    borderColor: "#ccc",
    opacity: 0.5,
  },
  locationInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n8,
    // paddingHorizontal: PX.n10,
    // paddingVertical: PX.n8,
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
    // minWidth: 100,
    marginBottom: PX.n8,
  },
  locationInputDisabled: {
    color: "#666",
    opacity: 0.5,
  },
  stockLabel: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    color: "#666",
    marginBottom: 5,
  },
  stockValue: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    color: "#333",
    paddingHorizontal: PX.n15,
    paddingVertical: PX.n8,
    borderRadius: PX.n8,
    minWidth: 80,
    textAlign: "center",
  },
  arrowContainer: {
    paddingHorizontal: PX.n15,
    justifyContent: "center",
    alignItems: "center",
    height: 80, // 与二维码高度一致
    // backgroundColor: "red",
  },
  arrow: {
    fontSize: PX.h24,
    color: "#2563eb",
  },
  transferSection: {
    alignItems: "center",
  },
  transferLabel: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    color: "#333",
    marginBottom: 15,
  },
  transferInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n12,
    paddingHorizontal: PX.n15,
    paddingVertical: PX.n8,
    fontSize: PX.h24,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
    minWidth: 150,
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: PX.n20,
    paddingVertical: PX.n12,
    paddingBottom: PX.n50 + 8,
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  btnWrap: {
    flex: 1,
    borderRadius: PX.n30,
    paddingVertical: PX.pv8,
    paddingHorizontal: PX.n8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#555",
    fontSize: PX.h20,
    fontFamily: "SongTi",
    letterSpacing: 1,
  },

  // 弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: PX.n20,
    paddingVertical: PX.n40,
    alignItems: "center",
    minWidth: 300,
    height: "auto",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
  },
  modalSubtitle: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },

  printButton: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n25,
    paddingHorizontal: PX.n30,
    paddingVertical: PX.n10,
  },
  printButtonText: {
    color: "#fff",
    fontSize: PX.h20,
    fontFamily: "SongTi",
    textAlign: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n25,
    paddingHorizontal: PX.n30,
    paddingVertical: PX.n10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: PX.h20,
    fontFamily: "SongTi",
    textAlign: "center",
  },

  // 产品信息展示样式
  productInfoSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: PX.n12,
    padding: PX.n15,
    marginBottom: PX.n15,
    marginTop: PX.n10,
  },
  productInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: PX.n10,
  },
  productInfoTitle: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
    fontWeight: "600",
  },
  packageIdBadge: {
    backgroundColor: "#2563eb",
    color: "#fff",
    fontSize: PX.h14,
    fontFamily: "SongTi",
    paddingHorizontal: PX.n8,
    paddingVertical: PX.n4,
    borderRadius: PX.n12,
    fontWeight: "600",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: PX.n2,
  },
  infoLabel: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#666",
    // minWidth: 50,
  },
  infoValue: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#333",
    fontWeight: "600",
    flex: 1,
  },
  quantityHighlight: {
    color: "#2563eb",
    // backgroundColor: "rgba(37, 99, 235, 0.1)",
    // paddingHorizontal: PX.n8,
    paddingVertical: PX.n2,
    borderRadius: PX.n6,
    fontWeight: "900",
  },

  // 备注样式
  remarkSection: {
    alignItems: "center",
    marginTop: PX.n10,
  },
  remarkLabel: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#333",
    marginBottom: PX.n10,
  },
  remarkInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n12,
    paddingHorizontal: PX.n15,
    paddingVertical: PX.n8,
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#333",
    minWidth: "100%",
    minHeight: 80,
  },
});
