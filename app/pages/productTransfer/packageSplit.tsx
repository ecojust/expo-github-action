import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Modal,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter } from "expo-router";
import { captureRef } from "react-native-view-shot";
import QRCode from "react-native-qrcode-svg";
import BluetoothService from "../../utils/BluetoothService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AnimatedBackground from "../../components/AnimatedBackground";
import ScanModal from "../../components/ScanModal";
import PackagePreview from "../../components/PackagePreview";
import * as PX from "@/app/pages/config";
import NativeTestModule from "@/src/NativeTestModule";
import {
  getPackageDetails,
  packageSplit,
  packageMerge,
  getPrePackagerId,
} from "@/app/api/package";

const width = 70 * 5 * PX.scale;
const height = 40 * 5 * PX.scale;
const qrSectionWidth = (width * 3) / 7;
const infoSectionWidth = (width * 4) / 7;
const qrSize = Math.min(qrSectionWidth * 0.8, height * 0.8);

export default function PackageSplit() {
  const router = useRouter();
  const [scanModalVisible, setScanModalVisible] = useState(false);

  const [qrCodeDialogVisible, setQrCodeDialogVisible] = useState(false);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [splitLoading, setSplitLoading] = useState(false);
  const [printAvailable, setPrintAvailable] = useState(false);
  const [printStatus, setPrintStatus] = useState("正在搜索指定打印机");
  const [printSubStatus, setPrintSubStatus] = useState("");

  const labelViewRef = useRef<View>(null);

  // 产品信息
  const [productInfo, setProductInfo] = useState({
    productCode: "",
    productName: "",
    color: "",
    needleType: "",
    size: "",
    finishedProcess: "",
    totalQuantity: 0,
    orderId: "",
    productInfoId: "",
  });

  // 容器信息
  const [packageId, setPackageId] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");

  // 拆合相关
  const [splitQuantity, setSplitQuantity] = useState("");
  const [newPackageId, setNewPackageId] = useState("");

  // 二维码数据
  const [qrCodeData, setQrCodeData] = useState({
    packageId: "",
    productCode: "",
    color: "",
    size: "",
    needleType: "",
    productName: "",
    finishedProcess: "",
    orderId: "",
  });

  // 二维码字符串数据
  const [qrCodeString, setQrCodeString] = useState("");

  // 搜索容器信息
  const handleSearch = async (packageIdValue: string) => {
    try {
      const res = await getPackageDetails({ productProcessId: packageIdValue });
      //@ts-ignore
      if (res.code == 200) {
        setProductInfo({
          productCode: res.data.productCode,
          productName: res.data.productName,
          color: res.data.color,
          needleType: res.data.needleType,
          size: res.data.size,
          finishedProcess: res.data.finishedProcess.replaceAll(",", "  "),
          totalQuantity: res.data.currentQuantity,
          orderId: res.data.orderId,
          productInfoId: res.data.productInfoId,
        });
        setCurrentLocation(res.data.currentStorage);
        setSplitQuantity("");
        // NativeTestModule.showToast("查询成功");
      }
    } catch (error) {
      console.error("查询失败:", error);
      Alert.alert("错误", "查询失败，请重试");
    }
  };

  const handleScanSuccess = (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      console.log("扫描结果:", data);

      if (data.tag == "packageQRCode") {
        setPackageId(data.id);
        handleSearch(data.id);
      } else {
        Alert.alert("错误", "请扫描容器码");
      }
    } catch (error) {
      Alert.alert("错误", "请扫描正确的二维码");
    }
  };

  // 执行拆合
  const handleSplit = async () => {
    if (!splitQuantity || splitQuantity <= 0) {
      Alert.alert("错误", "请输入有效的移出数量");
      return;
    }

    if (splitQuantity > productInfo.totalQuantity) {
      Alert.alert("错误", "移出数量不能大于等于总数量");
      return;
    }

    try {
      // setConfirmDialogVisible(true);
      performSplit();
    } catch (error) {
      console.error("拆封失败:", error);
      Alert.alert("错误", "拆封失败，请重试");
    }
  };

  const performSplit = async () => {
    setSplitLoading(true);
    try {
      if (newPackageId) {
        // 如果指定了目标容器，先验证目标容器是否存在
        const inproduct = await getPackageDetails({
          productProcessId: newPackageId,
        });

        //@ts-ignore
        if (inproduct.code != 200) {
          Alert.alert("错误", "目标容器不存在");
          setSplitLoading(false);
          return;
        }

        console.log(
          "productInfoId对比",
          productInfo.productInfoId,
          inproduct.data.productInfoId
        );

        if (productInfo.productInfoId !== inproduct.data.productInfoId) {
          Alert.alert("错误", "目标容器物品与当前容器物品不一致");
          return;
        }

        // 调用合并容器的接口，传入三个参数
        const res = await packageMerge({
          outProductProcessId: packageId,
          inProductProcessId: newPackageId,
          quantity: splitQuantity,
        });

        console.log("packageMerge", res);

        //@ts-ignore
        if (res.code === 200) {
          // 重新查询容器信息
          // handleSearch(packageId);
          reset();

          //todo
          NativeTestModule.showToast("合并成功");
        } else {
          Alert.alert("错误", "合并失败，请重试");
        }
      } else {
        // 如果没有指定目标容器，先通过getPrePackagerId获取预容器id
        const res = await getPrePackagerId();
        //@ts-ignore
        showQrCodeDialog(res.data.id);
      }
    } catch (error) {
      console.error("拆封失败:", error);
      Alert.alert("错误", "拆封失败，请重试");
    } finally {
      setSplitLoading(false);
    }
  };

  // 显示二维码打印弹窗
  const showQrCodeDialog = async (newId: string) => {
    const qrData = {
      packageId: newId,
      productCode: productInfo.productCode,
      color: productInfo.color,
      size: productInfo.size,
      needleType: productInfo.needleType,
      productName: productInfo.productName,
      finishedProcess: productInfo.finishedProcess,
      orderId: productInfo.orderId,
    };

    setQrCodeData(qrData);

    // 生成二维码字符串
    const qrString = JSON.stringify({
      tag: "packageQRCode",
      id: newId,
      // productCode: productInfo.productCode,
      // color: productInfo.color,
      // size: productInfo.size,
      // needleType: productInfo.needleType,
      // productName: productInfo.productName,
    });
    setQrCodeString(qrString);

    setQrCodeDialogVisible(true);
    setPrintStatus("正在搜索指定打印机");
    setPrintSubStatus("");
    setPrintAvailable(false);

    // 加载打印机设备
    await loadPairedDevices();
  };

  // 加载配对的打印机设备
  const loadPairedDevices = async () => {
    try {
      const mac = await AsyncStorage.getItem("mac");
      const pairedDevices = await BluetoothService.getPairedDevices();

      if (
        pairedDevices.length > 0 &&
        pairedDevices.find((d) => d.address == mac)
      ) {
        const res = await NativeTestModule.connectPrinter(mac);
        //@ts-ignore
        if (res == 0) {
          setPrintStatus("已连接至打印机");
          setPrintSubStatus("点击按钮开始打印");
          setPrintAvailable(true);
        } else {
          setPrintStatus("未能连接到打印机");
          setPrintSubStatus("请确认后再试");
        }
      } else {
        setPrintStatus("未搜索到指定设备");
        setPrintSubStatus("请配对后再试");
      }
    } catch (error) {
      console.error("获取已配对设备失败:", error);
      setPrintStatus("连接失败");
      setPrintSubStatus("请重试");
    }
  };

  // 生成标签base64图片
  const buildBase64 = async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      if (labelViewRef.current) {
        const uri = await captureRef(labelViewRef.current, {
          format: "png",
          quality: 1.0,
          result: "base64",
        });
        return uri;
      }
    } catch (error) {
      console.error("生成标签base64失败:", error);
    }

    return "";
  };

  // 处理打印
  const handlePrint = async () => {
    const base64 = await buildBase64();

    if (!base64) {
      Alert.alert("错误", "生成打印图片失败");
      return;
    }

    try {
      const mac = await AsyncStorage.getItem("mac");
      const res = await NativeTestModule.connectAndPrintQrCode(
        mac,
        "image",
        base64
      );

      if (res == "success") {
        NativeTestModule.showToast("打印成功");
        // 打印成功后执行拆合操作
        confirmSplit();
      } else {
        NativeTestModule.showToast("打印失败！");
      }
    } catch (error) {
      console.error("打印失败:", error);
      Alert.alert("错误", "打印失败，请重试");
    }
  };

  const reset = () => {
    setProductInfo({
      productCode: "",
      productName: "",
      color: "",
      needleType: "",
      size: "",
      finishedProcess: "",
      totalQuantity: 0,
      orderId: "",
      productInfoId: "",
    });
  };

  // 确认拆合并打印 - 在弹窗中点击确认的时候，执行packageSplit操作
  const confirmSplit = async () => {
    try {
      const res = await packageSplit({
        productProcessId: packageId,
        quantity: splitQuantity,
      });

      //@ts-ignore
      if (res.code === 200) {
        // handleSearch(packageId);

        reset();
        //todo

        setQrCodeDialogVisible(false);
        // 重新查询容器信息
        NativeTestModule.showToast("拆合成功");
      } else {
        Alert.alert("错误", "拆合失败，请重试");
      }
    } catch (error) {
      console.error("拆合失败:", error);
      Alert.alert("错误", "拆合失败，请重试");
    }
  };

  // 检查拆合按钮是否可用
  const isSplitButtonDisabled = () => {
    return (
      !packageId ||
      !splitQuantity ||
      isNaN(Number(splitQuantity)) ||
      Number(splitQuantity) <= 0 ||
      Number(splitQuantity) > productInfo.totalQuantity
    );
  };

  return (
    <AnimatedBackground
      source={require("../../../assets/images/background2.png")}
      duration={600}
    >
      <View style={styles.container}>
        <Text style={styles.title}>容器拆合</Text>

        <KeyboardAwareScrollView
          style={styles.scrollContainer}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={20}
          keyboardOpeningTime={250}
          resetScrollToCoords={{ x: 0, y: 0 }}
          scrollEnabled={true}
        >
          <View style={styles.contentContainer}>
            {/* 容器码扫描部分 */}
            <View style={styles.sectionContainer}>
              {/* <Text style={styles.sectionTitle}>容器扫描</Text> */}

              <TouchableOpacity
                style={styles.qrCodeContainer}
                onPress={() => setScanModalVisible(true)}
              >
                <View
                  style={[
                    styles.qrCodePlaceholder,
                    packageId && styles.qrCodeScanned,
                  ]}
                >
                  <Image
                    style={styles.qrCodeImage}
                    source={require("../../../assets/images/qrcode.png")}
                  />
                  {packageId && (
                    <View style={styles.scanSuccessIndicator}>
                      <Text style={styles.scanSuccessText}>✓</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[styles.scanHint, packageId && styles.scanHintSuccess]}
                >
                  {packageId ? "扫描成功" : "点击扫描容器二维码"}
                </Text>
              </TouchableOpacity>

              {!packageId && (
                <Text style={styles.scanInstruction}>
                  请先扫描容器二维码开始拆合操作
                </Text>
              )}
            </View>

            {/* 产品信息展示区域 */}
            {productInfo.productCode && (
              <View style={styles.productInfoSection}>
                <View style={styles.productInfoHeader}>
                  <Text style={styles.productInfoTitle}>产品信息</Text>
                  <Text style={styles.packageIdBadge}>ID: {packageId}</Text>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>订单：</Text>
                    <Text style={styles.infoValue}>{productInfo.orderId}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>货号：</Text>
                    <Text style={styles.infoValue}>
                      {productInfo.productCode}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>品名：</Text>
                    <Text style={styles.infoValue}>
                      {productInfo.productName}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>颜色：</Text>
                    <Text style={styles.infoValue}>{productInfo.color}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>针型：</Text>
                    <Text style={styles.infoValue}>
                      {productInfo.needleType}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>尺码：</Text>
                    <Text style={styles.infoValue}>{productInfo.size}</Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>数量：</Text>
                    <Text style={[styles.infoValue, styles.quantityHighlight]}>
                      {productInfo.totalQuantity}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>工序：</Text>
                    <Text style={styles.infoValue}>
                      {productInfo.finishedProcess}
                    </Text>
                  </View>

                  {/* <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>照片:</Text>
                    <Image
                      source={{ uri: productInfo.photoPath }}
                      style={styles.productImage}
                    />
                  </View> */}
                </View>
              </View>
            )}

            {/* 拆合操作区域 */}
            {productInfo.productCode && (
              <View style={styles.splitSection}>
                <Text style={styles.splitSectionTitle}>拆合设置</Text>

                <View style={styles.splitInputSection}>
                  <Text style={styles.inputLabel}>拆合至新容器数量</Text>
                  <View style={styles.quantityInputContainer}>
                    <TextInput
                      style={styles.quantityInput}
                      value={splitQuantity.toString()}
                      onChangeText={(value) => {
                        setSplitQuantity(value);

                        // const num = parseInt(value);
                        // if (num >= 0 && num < productInfo.totalQuantity) {
                        // setSplitQuantity(num);
                        // }
                      }}
                      keyboardType="numeric"
                      placeholder="请输入数量"
                      returnKeyType="done"
                      blurOnSubmit={true}
                      selectTextOnFocus={true}
                    />
                  </View>

                  <Text style={styles.inputLabel}>移出容器ID（可选）</Text>
                  <TextInput
                    style={styles.newPackageInput}
                    value={newPackageId}
                    onChangeText={setNewPackageId}
                    placeholder="若无，系统将自动生成ID"
                    placeholderTextColor="#999"
                  />
                </View>

                {/* 拆合按钮 */}
                <View style={styles.splitActions}>
                  <TouchableOpacity
                    style={[
                      styles.splitButton,
                      {
                        backgroundColor: isSplitButtonDisabled()
                          ? "#ccc"
                          : "#2563eb",
                      },
                    ]}
                    onPress={handleSplit}
                    disabled={isSplitButtonDisabled() || splitLoading}
                  >
                    <Text style={styles.splitButtonText}>
                      {splitLoading ? "拆合中..." : "确认拆合"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </KeyboardAwareScrollView>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
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
          title="扫描容器二维码"
        />

        {/* 确认拆合对话框 */}
        <Modal
          visible={confirmDialogVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setConfirmDialogVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.confirmDialogContainer}>
              <Text style={styles.confirmDialogTitle}>确认拆封</Text>
              <Text style={styles.confirmDialogMessage}>
                确认从容器 {packageId} 中移出 {splitQuantity} 件？
              </Text>

              <View style={styles.confirmDialogButtons}>
                <TouchableOpacity
                  style={styles.confirmCancelButton}
                  onPress={() => setConfirmDialogVisible(false)}
                >
                  <Text style={styles.confirmCancelButtonText}>取消</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmOkButton}
                  onPress={() => {
                    setConfirmDialogVisible(false);
                    performSplit();
                  }}
                >
                  <Text style={styles.confirmOkButtonText}>确认</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 二维码打印弹窗 */}
        <Modal
          visible={qrCodeDialogVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setQrCodeDialogVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.qrCodeModalContainer}>
              <Text style={styles.modalTitle}>新容器二维码标识</Text>

              <Text style={styles.printStatusText}>{printStatus}</Text>
              <Text style={styles.printSubStatusText}>{printSubStatus}</Text>

              {/* 打印预览区域 */}
              <View style={styles.printPreviewContainer}>
                {/* 隐藏的标签视图，用于生成base64图片 */}
                <View
                  ref={labelViewRef}
                  style={[
                    styles.labelView,
                    {
                      position: "absolute",
                      zIndex: 991,
                      left: 111110,
                      top: 10,
                      width: width,
                      height: height,
                      backgroundColor: "white",
                      borderWidth: 0,
                      borderColor: "black",
                      overflow: "hidden",
                      opacity: 1,
                    },
                  ]}
                >
                  <View style={styles.packagePreviewContent}>
                    <View style={[styles.packagePreviewRow, { width, height }]}>
                      <View
                        style={[
                          styles.packagePreviewQRSection,
                          { width: qrSectionWidth },
                        ]}
                      >
                        <QRCode
                          value={qrCodeString}
                          size={qrSize}
                          backgroundColor="white"
                          color="black"
                          quietZone={6}
                        />

                        <Text style={styles.packagePreviewIdText}>
                          ID : {qrCodeData.packageId}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.packagePreviewInfoSection,
                          { width: infoSectionWidth },
                        ]}
                      >
                        <Text style={styles.packagePreviewInfoText}>
                          订单: {qrCodeData.orderId}
                        </Text>
                        <Text style={styles.packagePreviewInfoText}>
                          货号: {qrCodeData.productCode}
                        </Text>
                        <Text style={styles.packagePreviewInfoText}>
                          品名: {qrCodeData.productName}
                        </Text>
                        <Text style={styles.packagePreviewInfoText}>
                          颜色: {qrCodeData.color}
                        </Text>
                        <Text style={styles.packagePreviewInfoText}>
                          尺码: {qrCodeData.size}
                        </Text>
                        <Text style={styles.packagePreviewInfoText}>
                          针型: {qrCodeData.needleType}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 显示的预览区域 */}
                <View style={styles.qrCodeContainer}>
                  {qrCodeString && (
                    <PackagePreview
                      qrCodeString={qrCodeString}
                      packageId={qrCodeData.packageId}
                      infoFields={[
                        { label: "订单", value: qrCodeData.orderId },
                        { label: "货号", value: qrCodeData.productCode },
                        { label: "品名", value: qrCodeData.productName },
                        { label: "颜色", value: qrCodeData.color },
                        { label: "尺码", value: qrCodeData.size },
                        { label: "针型", value: qrCodeData.needleType },
                      ]}
                    />
                  )}
                </View>
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.printButton,
                    !printAvailable && styles.printButtonDisabled,
                  ]}
                  onPress={printAvailable ? handlePrint : undefined}
                  disabled={!printAvailable}
                >
                  <Text
                    style={[
                      styles.printButtonText,
                      !printAvailable && styles.printButtonTextDisabled,
                    ]}
                  >
                    打印
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setQrCodeDialogVisible(false)}
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
  // qrCodeContainer: {
  //   marginVertical: PX.n8,
  //   alignItems: "center",
  // },
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
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  locationItem: {
    alignItems: "center",
    flex: 1,
  },
  productImage: {
    width: PX.n30 * 2,
    height: PX.n30 * 2,
    borderRadius: PX.n8,
    backgroundColor: "#f0f0f0",
    marginLeft: "auto",
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
    paddingHorizontal: PX.n10,
    paddingVertical: PX.n8,
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
    minWidth: 100,
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
    // flexDirection: "row",
    paddingHorizontal: PX.n20,
    paddingVertical: PX.n12,
    paddingBottom: PX.n50 + 8,
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    width: "100%",
  },
  btnWrap: {
    // flex: 1,
    borderRadius: PX.n30,
    // paddingVertical: PX.n12,
    // paddingHorizontal: PX.n8,
    // alignItems: "center",
    // justifyContent: "center", borderRadius: PX.n30,
    paddingVertical: PX.pv8,
    paddingHorizontal: PX.n32,
    // minWidth: 120,
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    // backgroundColor: "blue",
    // width: "80%",
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

  // 总数量显示样式
  totalQuantitySection: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n15,
    padding: PX.n20,
    marginBottom: PX.n15,
    marginTop: PX.n10,
    alignItems: "center",
  },
  totalQuantityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: PX.n15,
  },
  totalQuantityTitle: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#fff",
    fontWeight: "600",
  },
  totalQuantityDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  totalQuantityNumber: {
    fontSize: PX.n48,
    fontFamily: "SongTi",
    fontWeight: "bold",
    color: "#fff",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  totalQuantityUnit: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "rgba(255, 255, 255, 0.9)",
    marginLeft: PX.n8,
    fontWeight: "500",
  },

  // 产品信息展示样式
  productInfoSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: PX.n12,
    padding: PX.n15,
    paddingVertical: PX.n12,
    marginBottom: PX.n4,
    // marginTop: PX.n15,
  },
  productInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: PX.n4,
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
  packageIdBadgeOld: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: "#2563eb",
    fontSize: PX.h14,
    fontFamily: "SongTi",
    paddingHorizontal: PX.n8,
    paddingVertical: PX.n4,
    borderRadius: PX.n12,
    fontWeight: "600",
  },
  // infoGrid: {
  //   flexDirection: "row",
  //   flexWrap: "wrap",
  //   justifyContent: "space-between",
  // },
  // infoItem: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   width: "48%",
  //   marginBottom: PX.n10,
  // },
  // infoLabel: {
  //   fontSize: PX.h16,
  //   fontFamily: "SongTi",
  //   color: "#666",
  //   minWidth: 50,
  // },
  // infoValue: {
  //   fontSize: PX.h16,
  //   fontFamily: "SongTi",
  //   color: "#333",
  //   fontWeight: "600",
  //   flex: 1,
  // },

  // 拆合操作样式
  splitSection: {
    marginTop: PX.n4,
  },
  splitSectionTitle: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#333",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: PX.n4,
  },
  splitInputSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: PX.n12,
    padding: PX.n20,
    paddingVertical: PX.n12,
    marginBottom: PX.n4,
  },
  inputLabel: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#333",
    fontWeight: "600",
    marginBottom: PX.n4,
  },
  quantityInputContainer: {
    marginBottom: PX.n4,
  },
  quantityInput: {
    backgroundColor: "#fff",
    borderRadius: PX.n8,
    paddingHorizontal: PX.n15,
    paddingVertical: PX.n4,
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
    borderWidth: 2,
    borderColor: "#2563eb",
    fontWeight: "600",
  },
  newPackageInput: {
    backgroundColor: "#fff",
    borderRadius: PX.n8,
    paddingHorizontal: PX.n15,
    paddingVertical: PX.n4,
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
    width: "100%",
  },
  splitActions: {
    alignItems: "center",
  },
  splitButton: {
    borderRadius: PX.n25,
    paddingHorizontal: PX.n40,
    paddingVertical: PX.n12,
  },
  splitButtonText: {
    color: "#fff",
    fontSize: PX.h16,
    fontFamily: "SongTi",
    fontWeight: "600",
  },

  // 二维码弹窗样式
  qrCodeModalContainer: {
    backgroundColor: "#fff",
    borderRadius: PX.n20,
    paddingVertical: PX.n40,

    // minWidth: 320,
    // minWidth: PX.n50 * 6,
    maxWidth: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  packageIdHighlight: {
    alignItems: "center",
    marginBottom: PX.n20,
    padding: PX.n20,
    backgroundColor: "#2563eb",
    borderRadius: PX.n12,
  },
  packageIdLabel: {
    fontSize: PX.h14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: PX.n8,
    fontFamily: "SongTi",
    fontWeight: "500",
  },
  packageIdValue: {
    fontSize: PX.h24,
    fontWeight: "bold",
    color: "#ffffff",
    fontFamily: "SongTi",
    letterSpacing: 1,
  },
  qrCodeInfo: {
    marginBottom: PX.n20,
  },

  // 打印状态样式
  printStatusText: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
    marginBottom: PX.n8,
    fontWeight: "600",
  },
  printSubStatusText: {
    fontSize: PX.h14,
    fontFamily: "SongTi",
    color: "#666",
    textAlign: "center",
    // marginBottom: PX.n20,
  },

  // 打印预览样式
  printPreviewContainer: {
    alignItems: "center",
    // marginBottom: PX.n20,
    // borderWidth: 2,
    borderColor: "#333",
  },
  qrCodeContainer: {
    backgroundColor: "white",
    // padding: PX.n16,
    borderRadius: PX.n8,
    // borderWidth: 2,
    // borderColor: "#333",
    // shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
    alignItems: "center",
    // marginHorizontal: PX.n10,
  },
  labelView: {
    backgroundColor: "white",
    padding: PX.n16,
    borderRadius: PX.n8,
    alignItems: "center",
  },

  // 容器标签样式
  packageLabelContent: {
    width: 300,
    height: 200,
    borderWidth: 2,
    borderColor: "#000",
    backgroundColor: "white",
    padding: PX.n8,
  },
  packageLabelRow: {
    flexDirection: "row",
    flex: 1,
  },
  packageQRSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#000",
    paddingRight: PX.n8,
  },
  packageInfoSection: {
    flex: 1.5,
    paddingLeft: PX.n8,
    justifyContent: "center",
  },
  packageIdText: {
    fontSize: PX.h14,
    fontFamily: "SongTi",
    color: "#000",
    marginTop: PX.n4,
    textAlign: "center",
    fontWeight: "bold",
  },
  packageInfoText: {
    fontSize: PX.h12,
    fontFamily: "SongTi",
    color: "#000",
    marginBottom: PX.n2,
    lineHeight: PX.h16,
  },

  // 打印按钮禁用状态
  printButtonDisabled: {
    backgroundColor: "#ccc",
  },
  printButtonTextDisabled: {
    color: "#999",
  },

  // 确认对话框样式
  confirmDialogContainer: {
    backgroundColor: "#fff",
    borderRadius: PX.n20,
    padding: PX.n30,
    minWidth: 300,
    maxWidth: "85%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmDialogTitle: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    color: "#333",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: PX.n20,
  },
  confirmDialogMessage: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#666",
    textAlign: "center",
    marginBottom: PX.n30,
    lineHeight: PX.h24,
  },
  confirmDialogButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: PX.n15,
  },
  confirmCancelButton: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n25,
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  confirmCancelButtonText: {
    color: "#666",
    fontSize: PX.h18,
    fontFamily: "SongTi",
    textAlign: "center",
    fontWeight: "500",
  },
  confirmOkButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    borderRadius: PX.n25,
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n20,
  },
  confirmOkButtonText: {
    color: "#fff",
    fontSize: PX.h18,
    fontFamily: "SongTi",
    textAlign: "center",
    fontWeight: "600",
  },
  packagePreviewContent: {
    alignItems: "center",
    // backgroundColor: "red",
    backgroundColor: "white",
  },
  packagePreviewRow: {
    flexDirection: "row",
    // borderColor: "#333",
    // backgroundColor: "white",
    // borderRadius: PX.n8,
    alignItems: "center",
    // borderWidth: 2,
  },
  packagePreviewQRSection: {
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: PX.n12,
    // paddingRight: PX.n2,
    // borderWidth: 2,
    borderColor: "#333",
    height: "100%",
    // backgroundColor: "red",
    // paddingLeft: 10,
  },
  packagePreviewInfoSection: {
    // backgroundColor: "lightblue",

    // borderWidth: 2,
    borderColor: "#333",
    // paddingLeft: PX.n4,
    justifyContent: "space-between",
    paddingVertical: PX.n12,
    height: "100%",
  },
  packagePreviewIdText: {
    fontSize: PX.h16,
    // fontFamily: "SongTi",
    color: "#000",
    marginTop: PX.n32,
    textAlign: "center",
    fontWeight: "normal",
  },
  packagePreviewInfoText: {
    fontSize: PX.h16,
    // fontFamily: "SongTi",
    color: "#000",
    // marginBottom: PX.n6,
    // lineHeight: PX.h20,
    fontWeight: "normal",
  },
});
