import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  TextInput,
  Image,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import PackagePreview from "../../components/PackagePreview";

import { useRouter, useLocalSearchParams } from "expo-router";
import BluetoothService from "../../utils/BluetoothService";
import { BluetoothDevice } from "react-native-bluetooth-classic";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NativeTestModule, { DeviceInfo } from "../productIn/NativeTestModule";
import QRCode from "react-native-qrcode-svg";
import * as PX from "@/app/pages/config";
import AnimatedBackground from "../../components/AnimatedBackground";

// import { getPutInStorageRecordLog } from "@/app/api/putin";
import { getPackageList } from "@/app/api/package";

interface IStockDetailProps {
  storageCode: string;
  putInboundQuantity: number;
  operator: string;
  createTime: string;
  creationTimeString: string;
  createTimeString: string;
  isTransferred: boolean;
}
interface IStockItem {
  productInformation: {
    productCode: string;
    color: string;
    size: string;
    needleType: string;
    productName: string;
    processId: number;
    productLineString: string;
    processCode: string;
  };
  putInStorageRecordList: IStockDetailProps[];
}

interface IHistory {
  productCode: string;
  color: string;
  size: string;
  needleType: string;
  productName: string;
  processId: number;
  storageCode: string;
  putInboundQuantity: number;
  operator: string;
  createTime: string;
  creationTimeString: string;
  createTimeString: string;
  isTransferred: boolean;
  productLineString: string;
  processCode: string;
}

interface IPackge {
  productCode: string;
  color: string;
  size: string;
  needleType: string;
  productName: string;

  id: number;
  storageCode: string;
  putInboundQuantity: number;
  operator: string;
  createTime: string;
  createTimeStr: string;
  createTimeString: string;
  isTransferred: boolean;
  productLineString: string;
  processCode: string;
  finishedProcess: string;
  currentStorage: string;
  currentQuantity: string;
  photoPath: string;
}

const width = 70 * 5 * PX.scale;
const height = 40 * 5 * PX.scale;
const qrSectionWidth = (width * 3) / 7;
const infoSectionWidth = (width * 4) / 7;
const qrSize = Math.min(qrSectionWidth * 0.8, height * 0.8);

