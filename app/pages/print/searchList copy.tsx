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
} from "react-native";
import { captureRef } from "react-native-view-shot";

import { useRouter, useLocalSearchParams } from "expo-router";
import BluetoothService from "../../utils/BluetoothService";
import { BluetoothDevice } from "react-native-bluetooth-classic";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NativeTestModule, { DeviceInfo } from "../productIn/NativeTestModule";
import QRCode from "react-native-qrcode-svg";
import * as PX from "@/app/pages/config";
import AnimatedBackground from "../../components/AnimatedBackground";

import { getPutInStorageRecordLog } from "@/app/api/putin";

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

  const [formData, setFormData] = useState({
    productCode: params.productCode as string,
    color: params.color as string,
    size: params.size as string,
    needleType: params.needleType as string,
    productName: params.productName as string,
    processCode: params.processId,
    storageId: (parseFloat(params.storageId as string) as number) || "",
    productLineId: (parseFloat(params.productLineId as string) as number) || "",
    putInboundQuantity:
      (parseFloat(params.putInboundQuantity as string) as number) || "",
  });
  const [stockData, setStockData] = useState<IHistory[]>([]);

  const [pType, setPType] = useState("qrcode");
  const [scanDesc, setScanDesc] = useState("");
  const [scanSubTitle, setScanSubTitle] = useState("");
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);

  const [printAvaliable, setPrintAvaliable] = useState(false);
  const qrCodeViewRef = useRef<View>(null);

  const handleSearch = async () => {
    NativeTestModule.showLoading("loading");

    const data = Object.assign(formData, {
      pageNumber: 1,
      pageSize: 100,
    });
    //@ts-ignore
    const res = await getPutInStorageRecordLog(data);
    //@ts-ignore
    if (res.code == 200) {
      setStockData(res.data);
      console.log("搜索结果", res);
    }
    NativeTestModule.hideLoading();
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
  });

  // 保存二维码为base64
  const saveQRCodeAsBase64 = async () => {
    try {
      if (qrCodeViewRef.current) {
        const uri = await captureRef(qrCodeViewRef.current, {
          format: "png",
          quality: 1.0,
          result: "base64",
        });

        setQrCodeBase64(uri);
        console.log("QR Code Base64:", uri);
        return uri;
      }
    } catch (error) {
      console.error("保存二维码失败:", error);
      // Alert.alert("错误", "保存二维码失败");
      return null;
    }
  };

  const setCurrentProduct = async (item: any) => {
    const data = {
      tag: "productQRCode",
      productCode: item.productCode,
      storageCode: item.storageCode,
      color: item.color,
      size: item.size,
      needleType: item.needleType,
      productName: item.productName,
      processCode: item.processCode,
    };

    const qrDataString = JSON.stringify(data);
    setQrCodeData(qrDataString);

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

  const loadPairedDevices2 = async () => {
    try {
      const pairedDevices = await BluetoothService.getPairedDevices();
      setDevices(pairedDevices);

      console.log("product", printData);

      const mac = await AsyncStorage.getItem("mac");
      if (
        pairedDevices.length > 0 &&
        pairedDevices.find((d) => d.address == mac)
      ) {
        // Alert.alert(
        //   "已配对设备",
        //   pairedDevices.map((d) => d.address).join("｜，")
        // );
        setScanDesc("已搜索到打印机");
        setScanSubTitle("点击按钮开始打印");
        setPrintAvaliable(true);
      } else {
        setScanDesc("未搜索到指定设备");
        setScanSubTitle("请配对后再试");

        // Alert.alert("提示", "没有搜索到指定设备,请配对后再试");
      }
    } catch (error) {
      console.error("获取已配对设备失败:", error);
    }
  };

  const handerPrintData = async (item?: BluetoothDevice) => {
    const base64 = await saveQRCodeAsBase64();

    if (!base64) {
      Alert.alert("错误", "保存二维码失败");
    }

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
      const ret = await putInStorageRecord(dataSubmit);
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

          {stockData.map((productData, index) => (
            <View key={index} style={styles.contentContainer}>
              {/* 基本信息 */}
              <View style={styles.infoSection}>
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
                    {productData.processCode}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>产线:</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      fixedProductName ? styles.fixed : "",
                    ]}
                  >
                    {productData.productLineString}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>库位:</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      fixedProductName ? styles.fixed : "",
                    ]}
                  >
                    {productData.storageCode}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>数量:</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      fixedProductName ? styles.fixed : "",
                    ]}
                  >
                    {productData.putInboundQuantity}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>入库时间:</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      fixedProductName ? styles.fixed : "",
                      { fontSize: PX.h16 },
                    ]}
                  >
                    {productData.createTimeString}
                  </Text>
                </View>

                {/* 查看详情按钮 */}
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => setCurrentProduct(productData)}
                >
                  <Text style={styles.detailButtonText}>打印产品码</Text>
                </TouchableOpacity>

                {/* <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>工序:</Text>
                <Text style={styles.infoValue}>{stockData.process}</Text>
              </View> */}
              </View>
            </View>
          ))}
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

              <View ref={qrCodeViewRef} style={styles.qrCodeContainer}>
                {qrCodeData && (
                  <View>
                    <QRCode
                      value={qrCodeData}
                      size={200}
                      backgroundColor="white"
                      color="black"
                      quietZone={10}
                    />
                    {/* <Text style={styles.modalSubtitle}>
                      {printData.productCode}
                    </Text> */}
                  </View>
                )}
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    (styles.printButton,
                    !printAvaliable ? styles.cancelButton : {})
                  }
                  onPress={() => {
                    if (printAvaliable) {
                      handerPrintData();
                    }
                  }}
                >
                  <Text
                    style={
                      (styles.printButtonText,
                      !printAvaliable
                        ? { ...styles.cancelButtonText, opacity: 0.5 }
                        : {})
                    }
                  >
                    打印
                  </Text>
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
    fontSize: PX.h28,

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
    paddingVertical: PX.n12,
    // borderBottomWidth: 1,
    // borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: PX.h24,
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
  qrCodeContainer: {
    backgroundColor: "white",
    padding: PX.n16,
    borderRadius: PX.n8,
    marginBottom: PX.n20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    paddingBottom: PX.n50,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    // elevation: 5,
    justifyContent: "center",
  },
  btnContainerWrap: {
    borderRadius: PX.n30,
    // elevation: 10,
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: PX.n12,
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
    minWidth: 300,
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
    marginBottom: PX.n30,
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
    paddingVertical: PX.n12,
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
});
