import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Dropdown } from "react-native-element-dropdown";
import StorageLocationPicker from "../../components/StorageLocationPicker";

import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import AnimatedBackground from "../../components/AnimatedBackground";
import Service from "./service";
import { captureRef } from "react-native-view-shot";
import QRCode from "react-native-qrcode-svg";
import { BluetoothDevice } from "react-native-bluetooth-classic";
import BluetoothService from "../../utils/BluetoothService";
import ScanModal from "../../components/ScanModal";

import * as PX from "@/app/pages/config";
import NativeTestModule, { DeviceInfo } from "./NativeTestModule";

import { getStockList, getStockListByProcess } from "../../api/stock";
import {
  putInStorageRecord,
  putInStorageRecordAdd,
  productProcessDetail,
  detectProductProcesses,
  getProductLineByProcess,
} from "@/app/api/putin";

import { getProduct } from "../../api/product";
import {
  getProcess,
  getStorage,
  getProductionLine,
  findProduct,
} from "@/app/api/common";

import AsyncStorage from "@react-native-async-storage/async-storage";

// 类型定义
interface ProcessAndProductLine {
  processCode: string;
  productLineCode: string;
  fixed?: boolean;
}

export default function AddProductIn() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [showOptions, setShowOptions] = useState(false);
  const [productionLineOptions, setProductionLineOptions] = useState([]);
  const [processOptions, setProcessOptions] = useState([]);

  // 已有产品信息
  const [productInfo, setProductInfo] = useState({
    tag: params.tag,
    id: params.id,
    productCode: params.productCode,
    productName: params.productName,
    color: params.color,
    size: params.size,
    needleType: params.needleType,
    orderId: "",
    planQuantity: 0,
  });

  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const qrCodeViewRef = useRef<View>(null);

  // 库存信息
  const [stockInfo, setStockInfo] = useState([]);

  const [showDetails, setShowDetails] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("");
  const [scanDesc, setScanDesc] = useState("");
  const [scanSubTitle, setScanSubTitle] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [qrCodeBase64, setQrCodeBase64] = useState("");

  const [printAvaliable, setPrintAvaliable] = useState(false);

  const [formData, setFormData] = useState({
    storageCode: "",
    productId: -1,
    putInboundQuantity: "",
    productLineCode: "zs",
    photoPath: "",
    putInThreshold: "",
    processAndProductLineList: [] as ProcessAndProductLine[],
  });

  const [images, setImages] = useState([
    require("../../../assets/images/logo.png"),
    require("../../../assets/images/logo.png"),
  ]);

  // 新增：工序产线编辑相关状态
  const [showProcessLineDialog, setShowProcessLineDialog] = useState(false);
  const [editingProcessLine, setEditingProcessLine] =
    useState<ProcessAndProductLine>({
      processCode: "",
      productLineCode: "",
    });
  const [editingIndex, setEditingIndex] = useState(-1);

  const handleScanSuccess = (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      console.log(data);
      if (data.tag == "storageQRCode") {
        setFormData((prev) => ({
          ...prev,
          storageCode: data.id,
        }));
      } else {
        Alert.alert("错误", "请扫描库位码");
      }
    } catch (error) {
      Alert.alert("错误", "请扫描库位码");
    }
  };

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

        return uri;
      }
    } catch (error) {
      console.error("保存二维码失败:", error);
      // Alert.alert("错误", "保存二维码失败");
      return null;
    }
  };
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const [waitForSubmit, setWaitForSubmit] = useState({});
  const loadPairedDevices = async () => {
    try {
      const mac = await AsyncStorage.getItem("mac");

      console.log("当前绑定mac地址为；", mac);

      const pairedDevices = await BluetoothService.getPairedDevices();

      if (
        pairedDevices.length > 0 &&
        pairedDevices.find((d) => d.address == mac)
      ) {
        const mac = await AsyncStorage.getItem("mac");
        const res = await NativeTestModule.connectPrinter(mac);
        //@ts-ignore
        if (res == 0) {
          setScanDesc("已连接至打印机");
          setScanSubTitle("确认信息后，开始打印");
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

  const detectOldProduct = async () => {
    const processArray = formData.processAndProductLineList.map(
      (item) => item.processCode
    );

    const data = {
      productProcessId: productInfo.id as string,
      //
      productCode: productInfo.productCode as string,
      productName: productInfo.productName as string,
      color: productInfo.color as string,
      size: productInfo.size as string,
      needleType: productInfo.needleType as string,
      //
      processArray: processArray,

      orderId: productInfo.orderId as string,
    };

    const res = await detectProductProcesses(data);
    //@ts-ignore
    if (res.code == 200) {
      return {
        isOld: res?.data?.productId ? true : false,
        productId: res?.data?.productId,
        currentStorage: res?.data?.currentStorage || "",
      };
    }

    return {
      isOld: false,
      productId: null,
    };
  };

  const ensureSubmit = async () => {
    const { isOld, productId } = await detectOldProduct();

    const processAndProductLineList = formData.processAndProductLineList;

    if (isOld) {
      //增补入库
      const data = {
        productProcessId: productInfo.id,
        productId: productId,
        //
        putInboundQuantity: parseInt(formData.putInboundQuantity),
        storageCode: formData.storageCode,
        processAndProductLineList: processAndProductLineList,
        //
        photoPath: formData.photoPath,

        putInThreshold: 0,

        orderId: productInfo.orderId as string,
      };
      const res = await putInStorageRecordAdd(data);
      console.log("增补入库结果", res);
      //@ts-ignore
      Alert.alert("提示", res.message, [
        {
          text: "确定",
          onPress: () => {
            router.back();

            // 跳转到详情页，传递查询参数
            router.push({
              pathname: "/pages/productIn",
              params: {
                autoscan: "true",
              },
            });
          },
        },
      ]);
    } else {
      //新品入库
      const data = {
        productProcessId: productInfo.id,
        //
        productCode: productInfo.productCode as string,
        productName: productInfo.productName as string,
        color: productInfo.color as string,
        size: productInfo.size as string,
        needleType: productInfo.needleType as string,
        //
        putInboundQuantity: parseInt(formData.putInboundQuantity),
        storageCode: formData.storageCode,
        processAndProductLineList: processAndProductLineList,

        putInThreshold: 0,

        //
        photoPath: formData.photoPath,

        orderId: productInfo.orderId as string,
      };
      console.log("新品入库结果");

      const res = await putInStorageRecord(data);
      console.log("新品入库结果", res);
      //@ts-ignore
      Alert.alert("提示", res.message, [
        {
          text: "确定",
          onPress: () => {
            router.push({
              pathname: "/pages/productIn",
              params: {
                autoscan: "true",
              },
            });
          },
        },
      ]);
    }
  };

  const handleSubmit = async () => {
    // 验证必填字段
    const requiredFields = ["storageCode", "putInboundQuantity"];
    const emptyFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );

    if (emptyFields.length > 0) {
      Alert.alert("提示", "请填写所有必填字段");
      return;
    }

    if (formData.processAndProductLineList.length === 0) {
      Alert.alert("提示", "请至少添加一个工序产线配置");
      return;
    }

    ensureSubmit();
  };

  const handerPrintData = async (item?: BluetoothDevice) => {
    const base64 = await saveQRCodeAsBase64();

    if (!base64) {
      Alert.alert("错误", "保存二维码失败");
    }
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
      const res = await putInStorageRecordAdd({
        ...formData,
        putInboundQuantity: Number(formData.putInboundQuantity),
      });
      console.log("res", res);
      NativeTestModule.showToast("打印成功");
    } else {
      NativeTestModule.showToast("打印失败！");
    }
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const [scanModalVisible, setScanModalVisible] = useState(false);

  const [productId, setProductId] = useState(-1);

  const removeImage = () => {
    setSelectedImage(null);
    setFormData((prev) => ({
      ...prev,
      photoPath: "",
    }));
  };

  const takePhoto = async () => {
    const imagePath = await Service.takePhoto();
    setSelectedImage(imagePath);

    setFormData((prev) => ({
      ...prev,
      photoPath: imagePath, // 使用服务器返回的路径，如果没有则使用本地路径
    }));
  };

  const pickImage = async () => {
    const imagePath = await Service.pickImage();
    setSelectedImage(imagePath);

    setFormData((prev) => ({
      ...prev,
      photoPath: imagePath, // 使用服务器返回的路径，如果没有则使用本地路径
    }));
  };

  const addImage = () => {
    Alert.alert("添加照片", "选择照片来源", [
      { text: "相机", onPress: takePhoto },
      { text: "相册", onPress: pickImage },
      { text: "取消", style: "cancel" },
    ]);
  };

  const findProductId = async () => {
    const res = await getProduct({
      productCode: params.productCode as string,
      color: params.color as string,
      size: params.size as string,
      needleType: params.needleType as string,
      productName: params.productName as string,
      processCode: params.processCode as String,
      pageNumber: 1,
      pageSize: 100,
    });
    //@ts-ignore
    if (res.code == 200) {
      const id = res.data[0].id;
      setFormData((prev) => ({
        ...prev,
        productId: id,
      }));
    }
  };

  const findProductProcessDetail = async (id: number) => {
    const res = await productProcessDetail({
      productProcessId: id,
    });
    console.log("获取容器详情", res);
    //@ts-ignore
    if (res.code == 200) {
      setProductInfo((prev) => ({
        ...prev,
        productCode: res.data.productCode as string,
        color: res.data.color as string,
        size: res.data.size as string,
        needleType: res.data.needleType as string,
        productName: res.data.productName as string,
        orderId: res.data.orderId as string,
        planQuantity: res.data.currentQuantity,
      }));

      setFormData((prev) => ({
        ...prev,
        photoPath: res.data.photoPath,
      }));

      // getStock(res.data);

      const nextProcess = res.data.nextProcess;
      const nextProductLine = res.data.nextProductLine;
      if (nextProcess.trim() !== "") {
        const ddd = nextProcess.split(",").map((p) => {
          return {
            processCode: p,
            productLineCode: nextProductLine,
            fixed: true,
          };
        });
        setFormData((prev) => ({
          ...prev,
          processAndProductLineList: ddd,
        }));
      }
    }
  };

  const getStock = async (data: any) => {
    //查询商品的在库数量情况
    const res = await getStockListByProcess({
      productCode: data.productCode as string,
      productName: data.productName as string,
      color: data.color as string,
      size: data.size as string,
      needleType: data.needleType as string,
      pageNumber: 1,
      pageSize: 100,
      processArray: [],
      orderId: "",
    });

    //@ts-ignore
    if (res.code == 200) {
      const data = res.data[0].processInventoryDetail;
      console.log("getStockListByProcess", data);

      setStockInfo(data);
    }
  };

  const getAvaliableProductLine = async (processCode: string) => {
    const res = await getProductLineByProcess({
      pageNumber: 1,
      pageSize: 100,
      processArray: [processCode],
    });

    // console.log("getAvaliableProductLine", res);

    setProductionLineOptions(
      res.data.map((p: any) => {
        return {
          label: p.code,
          value: p.code,
          // id: p.id,
        };
      })
    );
  };

  const fetchData = async () => {
    try {
      const productionLine = await getProductionLine({
        pageNumber: 1,
        pageSize: 100,
      });

      setProductionLineOptions(
        productionLine.data.map((p: any) => {
          return {
            label: p.code,
            value: p.code,
            // id: p.id,
          };
        })
      );

      //工序列表
      const process = await getProcess({ pageNumber: 1, pageSize: 100 });
      setProcessOptions(
        process.data.map((p: any) => {
          return {
            label: p.name,
            value: p.code,
            // id: p.id,
          };
        })
      );

      setShowOptions(true);
    } catch (error) {
      setProductionLineOptions([] as any);

      setShowOptions(true);

      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (params.id) {
      findProductProcessDetail(Number(params.id));
    }
    fetchData();
  }, []);

  return (
    <AnimatedBackground
      source={require("../../../assets/images/background2.png")}
      duration={600}
    >
      <View style={styles.container}>
        <Text style={styles.title}>扫码入库</Text>

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
          {/* 产品信息展示区域 */}
          <View style={styles.productInfoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>容器ID:</Text>
              <Text style={styles.infoValue}>{productInfo.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>订单号:</Text>
              <Text style={styles.infoValue}>{productInfo.orderId}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>货号:</Text>
              <Text style={styles.infoValue}>{productInfo.productCode}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>品名:</Text>
              <Text style={styles.infoValue}>{productInfo.productName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>颜色:</Text>
              <Text style={styles.infoValue}>{productInfo.color}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>尺码:</Text>
              <Text style={styles.infoValue}>{productInfo.size}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>针型:</Text>
              <Text style={styles.infoValue}>{productInfo.needleType}</Text>
            </View>

            {/* <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>工序:</Text>
              <Text style={styles.infoValue}>{productInfo.processCode}</Text>
            </View> */}
          </View>

          {/* 库存表格 */}
          {/* <View style={styles.stockContainer}>
            <View style={styles.stockHeader}>
              <Text style={styles.stockHeaderText}>库位</Text>
              <Text style={styles.stockHeaderText}>库位库存数</Text>
            </View>
            {stockInfo.map(
              (item, index) =>
                index < 2 && (
                  <View key={index} style={styles.stockRow}>
                    <Text style={styles.stockCell}>{item.storageCode}</Text>
                    <Text style={styles.stockCell}>{item.stockQuantity}</Text>
                  </View>
                )
            )}
            {stockInfo.length > 2 && (
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => {
                  setShowDetails(true);
                }}
              >
                <Text style={styles.detailsButtonText}>查看详情</Text>
              </TouchableOpacity>
            )}
          </View> */}

          {/* 本次入库信息 */}
          <View style={styles.currentInputContainer}>
            {/* <Text style={styles.firstSectionTitle}>本次入库位:</Text>
            <TouchableOpacity style={styles.locationInput}>
              <Text style={styles.locationText}>
                {formData.storageCode || "扫码或输入"}
              </Text>
              <Text style={styles.scanIcon}>📷</Text>
            </TouchableOpacity> */}

            {/* 工序产线配置 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>工序产线配置:</Text>
              <View style={styles.processLineContainer}>
                {formData.processAndProductLineList.length > 0 ? (
                  formData.processAndProductLineList.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.processLineItem}
                      onPress={() => {
                        if (!item.fixed) {
                          setEditingProcessLine(item);
                          setEditingIndex(index);
                          setShowProcessLineDialog(true);
                          getAvaliableProductLine(item.processCode);
                        }
                      }}
                    >
                      <View style={styles.processLineTextContainer}>
                        <Text style={styles.processLineText}>
                          {item.processCode}
                        </Text>
                        <Text style={styles.processLineText}>
                          {item.productLineCode}
                        </Text>
                      </View>
                      {!item.fixed && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => {
                            const newList =
                              formData.processAndProductLineList.filter(
                                (_, i) => i !== index
                              );
                            setFormData((prev) => ({
                              ...prev,
                              processAndProductLineList: newList,
                            }));
                          }}
                        >
                          <Text style={styles.deleteButtonText}>×</Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>暂无配置</Text>
                )}

                {/* <TouchableOpacity
                  style={styles.addProcessLineButton}
                  onPress={() => {
                    setEditingProcessLine({
                      processCode: "",
                      productLineCode: "",
                    });
                    setEditingIndex(-1);
                    setShowProcessLineDialog(true);
                    setProductionLineOptions([]);
                  }}
                >
                  <Text style={styles.addProcessLineText}>+ 添加工序产线</Text>
                </TouchableOpacity> */}
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>库位:</Text>
              {/* <TextInput
                style={styles.input}
                value={formData.storageCode}
                onChangeText={(value) =>
                  handleInputChange("storageCode", value)
                }
                placeholder="输入"
                placeholderTextColor="#999"
              /> */}

              <StorageLocationPicker
                value={formData.storageCode}
                onValueChange={(value) =>
                  handleInputChange("storageCode", value)
                }
                placeholder="选择库位"
                style={styles.storageLocationPicker}
              />
              <TouchableOpacity
                style={styles.locationScan}
                onPress={() => {
                  setScanModalVisible(true);
                }}
              >
                <Text style={styles.scanIcon}>📷</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                本次入库数(计划{productInfo.planQuantity}):
              </Text>
              <TextInput
                style={styles.input}
                value={formData.putInboundQuantity}
                onChangeText={(value) =>
                  handleInputChange("putInboundQuantity", value)
                }
                placeholder="输入"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            {/* <View style={styles.fieldContainer}>
              <Text style={styles.sectionTitle}>入库阈值:</Text>
              <TextInput
                style={styles.input}
                value={formData.putInThreshold}
                onChangeText={(value) =>
                  handleInputChange("putInThreshold", value)
                }
                placeholder="输入"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View> */}

            {/* <View style={styles.fieldContainer}>
              <Text style={styles.sectionTitle}>产线:</Text>
              <TextInput
                style={styles.input}
                value={formData.productLineCode}
                onChangeText={(value) =>
                  handleInputChange("productLineCode", value)
                }
                placeholder="输入"
                placeholderTextColor="#999"
              />
            </View> */}

            {/* 照片 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.sectionTitle}>照片:</Text>
              <View style={styles.imageContainer}>
                <View style={styles.imageWrapper}>
                  <TouchableOpacity
                    onPress={() => {
                      if (formData.photoPath) {
                        setShowImagePreview(true);
                      }
                    }}
                  >
                    <Image
                      source={{ uri: formData.photoPath }}
                      style={styles.productImage}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.btnWrap, { backgroundColor: "#2563eb" }]}
            onPress={handleSubmit}
          >
            <View style={[styles.backBtn]}>
              <Text style={[styles.backBtnText, { color: "#fff" }]}>
                数据提交
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnWrap, { backgroundColor: "#dbdbdb" }]}
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
                  <QRCode
                    value={qrCodeData}
                    size={200}
                    backgroundColor="white"
                    color="black"
                    quietZone={10}
                  />
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

        {/* 库存详情列表 */}
        <Modal
          visible={showDetails}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowDetails(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer1}>
              <View style={styles.modalContainer1_List}>
                <ScrollView
                  style={styles.scrollContainer1}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.stockContainer1}>
                    <View style={styles.stockHeader}>
                      <Text style={styles.stockHeaderText}>库位</Text>
                      <Text style={styles.stockHeaderText}>库位库存数</Text>
                    </View>
                    {stockInfo.map((item, index) => (
                      <View key={index} style={styles.stockRow}>
                        <Text style={styles.stockCell}>{item.storageCode}</Text>
                        <Text style={styles.stockCell}>
                          {item.stockQuantity}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowDetails(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>确认</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 工序产线编辑对话框 */}
        <Modal
          visible={showProcessLineDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowProcessLineDialog(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[styles.modalContainer, styles.processLineModalContainer]}
            >
              <Text style={styles.modalTitle}>
                {editingIndex === -1 ? "添加工序产线" : "编辑工序产线"}
              </Text>

              <View style={styles.dialogFieldContainer}>
                <Text style={styles.dialogLabel}>工序:</Text>
                {showOptions && (
                  <Dropdown
                    style={styles.dialogDropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    containerStyle={styles.dropdownContainer}
                    itemTextStyle={styles.itemTextStyle}
                    itemContainerStyle={styles.itemContainerStyle}
                    data={processOptions}
                    maxHeight={200}
                    labelField="label"
                    valueField="value"
                    placeholder="请选择工序"
                    value={editingProcessLine.processCode}
                    onChange={(item) => {
                      getAvaliableProductLine(item.value);
                      setEditingProcessLine((prev) => ({
                        ...prev,
                        processCode: item.value,
                      }));
                    }}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>

              <View style={styles.dialogFieldContainer}>
                <Text style={styles.dialogLabel}>产线:</Text>
                {showOptions && (
                  <Dropdown
                    style={styles.dialogDropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    containerStyle={styles.dropdownContainer}
                    itemTextStyle={styles.itemTextStyle}
                    itemContainerStyle={styles.itemContainerStyle}
                    data={productionLineOptions}
                    maxHeight={200}
                    labelField="label"
                    valueField="value"
                    placeholder="请选择产线"
                    value={editingProcessLine.productLineCode}
                    onChange={(item) =>
                      setEditingProcessLine((prev) => ({
                        ...prev,
                        productLineCode: item.value,
                      }))
                    }
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>

              <View
                style={[
                  styles.modalButtonContainer,
                  styles.dialogButtonContainer,
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.sureButton,
                    (!editingProcessLine.processCode ||
                      !editingProcessLine.productLineCode) &&
                      styles.disabledButton,
                  ]}
                  disabled={
                    !editingProcessLine.processCode ||
                    !editingProcessLine.productLineCode
                  }
                  onPress={() => {
                    let newList = [...formData.processAndProductLineList];
                    if (editingIndex === -1) {
                      // 添加新项
                      newList.push(editingProcessLine);
                    } else {
                      // 编辑现有项
                      newList[editingIndex] = editingProcessLine;
                    }

                    setFormData((prev) => ({
                      ...prev,
                      processAndProductLineList: newList,
                    }));

                    setShowProcessLineDialog(false);
                  }}
                >
                  <Text
                    style={[
                      styles.sureButtonText,
                      (!editingProcessLine.processCode ||
                        !editingProcessLine.productLineCode) &&
                        styles.disabledButtonText,
                    ]}
                  >
                    确认
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowProcessLineDialog(false)}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 扫描模态框 */}
        <ScanModal
          visible={scanModalVisible}
          onClose={() => setScanModalVisible(false)}
          onScanSuccess={handleScanSuccess}
          title="扫描库位二维码"
        />

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
                  source={{ uri: formData.photoPath }}
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
    alignItems: "center",
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
    // paddingHorizontal: PX.n20,
    borderBlockColor: "#f5f5f5",
    width: "90%",
    borderRadius: PX.n15,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    marginBottom: PX.n20,
  },
  scrollContainer1: {
    flex: 1,
    // paddingHorizontal: PX.n20,
    borderBlockColor: "#f5f5f5",
    width: "90%",
    // borderRadius: PX.n15,
    // backgroundColor: "rgba(255, 255, 255, 0.95)",
    // marginBottom: 20,
    // maxHeight: 300,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: PX.n20,
    padding: PX.n0,
    marginTop: PX.n20,
    marginBottom: PX.n20,
  },
  productInfoContainer: {
    backgroundColor: "#fff",
    borderRadius: PX.n15,
    padding: PX.n15,
    // marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: PX.n8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#333",
  },
  infoValue: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
  },
  stockContainer: {
    backgroundColor: "#fff",
    borderRadius: PX.n15,
    padding: PX.n15,
    marginBottom: 20,
  },
  modalContainer1: {
    backgroundColor: "#fff",
    borderRadius: PX.n20,
    paddingVertical: PX.n20,
    alignItems: "center",
    // minWidth: 300,
    width: "90%",
    height: 500,
    maxHeight: 300,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: "hidden",
    // elevation: 5,
  },
  modalContainer1_List: {
    backgroundColor: "#fff",

    alignItems: "center",
    width: "100%",
    height: "80%",
    // maxHeight: 300,
  },
  stockContainer1: {
    backgroundColor: "#fff",
    borderRadius: PX.n15,
    // padding: PX.n15,
    // marginBottom: 20,
    width: "100%",
  },
  locationScan: {
    position: "absolute",
    right: 10,
    bottom: 10,
    // backgroundColor: "#f5f5f5",
    borderRadius: PX.n12,
    paddingHorizontal: PX.n8,
    // paddingVertical: PX.n6,
    justifyContent: "center",
    alignItems: "center",
  },
  storageLocationPicker: {
    flex: 1,
    marginRight: 50, // 为扫描按钮留出空间
  },
  stockHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n15,
    borderRadius: PX.n8,
    marginBottom: PX.n10,
  },
  stockHeaderText: {
    flex: 1,
    fontSize: PX.h16,
    fontFamily: "SongTi",

    color: "#333",
    textAlign: "center",
  },
  stockRow: {
    flexDirection: "row",
    paddingVertical: PX.n10,
    paddingHorizontal: PX.n15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  stockCell: {
    flex: 1,
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
  },
  detailsButton: {
    alignItems: "center",
    paddingVertical: PX.n10,
    marginTop: PX.n10,
  },
  detailsButtonText: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#2563eb",
  },
  mutilSelect: {
    display: "flex",
    justifyContent: "flex-start",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: PX.n8,
  },
  labelOption: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: PX.n12,
    paddingVertical: PX.n6,
    borderRadius: PX.n6,
    fontSize: PX.h14,
    color: "#333",
    fontFamily: "SongTi",
  },

  // 工序产线相关样式
  processLineContainer: {
    flex: 1,
    minHeight: PX.n40,
  },
  processLineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: PX.n8,
    paddingHorizontal: PX.n12,
    paddingVertical: PX.n8,

    marginBottom: PX.n8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  processLineTextContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  processLineText: {
    fontSize: PX.h18,
    color: "#333",
    fontFamily: "SongTi",
    fontWeight: "500",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    borderRadius: PX.n12,
    width: PX.n24,
    height: PX.n24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: PX.n8,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: PX.h16,
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: PX.h16,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
    marginVertical: PX.n16,
    fontFamily: "SongTi",
  },
  addProcessLineButton: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n8,
    padding: PX.n12,
    alignItems: "center",
    marginTop: PX.n8,
  },
  addProcessLineText: {
    color: "#fff",
    fontSize: PX.h16,
    fontWeight: "bold",
    fontFamily: "SongTi",
  },

  // 对话框样式
  dialogFieldContainer: {
    width: "100%",
    marginBottom: PX.n20,
    minWidth: 250,
  },
  dialogLabel: {
    fontSize: PX.h18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: PX.n12,
    fontFamily: "SongTi",
  },
  dialogDropdown: {
    height: PX.n50,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: PX.n8,
    paddingHorizontal: PX.n16,
    backgroundColor: "#fff",
    width: "100%",
    minWidth: 250,
  },
  processLineModalContainer: {
    minWidth: 320,
    maxWidth: "90%",
    width: "auto",
    paddingHorizontal: PX.n24,
  },
  dialogButtonContainer: {
    width: "100%",
    paddingHorizontal: PX.n16,
  },

  currentInputContainer: {
    backgroundColor: "#fff",
    borderRadius: PX.n15,
    paddingHorizontal: PX.n15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: PX.h18,
    fontFamily: "SongTi",

    color: "#333",
    marginBottom: PX.n10,
    marginTop: 10,
  },
  firstSectionTitle: {
    fontSize: PX.h18,
    fontFamily: "SongTi",

    color: "#333",
    marginBottom: 10,
    marginTop: PX.n0,
  },
  fieldContainer: {
    marginBottom: PX.n8,
  },
  label: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#333",
    marginBottom: PX.n4,
  },
  inputContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n12,
    paddingHorizontal: PX.n15,
    paddingVertical: PX.n12,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n12,
    paddingHorizontal: PX.n15,
    paddingVertical: PX.n8,
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
  },
  codeText: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#333",
  },
  locationInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n12,
    paddingHorizontal: PX.n15,
    paddingVertical: PX.n12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationText: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#999",
  },
  scanIcon: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  imageWrapper: {
    position: "relative",
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: PX.n12,
    backgroundColor: "#f0f0f0",
  },
  removeButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff4444",
    borderRadius: PX.n12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  removeText: {
    color: "#fff",
    fontSize: PX.h16,
    fontFamily: "SongTi",
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: PX.n12,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ddd",
    borderStyle: "dashed",
  },
  addImageText: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    color: "#999",
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: PX.n20,
    paddingVertical: PX.n20,
    paddingBottom: PX.n50 + 8,
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  btnWrap: {
    flex: 1,
    borderRadius: PX.n30,
    // elevation: 10,
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: PX.pv8,
    paddingHorizontal: PX.n8,
  },

  backBtn: {
    alignItems: "center",
    justifyContent: "center",
  },

  backBtnText: {
    color: "#555",
    fontSize: PX.h24,
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
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  sureButton: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n8 * 10,
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n24,
    // marginRight: PX.n12,
    alignItems: "center",
    flex: 1,
  },
  sureButtonText: {
    color: "#fff",
    fontSize: PX.h16,
    fontWeight: "bold",
    fontFamily: "SongTi",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  disabledButtonText: {
    color: "#999",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n8 * 10,
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n24,
    alignItems: "center",
    flex: 1,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: PX.h18,

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
  qrCodeContainer: {
    backgroundColor: "white",
    padding: PX.n16,
    borderRadius: PX.n8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdown: {
    // height: PX.n40,
    // paddingVertical: PX.n12,
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n8,
    paddingHorizontal: PX.n8,
    borderWidth: 0,
  },
  placeholderStyle: {
    fontSize: PX.h16,
    color: "#999",
    fontFamily: "SongTi",
    paddingVertical: PX.n12,
  },
  selectedTextStyle: {
    fontSize: PX.h16,
    color: "#333",
    fontFamily: "SongTi",
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: PX.n12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    marginTop: PX.n5,
  },
  itemTextStyle: {
    fontSize: PX.h18,
    color: "#333",
    fontFamily: "SongTi",
    marginVertical: -PX.n12,
  },
  itemContainerStyle: {
    paddingHorizontal: PX.n10,
    paddingVertical: PX.n0,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
});