export default function Manual() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [fixedProductCode, setFixedProductCode] = useState(
    params.productCode ? true : false
  );
  const [fixedColor, setFixedColor] = useState(params.color ? true : false);
  const [fixedSize, setFixedSize] = useState(params.size ? true : false);
  const [fixedNeedleType, setFixedNeedleType] = useState(
    params.needleType ? true : false
  );
  const [qrCodeData, setQrCodeData] = useState("");

  const [fixedProductName, setFixedProductName] = useState(
    params.productName ? true : false
  );
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [currentLabelId, setCurrentLabelId] = useState<number>(0);
  const [currentPrintTag, setCurrentPrintTag] = useState<string>("");
  const labelViewRef = useRef<View>(null);

  const [formData, setFormData] = useState({
    productCode: params.productCode as string,
    productName: params.productName as string,

    color: params.color as string,
    size: params.size as string,
    needleType: params.needleType as string,
    processCode: params.processId,
    // storageId: (parseFloat(params.storageId as string) as number) || "",
    // productLineId: (parseFloat(params.productLineId as string) as number) || "",
    // putInboundQuantity:
    //   (parseFloat(params.putInboundQuantity as string) as number) || "",
  });
  const [stockData, setStockData] = useState<IPackge[]>([]);

  const [pType, setPType] = useState("qrcode");
  const [scanDesc, setScanDesc] = useState("");
  const [scanSubTitle, setScanSubTitle] = useState("");
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);

  const [printAvaliable, setPrintAvaliable] = useState(false);
  const qrCodeViewRef = useRef<View>(null);

  // 图片预览相关状态
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string>("");

  const handleSearch = async () => {
    // NativeTestModule.showLoading("loading");

    const data = {
      productCode: formData.productCode,
      productName: formData.productName,
      color: formData.color,
      size: formData.size,
      needleType: formData.needleType,
      processArray: [formData.processCode],
      pageNumber: 1,
      pageSize: 100,
    };
    console.log("handleSearch", data);

    //@ts-ignore
    const res = await getPackageList(data);
    //@ts-ignore
    if (res.code == 200) {
      setStockData(res.data);
      console.log("搜索结果", res);
    }
    // NativeTestModule.hideLoading();
  };

  const [printData, setPrintData] = useState({
    productCode: "",
    color: "",
    size: "",
    needleType: "",
    productName: "",
    processCode: "",
    photoPath: "",
    storageId: "",
    storageCode: "",
    productLineId: "",
    putInboundQuantity: "",
    orderId: "",
  });

  const buildBase64 = async (labelId: number) => {
    console.log("生成标签base64, 类型:", currentPrintTag, "ID:", labelId);

    // 等待组件重新渲染
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

  const setCurrentProduct = async (item: any, tag: string) => {
    console.log("setCurrentProduct", item);
    setCurrentPrintTag(tag);

    const data = {
      tag: tag,
      productCode: item.productCode,
      productName: item.productName,
      color: item.color,
      size: item.size,
      needleType: item.needleType,
      orderId: item.orderId || "",
      // processCode: item.processCode,
      // storageCode: item.storageCode,
    };

    if (tag == "packageQRCode") {
      setQrCodeData(
        JSON.stringify({
          tag: tag,
          id: item.id,
        })
      );
      //@ts-ignore
      data.id = item.id;
      setCurrentLabelId(item.id);
    } else {
      setQrCodeData(
        JSON.stringify({
          tag: tag,
          productCode: item.productCode,
          productName: item.productName,
          color: item.color,
          size: item.size,
          needleType: item.needleType,
        })
      );
      setCurrentLabelId(0);
    }

    setScanDesc("正在搜索指定打印机");
    setPrintData(item);
    setScanSubTitle("");
    setPrintAvaliable(false);
    setShowSuccessModal(true);
    await loadPairedDevices();
  };

  const loadPairedDevices = async () => {
    try {
      const mac = await AsyncStorage.getItem("mac");
      const pairedDevices = await BluetoothService.getPairedDevices();
      setDevices(pairedDevices);
      if (
        pairedDevices.length > 0 &&
        pairedDevices.find((d) => d.address == mac)
      ) {
        const mac = await AsyncStorage.getItem("mac");
        const res = await NativeTestModule.connectPrinter(mac);
        //@ts-ignore
        if (res == 0) {
          setScanDesc("已连接至打印机");
          setScanSubTitle("点击按钮开始打印");
          setPrintAvaliable(true);
        } else {
          setScanDesc("未能连接到打印机");
          setScanSubTitle("请确认后再试");
        }
      } else {
        setScanDesc("未搜索到指定设备");
        setScanSubTitle("请配对后再试");

        // Alert.alert("提示", "没有搜索到指定设备,请配对后再试");
      }
    } catch (error) {
      console.error("获取已配对设备失败:", error);
    }
  };

  const loadPairedDevices1 = async () => {
    try {
      setScanDesc("已连接至打印机");
      setScanSubTitle("点击按钮开始打印");
      setPrintAvaliable(true);
    } catch (error) {
      console.error("获取已配对设备失败:", error);
    }
  };

  const handerPrintData = async (item?: BluetoothDevice) => {
    let base64 = "";

    // 根据打印类型选择不同的生成方式
    if (currentPrintTag === "packageQRCode" && currentLabelId > 0) {
      // 容器使用buildBase64生成标签图片
      base64 = await buildBase64(currentLabelId);
    } else {
      // 产品码或其他情况使用buildBase64生成标签图片
      base64 = await buildBase64(0);
    }

    console.log("--------------------------");

    console.log(base64);

    if (!base64) {
      Alert.alert("错误", "生成打印图片失败");
      return;
    }

    // await NativeTestModule.showToast(base64);

    //qrcode,text,barcode,line,graph
    const mac = await AsyncStorage.getItem("mac");
    // const res = await NativeTestModule.connectPrinter(mac);
    const res = await NativeTestModule.connectAndPrintQrCode(
      mac,
      "image",
      base64
    );
    if (res == "success") {
      //@ts-ignore
      // const ret = await putInStorageRecord(dataSubmit);
      setShowSuccessModal(false);
      await NativeTestModule.showToast("打印成功");
    } else {
      await NativeTestModule.showToast("打印失败！");
    }
  };

  useEffect(() => {
    // search();
    handleSearch();
  }, []);

  return (
    <AnimatedBackground
      source={require("../../../assets/images/background2.png")}
      duration={600}
    >
      <View style={styles.container}>
        <Text style={styles.title}>查询结果</Text>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 工序库存详情 */}
          {stockData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂未查询到相关产品</Text>
            </View>
          ) : (
            stockData.map((productData, index) => (
              <View key={index} style={styles.contentContainer}>
                {/* 基本信息 */}
                <View style={styles.infoSection}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>容器:</Text>
                    <Text style={[styles.infoValue]}>{productData.id}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>货号:</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        fixedProductCode ? styles.fixed : "",
                      ]}
                    >
                      {productData.productCode}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>颜色:</Text>
                    <Text
                      style={[styles.infoValue, fixedColor ? styles.fixed : ""]}
                    >
                      {productData.color}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>尺码:</Text>
                    <Text
                      style={[styles.infoValue, fixedSize ? styles.fixed : ""]}
                    >
                      {productData.size}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>针型:</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        fixedNeedleType ? styles.fixed : "",
                      ]}
                    >
                      {productData.needleType}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>品名:</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        fixedProductName ? styles.fixed : "",
                      ]}
                    >
                      {productData.productName}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>工序:</Text>
                    <Text
                      style={[
                        styles.infoValue,
                        fixedProductName ? styles.fixed : "",
                      ]}
                    >
                      {productData.finishedProcess}
                    </Text>
                  </View>

                  {/* <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>产线:</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      fixedProductName ? styles.fixed : "",
                    ]}
                  >
                    {productData.productLineString}
                  </Text>
                </View> */}

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>当前库位:</Text>
                    <Text style={[styles.infoValue]}>
                      {productData.currentStorage}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>数量:</Text>
                    <Text style={[styles.infoValue]}>
                      {productData.currentQuantity}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>入库时间:</Text>
                    <Text style={[styles.infoValue, { fontSize: PX.h16 }]}>
                      {productData.createTimeStr}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>照片:</Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (productData.photoPath) {
                          setPreviewImageUri(productData.photoPath);
                          setShowImagePreview(true);
                        }
                      }}
                    >
                      <Image
                        source={{ uri: productData.photoPath }}
                        style={styles.productImage}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.buttonRow}>
                    {/* 打印容器码按钮 */}
                    <TouchableOpacity
                      style={styles.halfWidthButton}
                      onPress={() =>
                        setCurrentProduct(productData, "packageQRCode")
                      }
                    >
                      <Text style={styles.detailButtonText}>打印容器码</Text>
                    </TouchableOpacity>

                    {/* 打印产品码按钮 */}
                    <TouchableOpacity
                      style={styles.halfWidthButton}
                      onPress={() =>
                        setCurrentProduct(productData, "productQRCode")
                      }
                    >
                      <Text style={styles.detailButtonText}>打印产品码</Text>
                    </TouchableOpacity>
                  </View>

                  {/* <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>工序:</Text>
                <Text style={styles.infoValue}>{stockData.process}</Text>
              </View> */}
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.btnContainerWrap, { backgroundColor: "#dbdbdb" }]}
            onPress={() => router.back()}
          >
            <View style={styles.backBtn}>
              <Text style={styles.backBtnText}>返回上页</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 打印弹窗 */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>{scanDesc}</Text>

              <Text style={styles.modalSubtitle}>{scanSubTitle}</Text>

              <View style={styles.printPreviewContainer}>
                {/* 隐藏的标签区域，用于生成打印图片 */}
                <View
                  ref={labelViewRef}
                  style={[
                    styles.labelView,
                    {
                      position: "absolute",
                      zIndex: 991,
                      left: 1111110,
                      top: 0,
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
                  {currentPrintTag === "packageQRCode" ? (
                    // 容器标签布局
                    <View style={styles.packagePreviewContent}>
                      <View
                        style={[styles.packagePreviewRow, { width, height }]}
                      >
                        <View
                          style={[
                            styles.packagePreviewQRSection,
                            { width: qrSectionWidth },
                          ]}
                        >
                          <QRCode
                            value={qrCodeData}
                            size={qrSize}
                            backgroundColor="white"
                            color="black"
                            quietZone={6}
                          />

                          <Text style={styles.packagePreviewIdText}>
                            ID : {currentLabelId}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.packagePreviewInfoSection,
                            { width: infoSectionWidth },
                          ]}
                        >
                          <Text style={styles.packagePreviewInfoText}>
                            订单: {printData.orderId}
                          </Text>
                          <Text style={styles.packagePreviewInfoText}>
                            货号: {printData.productCode}
                          </Text>
                          <Text style={styles.packagePreviewInfoText}>
                            品名: {printData.productName}
                          </Text>
                          <Text style={styles.packagePreviewInfoText}>
                            颜色: {printData.color}
                          </Text>
                          <Text style={styles.packagePreviewInfoText}>
                            尺码: {printData.size}
                          </Text>
                          <Text style={styles.packagePreviewInfoText}>
                            针型: {printData.needleType}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    // 产品标签布局
                    <View style={styles.packagePreviewContent}>
                      <View
                        style={[styles.packagePreviewRow, { width, height }]}
                      >
                        <View
                          style={[
                            styles.packagePreviewQRSection,
                            { width: qrSectionWidth },
                          ]}
                        >
                          <QRCode
                            value={qrCodeData}
                            size={qrSize}
                            backgroundColor="white"
                            color="black"
                            quietZone={6}
                          />
                        </View>
                        <View
                          style={[
                            styles.packagePreviewInfoSection,
                            { width: infoSectionWidth },
                          ]}
                        >
                          <Text style={styles.packagePreviewInfoText}>
                            货号: {printData.productCode}
                          </Text>
                          <Text style={styles.packagePreviewInfoText}>
                            品名: {printData.productName}
                          </Text>
                          <Text style={styles.packagePreviewInfoText}>
                            颜色: {printData.color}
                          </Text>
                          <Text style={styles.packagePreviewInfoText}>
                            尺码: {printData.size}
                          </Text>
                          <Text style={styles.packagePreviewInfoText}>
                            针型: {printData.needleType}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>

                {/* 显示的预览区域 */}
                <View
                  style={[
                    styles.qrCodeContainer,
                    {
                      opacity: 1,
                    },
                  ]}
                >
                  {qrCodeData && (
                    <View style={styles.previewContent}>
                      {currentPrintTag === "packageQRCode" ? (
                        // 容器预览
                        <PackagePreview
                          qrCodeString={qrCodeData}
                          packageId={currentLabelId + ""}
                          infoFields={[
                            { label: "订单", value: printData.orderId },
                            { label: "货号", value: printData.productCode },
                            { label: "品名", value: printData.productName },
                            { label: "颜色", value: printData.color },
                            { label: "尺码", value: printData.size },
                            { label: "针型", value: printData.needleType },
                          ]}
                        />
                      ) : (
                        // 产品预览
                        <PackagePreview
                          qrCodeString={qrCodeData}
                          infoFields={[
                            { label: "货号", value: printData.productCode },
                            { label: "品名", value: printData.productName },
                            { label: "颜色", value: printData.color },
                            { label: "尺码", value: printData.size },
                            { label: "针型", value: printData.needleType },
                          ]}
                        />
                      )}
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      backgroundColor: printAvaliable ? "#2563eb" : "#F5F5F5",
                      borderColor: printAvaliable ? "#2563eb" : "#ddd",
                    },
                  ]}
                  disabled={!printAvaliable}
                  onPress={() => {
                    if (printAvaliable) {
                      handerPrintData();
                    }
                    // handerPrintData();
                  }}
                >
                  <Text
                    style={[
                      styles.cancelButtonText,
                      {
                        color: printAvaliable ? "#fff" : "#00000045",
                      },
                    ]}
                  >
                    打印
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 图片预览模态框 */}
        <Modal
          visible={showImagePreview}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowImagePreview(false)}
        >
          <View style={styles.imagePreviewOverlay}>
            <TouchableOpacity
              style={styles.imagePreviewCloseArea}
              onPress={() => setShowImagePreview(false)}
            >
              <View style={styles.imagePreviewContainer}>
                <TouchableOpacity
                  style={styles.imagePreviewCloseButton}
                  onPress={() => setShowImagePreview(false)}
                >
                  <Text style={styles.imagePreviewCloseText}>×</Text>
                </TouchableOpacity>
                <Image
                  source={{ uri: previewImageUri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
              </View>
            </TouchableOpacity>
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
    borderRadius: PX.n15,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: PX.n20,
    // marginTop: 10,
    marginBottom: PX.n20,
  },
  contentContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: PX.n15,
    padding: PX.n20,
    marginBottom: PX.n20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoSection: {
    // marginBottom: 30,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: PX.n4,
    // borderBottomWidth: 1,
    // borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: PX.h20,
    fontFamily: "SongTi",

    color: "#333",
    // flex: 2,
    // borderWidth: 1,
    // borderColor: "#e0e0e0",
  },
  infoValue: {
    fontSize: PX.h18,
    fontFamily: "SongTi",

    color: "#333",
    flex: 1,
    textAlign: "right",
    // borderWidth: 1,
    // borderColor: "#e0e0e0",
  },
  fixed: {
    color: "#ff0000",
  },
  workshopSection: {
    marginBottom: PX.n25,
  },
  workshopTitleRow: {
    // backgroundColor: "#4a90e2",
    paddingVertical: PX.n8,
    paddingHorizontal: PX.n15,
  },
  workshopTitleText: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    fontWeight: "700",
    color: "#333",

    textAlign: "center",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: PX.n8,
    overflow: "hidden",
  },
  printPreviewContainer: {
    alignItems: "center",
    // marginBottom: PX.n20,
  },
  qrCodeContainer: {
    backgroundColor: "white",
    // padding: PX.n16,
    borderRadius: PX.n8,
    // marginBottom: PX.n20,
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 1,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 2,
    // elevation: 2,
    alignItems: "center",
    opacity: 1.1,
  },
  labelView: {
    backgroundColor: "white",
    // padding: PX.n16,
    borderRadius: PX.n8,
    alignItems: "center",
  },
  labelContent: {
    alignItems: "center",
  },
  labelText: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#333",
    marginTop: PX.n8,
    textAlign: "center",
  },
  productImage: {
    width: PX.n30 * 2,
    height: PX.n30 * 2,
    borderRadius: PX.n8,
    backgroundColor: "#f0f0f0",
    marginLeft: "auto",
  },

  // 图片预览样式
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewCloseArea: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewContainer: {
    width: "90%",
    height: "80%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewCloseButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  imagePreviewCloseText: {
    fontSize: 24,
    color: "#333",
    fontWeight: "bold",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  previewContent: {
    alignItems: "center",
    // borderWidth: 1,
    // borderColor: "#000",
  },
  previewText: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
    marginTop: PX.n12,
    textAlign: "center",
  },
  previewSubText: {
    fontSize: PX.h14,
    fontFamily: "SongTi",
    color: "#666",
    marginTop: PX.n6,
    textAlign: "center",
  },
  // 容器标签样式 - 与PackagePreview保持一致
  packageLabelContent: {
    alignItems: "center",
  },
  packageLabelRow: {
    flexDirection: "row",
    backgroundColor: "white",
    alignItems: "center",
  },
  packageQRSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: PX.n2,
    borderColor: "#333",
    height: "100%",
  },
  packageInfoSection: {
    borderColor: "#333",
    paddingLeft: PX.n8,
    justifyContent: "center",
    height: "100%",
  },
  packageIdText: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#000",
    marginTop: PX.n8,
    textAlign: "center",
    fontWeight: "bold",
  },
  packageInfoText: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#000",
    marginBottom: PX.n6,
    lineHeight: PX.h20,
    fontWeight: "500",
  },
  // 产品标签样式 - 与PackagePreview保持一致
  productLabelContent: {
    alignItems: "center",
  },
  productLabelRow: {
    flexDirection: "row",
    backgroundColor: "white",
    alignItems: "center",
  },
  productQRSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: PX.n2,
    borderColor: "#333",
    height: "100%",
  },
  productInfoSection: {
    borderColor: "#333",
    paddingLeft: PX.n8,
    justifyContent: "center",
    height: "100%",
  },
  productInfoText: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#000",
    marginBottom: PX.n6,
    lineHeight: PX.h20,
    fontWeight: "500",
  },

  // 产品预览样式
  productPreviewContent: {
    alignItems: "center",
  },
  productPreviewRow: {
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "#333",
    backgroundColor: "white",
    padding: PX.n12,
    borderRadius: PX.n8,
    maxWidth: "100%",
  },
  productPreviewInfoSection: {
    flex: 1,
    paddingRight: PX.n12,
    justifyContent: "center",
  },
  productPreviewQRSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: PX.n12,
    marginRight: PX.n12,

    borderRightWidth: 1,
    borderLeftColor: "#333",
  },
  productPreviewInfoText: {
    fontSize: PX.h14,
    fontFamily: "SongTi",
    color: "#000",
    marginBottom: PX.n4,
    lineHeight: PX.h18,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    // paddingVertical: PX.n12,
    paddingHorizontal: PX.n15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  tableHeaderText: {
    flex: 1,
    fontSize: PX.h24,
    fontFamily: "SongTi",

    color: "#333",
    textAlign: "center",
    paddingVertical: PX.n8,
  },
  tableRow: {
    flexDirection: "row",
    // paddingVertical: PX.n12,
    paddingHorizontal: PX.n15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  tableCellText: {
    flex: 1,
    fontSize: PX.h24,
    fontFamily: "SongTi",

    color: "#333",
    textAlign: "center",
    paddingVertical: PX.n8,
  },
  cellLine: {
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: PX.n20,
    paddingVertical: PX.n12,
    paddingBottom: PX.n50 + 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    // elevation: 5,
    justifyContent: "center",
  },
  btnContainerWrap: {
    borderRadius: PX.n30,
    // elevation: 10,
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: PX.pv8,
    paddingHorizontal: PX.n36,
    minWidth: 120,
  },
  backBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
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
    minWidth: PX.n50 * 6,
    maxWidth: "100%",

    height: "auto",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    // elevation: 5,
  },
  modalTitle: {
    fontSize: PX.h24,

    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
    marginBottom: PX.n15,
  },
  modalSubtitle: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#666",
    textAlign: "center",
    // marginBottom: PX.n30,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n25,
    paddingHorizontal: PX.n30,
    paddingVertical: PX.n4,
    minWidth: 120,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: PX.h20,

    fontFamily: "SongTi",
    textAlign: "center",
  },
  printButton: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n25,
    paddingHorizontal: PX.n30,
    paddingVertical: PX.n12,
    minWidth: 120,
  },
  printButtonText: {
    color: "#fff",
    fontSize: PX.h18,

    fontFamily: "SongTi",
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: PX.n12,
    gap: PX.n10,
  },
  halfWidthButton: {
    backgroundColor: "#4F8EF7",
    borderRadius: PX.n30,
    paddingVertical: PX.n10,
    paddingHorizontal: PX.n2,
    alignItems: "center",
    flex: 1,
    shadowColor: "#4F8EF7",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  detailButton: {
    backgroundColor: "#4F8EF7",
    borderRadius: PX.n30,
    paddingVertical: PX.n10,
    // paddingHorizontal: 10,
    alignItems: "center",
    marginTop: PX.n15,
    shadowColor: "#4F8EF7",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    width: "50%",
    marginHorizontal: "25%",
  },
  detailButtonText: {
    color: "#fff",
    fontSize: PX.h18,
    fontFamily: "SongTi",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: PX.n50 * 2,
  },
  emptyText: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    color: "#999",
    textAlign: "center",
  },
  packagePreviewContent: {
    alignItems: "center",
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
    // justifyContent: "center",

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
