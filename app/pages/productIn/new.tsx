import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Animated,
  Platform,
  FlatList,
  TouchableHighlight,
  Pressable,
  PermissionsAndroid,
  ScrollView,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { captureRef } from "react-native-view-shot";
// import { Peripheral } from "react-native-ble-manager";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import AnimatedBackground from "../../components/AnimatedBackground";
import { Dropdown } from "react-native-element-dropdown";
import NativeTestModule, { DeviceInfo } from "./NativeTestModule";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ScanModal from "../../components/ScanModal";
import QRCode from "react-native-qrcode-svg";
import StorageLocationPicker from "../../components/StorageLocationPicker";
import PackagePreview from "../../components/PackagePreview";

// import ble from "./ble";
import {
  getProcess,
  getStorage,
  getProductionLine,
  getNeedle,
  getSize,
} from "@/app/api/common";
import { getProduct } from "@/app/api/product";
import {
  putInStorageRecord,
  putInStorageRecordAdd,
  detectProductProcesses,
  getProductLineByProcess,
} from "@/app/api/putin";

import {
  getRuleList,
  getOrderNumberRule,
  generateOrderId,
} from "@/app/api/orderRule";

import Service from "./service";
import { BluetoothDevice } from "react-native-bluetooth-classic";
import BluetoothService from "../../utils/BluetoothService";
//@ts-ignore
// import { useBleService } from "@/hooks/useBleService";
import ToastManager, { Toast } from "expo-react-native-toastify";

import * as PX from "@/app/pages/config";

declare module "react-native-ble-manager" {
  // enrich local contract with custom state properties needed by App.tsx
  interface Peripheral {
    connected?: boolean;
    connecting?: boolean;
  }
}

// 类型定义
interface ProcessAndProductLine {
  processCode: string;
  productLineCode: string;
}

const width = 70 * 5 * PX.scale;
const height = 40 * 5 * PX.scale;
const qrSectionWidth = (width * 3) / 7;
const infoSectionWidth = (width * 4) / 7;
const qrSize = Math.min(qrSectionWidth * 0.8, height * 0.8);

export default function NewProductIn() {
  const router = useRouter();
  const [processOptions, setProcessOptions] = useState([]);
  const [productionLineOptions, setProductionLineOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [needleOptions, setNeedleOptions] = useState([]);
  const [ruleOptions, setRuleOptions] = useState([]);

  const [currentRule, setCurrentRule] = useState("");

  const [userOrderId, setUserOrderId] = useState("");

  const [formData, setFormData] = useState({
    // productCode: "HUOHAO123",
    // color: "BAISE",
    // size: "35",
    // needleType: "ZX11",
    // productName: "PM11",
    // photoPath: "string",
    // processCode: "GX11",
    // putInboundQuantity: "210",
    // storageCode: "KW1",
    // productLineCode: "string1",
    productCode: "",
    color: "",
    size: "",
    needleType: "",
    productName: "",
    photoPath: "",
    putInboundQuantity: "",
    itemsInboundQuantity: "",
    storageCode: "",
    productLineCode: "",
    processCode: "",
    processAndProductLineList: [] as ProcessAndProductLine[],
    orderId: "",
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");

  const [devices, setDevices] = useState<BluetoothDevice[]>([]);

  const [pType, setPType] = useState("qrcode");
  const [scanDesc, setScanDesc] = useState("");
  const [scanSubTitle, setScanSubTitle] = useState("");

  const [printAvaliable, setPrintAvaliable] = useState(false);
  const [packageDetails, setPackageDetails] = useState<
    { packageIndex: number; quantity: number }[]
  >([]);

  // 添加ref用于截图
  const qrCodeViewRef = useRef<View>(null);
  const labelViewRef = useRef<View>(null);
  const [currentLabelId, setCurrentLabelId] = useState<number>(0);

  const [addPutinProductId, setAddPutinProductId] = useState("");
  const [showPutinAddDialog, setShowPutinAddDialog] = useState(false);
  const [processSelected, setProcessSelected] = useState([""]);

  // 新增：工序产线编辑相关状态
  const [showProcessLineDialog, setShowProcessLineDialog] = useState(false);
  const [editingProcessLine, setEditingProcessLine] =
    useState<ProcessAndProductLine>({
      processCode: "",
      productLineCode: "",
    });
  const [editingIndex, setEditingIndex] = useState(-1);

  // 检查表单是否可以提交
  const isFormValid = () => {
    // 检查必填字段
    const requiredFields = [
      formData.productCode,
      formData.productName,
      formData.color,
      formData.size,
      formData.needleType,
      formData.storageCode,
      formData.putInboundQuantity,
      formData.itemsInboundQuantity,
      formData.photoPath,
    ];

    // 检查基本字段是否都已填写
    const basicFieldsValid = requiredFields.every(
      (field) => field && field.toString().trim() !== ""
    );

    // 检查工序产线配置
    const processLineValid = formData.processAndProductLineList.length > 0;

    const haszhizao = formData.processAndProductLineList.find(
      (p) => p.processCode == "织造"
    );

    const processes = formData.processAndProductLineList.map(
      (p) => p.processCode
    );

    const repeat =
      processes.length > 0 &&
      processes.length !== [...new Set(processes)].length;

    // 检查订单规则
    const orderRuleValid =
      currentRule.trim() !== "" &&
      (currentRule === "无" || userOrderId.trim() !== "");

    // 检查每容器载量是否大于0
    const quantityValid = Number(formData.itemsInboundQuantity) > 0;

    return (
      basicFieldsValid &&
      processLineValid &&
      orderRuleValid &&
      quantityValid &&
      haszhizao &&
      !repeat
    );
  };

  const selectProcess = (code: string) => {
    console.log("select", code, processSelected);
    if (processSelected.includes(code)) {
      setProcessSelected(processSelected.filter((c) => c !== code));
    } else {
      setProcessSelected([...processSelected, code]);
    }
  };

  const handleInputChange = async (field: string, value: string) => {
    console.log("设置参数", field, value);
    // if (field == "productCode") {
    //   value = value.toUpperCase();
    // }
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // 移除了自动检测逻辑，因为现在不再使用单个processCode
  };

  const handleNativeToast = async (msg: string) => {
    try {
      await NativeTestModule.showToast(msg);
    } catch (error) {
      console.error("Error showing toast:", error);
      Alert.alert("错误", "显示Toast失败");
    }
  };

  const [dataSubmit, setDataSubmit] = useState({
    productCode: "HUOHAO123",
    color: "BAISE",
    size: "35",
    needleType: "ZX11",
    productName: "PM11",
    photoPath: "string",
    processCode: "GX11",
    putInboundQuantity: 210,
    storageCode: "KW1",
    productLineCode: "string1",
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

        return uri;
      }
    } catch (error) {
      console.error("保存二维码失败:", error);
      // Alert.alert("错误", "保存二维码失败");
      return null;
    }
  };

  const detectOldProduct = async () => {
    const processArray = formData.processAndProductLineList.map(
      (item) => item.processCode
    );

    const data = {
      productProcessId: null,
      //
      productCode: formData.productCode,
      productName: formData.productName,
      color: formData.color,
      size: formData.size,
      needleType: formData.needleType,
      //
      processArray: processArray,

      orderId: currentRule + userOrderId,
    };

    console.log("detectOldProduct入参数", data);
    const res = await detectProductProcesses(data);
    //@ts-ignore
    if (res.code == 200) {
      console.log("detectOldProduct返回", res);
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

  const handleSubmit = async () => {
    // 如果表单无效，显示具体的错误信息
    if (!isFormValid()) {
      const missingFields = [];

      if (!formData.productCode?.trim()) missingFields.push("货号");
      if (!formData.productName?.trim()) missingFields.push("品名");
      if (!formData.color?.trim()) missingFields.push("颜色");
      if (!formData.size?.trim()) missingFields.push("尺码");
      if (!formData.needleType?.trim()) missingFields.push("针型");
      if (!formData.storageCode?.trim()) missingFields.push("库位");
      if (!formData.putInboundQuantity?.trim())
        missingFields.push("入库总数量");
      if (!formData.itemsInboundQuantity?.trim())
        missingFields.push("每容器载量");
      if (formData.processAndProductLineList.length === 0)
        missingFields.push("工序产线配置");
      if (currentRule.trim() === "") missingFields.push("订单规则");
      if (currentRule !== "无" && userOrderId.trim() === "")
        missingFields.push("订单号");
      if (Number(formData.itemsInboundQuantity) <= 0)
        missingFields.push("每容器载量必须大于0");

      Alert.alert("提示", `请完善以下信息：\n${missingFields.join("、")}`);
      return;
    }

    // 验证必填字段
    const requiredFields = [
      "productCode",
      "productName",
      "color",
      "size",
      "needleType",
      "storageCode",
      "putInboundQuantity",
    ];
    const emptyFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );
    console.log("emptyFields", emptyFields);
    if (emptyFields.length > 0) {
      Alert.alert("提示", "请填写所有必填字段");
      return;
    }

    const processes = formData.processAndProductLineList.map(
      (pl) => pl.processCode
    );

    if (processes.length === 0) {
      Alert.alert("提示", "请至少添加一个工序产线配置");
      return;
    }

    if (!processes.includes("织造")) {
      Alert.alert("提示", "新容器入库，必须填写所有已完成工序");
      return;
    }

    if (formData.processAndProductLineList.length === 0) {
      Alert.alert("提示", "请至少添加一个工序产线配置");
      return;
    }

    if (
      !formData.itemsInboundQuantity ||
      Number(formData.itemsInboundQuantity) <= 0
    ) {
      Alert.alert("提示", "请填写每容器载量");
      return;
    }

    if (currentRule.trim() == "") {
      Alert.alert("提示", "请选择订单规则");
      return;
    } else {
      if (currentRule !== "无" && userOrderId.trim() == "") {
        Alert.alert("提示", "请输入订单号");
        return;
      }
    }

    setConfirmDialogVisible(true);
  };

  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);

  const confirmDialog = async () => {
    setConfirmDialogVisible(false);
    setScanDesc("正在搜索指定打印机");
    setScanSubTitle("");
    setPrintAvaliable(false);
    setShowSuccessModal(true);
    // await putInAndGetPackageId();
    showPackageDetails();
    await loadPairedDevices();
  };

  const loadPairedDevices = async () => {
    try {
      const mac = await AsyncStorage.getItem("mac");

      console.log("当前绑定mac地址为；", mac);

      const pairedDevices = await BluetoothService.getPairedDevices();
      setIsScanning(false);
      setDevices(pairedDevices);

      if (
        pairedDevices.length > 0 &&
        pairedDevices.find((d) => d.address == mac)
      ) {
        const mac = await AsyncStorage.getItem("mac");
        const res = await NativeTestModule.connectPrinter(mac);
        //@ts-ignore
        if (res == 0) {
          // await putInAndGetPackageId();
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

  const removeImage = () => {
    setSelectedImage(null);
    setFormData((prev) => ({
      ...prev,
      photoPath: "",
    }));
  };

  const showPackageDetails = () => {
    const sum = Number(formData.putInboundQuantity);
    const count = Number(formData.itemsInboundQuantity);

    if (count <= 0) {
      setPackageDetails([]);
      return;
    }

    const items = Math.floor(sum / count);
    const final = sum % count;
    const arr = [];

    // 添加完整容器
    for (var i = 0; i < items; i++) {
      arr.push({
        packageIndex: i + 1,
        quantity: count,
      });
    }

    // 添加剩余容器（如果有）
    if (final > 0) {
      arr.push({
        packageIndex: items + 1,
        quantity: final,
      });
    }

    setPackageDetails(arr);
  };

  const ensureSubmitItem = async (count: number) => {
    const { isOld, productId, currentStorage } = await detectOldProduct();
    console.log("单个入库:", isOld ? "增补入库" : "新品入库");
    if (isOld) {
      //增补入库
      const data = {
        productProcessId: null,
        productId: productId,
        putInboundQuantity: count,
        storageCode: formData.storageCode,
        processAndProductLineList: formData.processAndProductLineList,
        photoPath: formData.photoPath,

        orderId: currentRule + userOrderId,
      };
      const res = await putInStorageRecordAdd(data);

      console.log("增补入库结果", res);
      //@ts-ignore
      if (res.code !== 200) {
        //@ts-ignore
        await NativeTestModule.showToast(res.message);
        return null;
      }
      return res.data.id;
    } else {
      // console.log("新品入库");

      //新品入库
      const data = {
        productProcessId: null,
        //
        productCode: formData.productCode,
        color: formData.color,
        size: formData.size,
        needleType: formData.needleType,
        productName: formData.productName,
        //
        // putInboundQuantity: formData.value.putInboundQuantity,
        putInboundQuantity: count,

        storageCode: formData.storageCode,
        processAndProductLineList: formData.processAndProductLineList,
        //
        photoPath: formData.photoPath,

        orderId: currentRule + userOrderId,
      };
      const res = await putInStorageRecord(data);

      console.log(" 新品入库结果", res);

      //@ts-ignore
      if (res.code !== 200) {
        //@ts-ignore
        await NativeTestModule.showToast(res.message);
        return null;
      }
      return res.data.id;
    }
  };

  const sleep = async (time) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("wait" + time);
        resolve(true);
      }, time);
    });
  };

  const handerPrintData2 = async () => {
    for (var i = 0; i < packageDetails.length; i++) {
      const currentCount = packageDetails[i].quantity;
      console.log("开始入库", i);
      const newId = await ensureSubmitItem(currentCount);
      await sleep(500);
      if (newId) {
        console.log("单个入库成功，分配容器id", newId);
        const base64 = await buildBase64(newId);
        console.log(base64);
        await printCode(base64);
      }
    }
    setShowSuccessModal(false);
    Alert.alert("提示", "入库成功");

    // 清除表单所有数据
    setFormData({
      productCode: "",
      color: "",
      size: "",
      needleType: "",
      productName: "",
      photoPath: "",
      putInboundQuantity: "",
      itemsInboundQuantity: "",
      storageCode: "",
      productLineCode: "",
      processCode: "",
      processAndProductLineList: [],
      orderId: "",
    });
    setSelectedImage(null);
    setPackageDetails([]);
    setUserOrderId("");
    setCurrentRule("");
    setAddPutinProductId("");
    setProcessSelected([""]);
    setEditingProcessLine({
      processCode: "",
      productLineCode: "",
    });
    setEditingIndex(-1);
    setCurrentLabelId(0);
  };

  const buildBase64 = async (newId: number) => {
    console.log("新容器id", newId);

    // 设置当前标签ID，触发重新渲染
    setCurrentLabelId(newId);

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

  const printCode = async (base64: string) => {
    const mac = await AsyncStorage.getItem("mac");
    const res = await NativeTestModule.connectAndPrintQrCode(
      mac,
      "image",
      base64
    );
    if (res == "success") {
      return true;
    } else {
      return false;
    }
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
      const ret = await putInStorageRecord(dataSubmit);
      setShowSuccessModal(false);
      //@ts-ignore
      Alert.alert("提示", "打印成功");
      // await handleNativeToast("打印成功");
    } else {
      //@ts-ignore
      Alert.alert("提示", "打印失败！");
      // await handleNativeToast("打印失败！");
    }
  };

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
      //产线列表
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
      //针型列表
      const needles = await getNeedle({
        pageNumber: 1,
        pageSize: 100,
      });
      setNeedleOptions(
        needles.data.map((p: any) => {
          return {
            label: p.name,
            value: p.name,
            // id: p.id,
          };
        })
      );
      //尺码列表
      const sizes = await getSize({
        pageNumber: 1,
        pageSize: 100,
      });
      setSizeOptions(
        sizes.data.map((p: any) => {
          return {
            label: p.name,
            value: p.name,
            // id: p.id,
          };
        })
      );

      const rules = await getOrderNumberRule({
        pageNumber: 1,
        pageSize: 100,
      });

      // console.log("rules", rules);

      setRuleOptions(
        rules.data.map((p: any) => {
          return {
            label: p.prefix,
            value: p.prefix,
            id: p.id,
          };
        })
      );

      setShowOptions(true);
    } catch (error) {
      setProductionLineOptions([] as any);
      setProcessOptions([] as any);

      setShowOptions(true);

      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    setShowOptions(false);

    fetchData();
    // initializeBluetooth();

    return () => {
      console.debug("[app] main component unmounting. Removing listeners...");
      BluetoothService.stopDiscovery();
    };
  }, []);

  return (
    <AnimatedBackground
      source={require("../../../assets/images/background2.png")}
      duration={600}
    >
      <View style={styles.container}>
        <ToastManager />
        <Text style={styles.title}>新品入库</Text>

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
          {/* 订单号 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>订单号:</Text>
            {/* <TextInput
              style={styles.input}
              value={formData.orderId}
              onChangeText={(value) => handleInputChange("orderId", value)}
              placeholder="输入"
              placeholderTextColor="#999"
            /> */}

            <View style={styles.selectInput}>
              {showOptions && (
                <Dropdown
                  style={styles.dropdown40}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  containerStyle={
                    (styles.dropdownContainer, { paddingHorizontal: PX.n0 })
                  }
                  itemTextStyle={styles.itemTextStyle}
                  itemContainerStyle={
                    (styles.itemContainerStyle, { paddingHorizontal: PX.n0 })
                  }
                  data={ruleOptions}
                  maxHeight={200}
                  labelField="label"
                  valueField="value"
                  placeholder="订单前缀"
                  value={currentRule}
                  // onConfirmSelectItem={(item) => {
                  //   console.log("onConfirmSelectItem", item);
                  // }}
                  onChange={async (item) => {
                    setCurrentRule(item.value);
                    // const res = await generateOrderId({ ruleId: item.id });
                    // handleInputChange("orderId", res.data);
                    // console.log(res);
                  }}
                  showsVerticalScrollIndicator={false}
                />
              )}

              <TextInput
                style={styles.input60}
                value={userOrderId}
                onChangeText={(value) => {
                  setUserOrderId(value.toUpperCase().slice(0, 4));
                  // handleInputChange("orderId", value)
                }}
                placeholder="输入"
                placeholderTextColor="#999"
              />
            </View>

            {/* <Text style={(styles.label, { paddingLeft: 10 })}>
              {formData.orderId}
            </Text> */}

            {/* RuleOptions */}
          </View>

          {/* 货号 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>货号:</Text>
            <TextInput
              style={styles.input}
              value={formData.productCode}
              onChangeText={(value) => handleInputChange("productCode", value)}
              placeholder="输入"
              onBlur={() => {
                if (formData.productCode) {
                  // findProduct({id:formData.productCode})
                  setFormData((prev) => ({
                    ...prev,
                    productCode: formData.productCode.toUpperCase(),
                  }));
                }
              }}
              placeholderTextColor="#999"
            />
          </View>

          {/* 品名 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>品名:</Text>
            <TextInput
              style={styles.input}
              value={formData.productName}
              onChangeText={(value) => handleInputChange("productName", value)}
              placeholder="输入"
              placeholderTextColor="#999"
            />
          </View>

          {/* 颜色 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>颜色:</Text>
            <TextInput
              style={styles.input}
              value={formData.color}
              onChangeText={(value) => handleInputChange("color", value)}
              placeholder="输入"
              placeholderTextColor="#999"
            />
          </View>

          {/* 尺码 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>尺码:</Text>
            {/* <TextInput
              style={styles.input}
              value={formData.size}
              onChangeText={(value) => handleInputChange("size", value)}
              placeholder="输入"
              placeholderTextColor="#999"
            /> */}

            {showOptions && (
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                containerStyle={styles.dropdownContainer}
                itemTextStyle={styles.itemTextStyle}
                itemContainerStyle={styles.itemContainerStyle}
                data={sizeOptions}
                maxHeight={200}
                labelField="label"
                valueField="value"
                placeholder="请选择尺码"
                value={formData.size}
                onChange={(item) => handleInputChange("size", item.value)}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          {/* 针型 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>针型:</Text>
            {/* <TextInput
              style={styles.input}
              value={formData.needleType}
              onChangeText={(value) => handleInputChange("needleType", value)}
              placeholder="输入"
              placeholderTextColor="#999"
            /> */}

            {showOptions && (
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                containerStyle={styles.dropdownContainer}
                itemTextStyle={styles.itemTextStyle}
                itemContainerStyle={styles.itemContainerStyle}
                data={needleOptions}
                maxHeight={200}
                labelField="label"
                valueField="value"
                placeholder="请选择针型"
                value={formData.needleType}
                onChange={(item) => handleInputChange("needleType", item.value)}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          <View style={styles.divider}></View>

          {/* 工序产线列表 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>工序产线配置:</Text>
            <View style={styles.processLineContainer}>
              {formData.processAndProductLineList.length > 0 ? (
                formData.processAndProductLineList.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.processLineItem}
                    onPress={() => {
                      setEditingProcessLine(item);
                      setEditingIndex(index);
                      setShowProcessLineDialog(true);
                      getAvaliableProductLine(item.processCode);
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
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>暂无配置，点击下方按钮添加</Text>
              )}

              <TouchableOpacity
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
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider}></View>

          {/* 库位 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>库位:</Text>
            <View style={styles.storageInputContainer}>
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
          </View>

          {/* 数量 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>入库总数量:</Text>
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

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>每容器载量:</Text>
            <TextInput
              style={styles.input}
              value={formData.itemsInboundQuantity}
              onChangeText={(value) =>
                handleInputChange("itemsInboundQuantity", value)
              }
              placeholder="输入"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.divider}></View>

          {/* 照片 */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>照片:</Text>
            <View style={styles.imageContainer}>
              {selectedImage && (
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.productImage}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={removeImage}
                  >
                    <Text style={styles.removeText}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={addImage}
              >
                <Text style={styles.addImageText}>📷</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>

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
                  value={JSON.stringify({
                    tag: "packageQRCode",
                    id: currentLabelId,
                  })}
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
                  订单: {currentRule + userOrderId}
                </Text>
                <Text style={styles.packagePreviewInfoText}>
                  货号: {formData.productCode}
                </Text>
                <Text style={styles.packagePreviewInfoText}>
                  品名: {formData.productName}
                </Text>
                <Text style={styles.packagePreviewInfoText}>
                  颜色: {formData.color}
                </Text>
                <Text style={styles.packagePreviewInfoText}>
                  尺码: {formData.size}
                </Text>
                <Text style={styles.packagePreviewInfoText}>
                  针型: {formData.needleType}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.btnWrap,
              {
                backgroundColor: isFormValid() ? "#2563eb" : "#cccccc",
              },
            ]}
            onPress={handleSubmit}
            disabled={!isFormValid()}
          >
            <View style={[styles.backBtn]}>
              <Text
                style={[
                  styles.backBtnText,
                  {
                    color: isFormValid() ? "#fff" : "#999",
                  },
                ]}
              >
                数据递交
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
            <View style={[styles.modalContainer, styles.successModalContainer]}>
              <View style={styles.successIconContainer}>
                <Text style={styles.successIcon}>
                  {printAvaliable ? "🖨️" : "🔍"}
                </Text>
              </View>

              <Text style={styles.successModalTitle}>{scanDesc}</Text>
              {scanSubTitle && (
                <Text style={styles.successModalSubtitle}>{scanSubTitle}</Text>
              )}

              {/* 容器详情 */}
              {packageDetails.length > 0 && (
                <View style={styles.packageDetailsContainer}>
                  <Text style={styles.packageDetailsTitle}>容器详情：</Text>
                  <ScrollView
                    style={styles.packageScrollView}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.packageList}>
                      {packageDetails.map((pkg, index) => (
                        <View key={index} style={styles.packageItem}>
                          <Text style={styles.packageText}>
                            第{pkg.packageIndex}包: {pkg.quantity}件
                          </Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                  <Text style={styles.packageSummary}>
                    共{packageDetails.length}包，总计
                    {formData.putInboundQuantity}件
                  </Text>
                </View>
              )}

              {/* <View ref={qrCodeViewRef} style={styles.qrCodeContainer}>
              {qrCodeData && (
                <QRCode
                  value={qrCodeData}
                  size={200}
                  backgroundColor="white"
                  color="black"
                  quietZone={10}
                />
              )}
            </View> */}

              <View
                style={[
                  styles.modalButtonContainer,
                  styles.successButtonContainer,
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.successPrintButton,
                    !printAvaliable && styles.disabledButton,
                  ]}
                  disabled={!printAvaliable}
                  onPress={() => {
                    if (printAvaliable) {
                      handerPrintData2();
                    }
                    // handerPrintData2();
                  }}
                >
                  <Text
                    style={[
                      styles.successPrintButtonText,
                      !printAvaliable && styles.disabledButtonText,
                    ]}
                  >
                    打印
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.successCancelButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                  }}
                >
                  <Text style={styles.successCancelButtonText}>取消</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 确认 弹窗 */}
        <Modal
          visible={confirmDialogVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, styles.confirmModalContainer]}>
              <View style={styles.confirmIconContainer}>
                <Text style={styles.confirmIcon}>⚠️</Text>
              </View>

              <Text style={styles.confirmModalTitle}>确认提交</Text>
              <Text style={styles.confirmModalSubtitle}>
                请核对提交数据是否正确，确认后将开始入库流程
              </Text>

              <View
                style={[
                  styles.modalButtonContainer,
                  styles.confirmButtonContainer,
                ]}
              >
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={() => {
                    confirmDialog();
                  }}
                >
                  <Text style={styles.confirmButtonText}>确认</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmCancelButton}
                  onPress={() => {
                    setConfirmDialogVisible(false);
                  }}
                >
                  <Text style={styles.confirmCancelButtonText}>取消</Text>
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

        {/* 二维码弹窗 */}
        <Modal
          visible={showQRCodeModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowQRCodeModal(false)}
        >
          <View style={styles.qrModalOverlay}>
            <View style={styles.qrModalContainer}>
              <Text style={styles.qrModalTitle}>产品二维码</Text>

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

              <View style={styles.qrModalButtonContainer}>
                <TouchableOpacity
                  style={styles.qrSaveButton}
                  onPress={saveQRCodeAsBase64}
                >
                  <Text style={styles.qrSaveButtonText}>保存Base64</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.qrCloseButton}
                  onPress={() => setShowQRCodeModal(false)}
                >
                  <Text style={styles.qrCloseButtonText}>关闭</Text>
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

        {/* 跳转增补入库 弹窗 */}
        <Modal
          visible={showPutinAddDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>该商品已存在</Text>

              <Text style={styles.modalSubtitle}>即将跳转增补入库</Text>

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.printButton]}
                  onPress={() => {
                    setShowPutinAddDialog(false);
                    router.push({
                      pathname: "/pages/productIn/add",
                      params: {
                        productId: addPutinProductId,
                      },
                    });
                  }}
                >
                  <Text style={styles.printButtonText}>确认</Text>
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
    alignItems: "center",
    paddingTop: PX.n50,
  },
  title: {
    fontSize: PX.h26,
    fontFamily: "SongTi",
    color: "#222",
    textAlign: "center",
    marginBottom: PX.n16,
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
    borderRadius: PX.n8,

    backgroundColor: "rgba(255, 255, 255, 0.95)",
    // margin: 20,
    padding: PX.n16,
    marginBottom: PX.n16,
  },
  formContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    // borderRadius: PX.n20,
    padding: 0,
    marginTop: PX.n16,
    marginBottom: PX.n16,
  },
  fieldContainer: {
    marginBottom: PX.n4,
    position: "relative",
  },
  halfFieldContainer: {
    width: "50%",
    marginBottom: PX.n16,
  },
  label: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#333",
    // marginBottom: PX.n8,
  },
  mutilSelect: {
    display: "flex",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    flexDirection: "row",
    gap: 4,
  },
  labelOption: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#333",
    borderRadius: PX.n8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: PX.n8,
    borderWidth: 2,
    borderColor: "#dbdbdb",
  },
  inputContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n8,
    // paddingHorizontal: PX.n15,
    paddingVertical: PX.n12,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n8,
    paddingHorizontal: PX.n8,
    paddingVertical: PX.n4,
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
  },
  locationInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n8,
    paddingHorizontal: PX.n15,
    paddingVertical: PX.n12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  storageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  storageLocationPicker: {
    flex: 1,
    marginRight: 50, // 为扫描按钮留出空间
  },
  locationScan: {
    position: "absolute",
    right: 10,
    bottom: 10,
    // backgroundColor: "#f5f5f5",
    borderRadius: PX.n8,
    // paddingHorizontal: PX.n8,
    // paddingVertical: PX.n6,
    justifyContent: "center",
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
  dropdown: {
    // height: PX.n40,
    // paddingVertical: PX.n12,
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n8,
    paddingHorizontal: PX.n8,
    borderWidth: 0,
  },

  selectInput: {
    display: "flex",
    flexDirection: "row",
  },
  dropdown40: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n8,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    paddingHorizontal: PX.n8,
    borderWidth: 0,
    width: PX.n20 * 6,
  },
  input60: {
    //
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n8,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,

    paddingHorizontal: PX.n8,
    paddingVertical: PX.n4,
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
    flex: 1,
  },

  placeholderStyle: {
    fontSize: PX.h18,
    color: "#999",
    fontFamily: "SongTi",
    paddingVertical: PX.n4,
  },
  selectedTextStyle: {
    fontSize: PX.h18,
    color: "#333",
    fontFamily: "SongTi",
    paddingVertical: PX.n4,
  },
  dropdownContainer: {
    backgroundColor: "#fff",
    borderRadius: PX.n8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,

    // marginTop: 5,
  },
  itemTextStyle: {
    fontSize: PX.h18,
    color: "#333",
    fontFamily: "SongTi",
    marginVertical: -PX.n12,
  },
  itemContainerStyle: {
    paddingHorizontal: PX.n10,
    // paddingVertical: 0,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    width: "100%",
    marginBottom: PX.n10,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: PX.n16,
  },
  imageWrapper: {
    position: "relative",
  },
  productImage: {
    width: PX.n40 * 2,
    height: PX.n40 * 2,
    borderRadius: PX.n8,
    backgroundColor: "#f0f0f0",
  },
  removeButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#ff4444",
    borderRadius: PX.n12,
    width: PX.n24,
    height: PX.n24,
    justifyContent: "center",
    alignItems: "center",
  },
  removeText: {
    color: "#fff",
    fontSize: PX.h16,
    fontFamily: "SongTi",
  },
  addImageButton: {
    width: PX.n40 * 2,
    height: PX.n40 * 2,
    borderRadius: PX.n8,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: PX.n2,
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
    paddingVertical: PX.n12,
    paddingBottom: PX.n50 + 8,
    gap: PX.n10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    elevation: 5,
  },
  btnWrap: {
    flex: 1,
    borderRadius: PX.n30,
    // shadowColor: "#4F8EF7",
    // shadowOffset: {
    //   width: 0,
    //   height: 6,
    // },
    // shadowOpacity: 0.4,
    // shadowRadius: 8,
    // elevation: 10,
    borderColor: "rgba(255, 255, 255, 0.9)",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: PX.pv8,
    // paddingHorizontal: PX.n8,
  },
  btnWrapDisabled: {
    opacity: 0.6,
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
    paddingHorizontal: PX.n20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: PX.n16,
    paddingVertical: PX.n40,
    alignItems: "center",
    minWidth: PX.n50 * 6,
    height: "auto",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    alignSelf: "center",
    // elevation: 5,
  },
  modalTitle: {
    fontSize: PX.h22,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
    marginBottom: PX.n24,
  },
  modalSubtitle: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#666",
    textAlign: "center",
    marginBottom: PX.n24,
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
    // paddingHorizontal: PX.n30,
    paddingVertical: PX.n12,
  },
  printButtonText: {
    color: "#fff",
    fontSize: PX.h20,

    fontFamily: "SongTi",
    textAlign: "center",
  },

  sureButton: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n25,
    paddingHorizontal: PX.n20,
    paddingVertical: PX.n12,
    flex: 1,
  },
  sureButtonText: {
    color: "#fff",
    fontSize: PX.h20,
    fontFamily: "SongTi",
    textAlign: "center",
  },

  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n25,
    paddingHorizontal: PX.n20,
    paddingVertical: PX.n12,
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 1,
  },
  cancelButtonText: {
    color: "#666",
    fontSize: PX.h20,
    fontFamily: "SongTi",
    textAlign: "center",
  },

  // Loading 样式
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "#fff",
    borderRadius: PX.n20,
    padding: PX.n40,
    alignItems: "center",
    minWidth: PX.n50 * 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingSpinner: {
    alignItems: "center",
    marginBottom: 20,
  },
  spinner: {
    width: PX.n40,
    height: PX.n40,
    borderRadius: PX.n16,
    borderWidth: PX.n4,
    borderColor: "#f0f0f0",
    borderTopColor: "#2563eb",
  },
  loadingText: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
    marginBottom: PX.n8,
  },
  loadingSubText: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#666",
    textAlign: "center",
  },
  row: {
    marginHorizontal: PX.n8,
    borderRadius: PX.n20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  deviceInfo: {
    flex: 1,
  },

  // 二维码弹窗样式
  qrModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  qrModalContainer: {
    backgroundColor: "white",
    borderRadius: PX.n12,
    padding: PX.n24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: PX.n40 * 7,
  },
  qrModalTitle: {
    fontSize: PX.h22,
    fontWeight: "bold",
    marginBottom: PX.n20,
    color: "#333",
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
  qrModalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  qrSaveButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n20,
    borderRadius: PX.n8,
    alignItems: "center",
  },
  qrSaveButtonText: {
    color: "white",
    fontSize: PX.h20,
    fontWeight: "bold",
  },
  qrCloseButton: {
    flex: 1,
    backgroundColor: "#6b7280",
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n20,
    borderRadius: PX.n8,
    alignItems: "center",
  },
  qrCloseButtonText: {
    color: "white",
    fontSize: PX.h20,
    fontWeight: "bold",
  },
  device: {
    borderWidth: 1,
    borderColor: "#dbdbdb",
  },
  deviceActive: {
    backgroundColor: "#fff000",
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
    paddingVertical: PX.n4,

    marginBottom: PX.n4,
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
    fontSize: PX.h16,
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
    padding: PX.n8,
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
  processLineModalContainer: {
    // minWidth: PX.n50 * 7,
    maxWidth: "100%",
    width: "auto",
    alignItems: "center",
    // paddingHorizontal: PX.n24,
    // backgroundColor: "#f50000",
  },
  dialogFieldContainer: {
    // width: "100%",
    marginBottom: PX.n20,
    // minWidth: 250,
    // backgroundColor: "#f5f000",
  },
  dialogLabel: {
    fontSize: PX.h18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: PX.n12,
    fontFamily: "SongTi",
  },
  dialogDropdown: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n8,
    paddingHorizontal: PX.n8,
    borderWidth: 0,
    // height: PX.n32,
    borderColor: "#ddd",
    // borderWidth: 1,
    // borderRadius: PX.n8,
    // paddingHorizontal: PX.n16,
    // backgroundColor: "#fff",
    width: "100%",
    minWidth: PX.n50 * 5,
  },

  dialogButtonContainer: {
    width: "100%",
    paddingHorizontal: PX.n16,
    marginTop: PX.n16,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
    opacity: 0.6,
  },
  disabledButtonText: {
    color: "#999999",
  },

  // 确认弹窗样式
  confirmModalContainer: {
    paddingHorizontal: PX.n32,
    paddingVertical: PX.n32,
    minWidth: 300,
    maxWidth: "100%",
    alignItems: "center",
  },
  confirmIconContainer: {
    alignItems: "center",
    marginBottom: PX.n16,
  },
  confirmIcon: {
    fontSize: PX.h40,
  },
  confirmModalTitle: {
    fontSize: PX.h24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: PX.n12,
    fontFamily: "SongTi",
  },
  confirmModalSubtitle: {
    fontSize: PX.h16,
    color: "#666",
    textAlign: "center",
    lineHeight: PX.h24,
    marginBottom: PX.n24,
    fontFamily: "SongTi",
  },
  confirmButtonContainer: {
    width: "100%",
    gap: PX.n12,
  },
  confirmButton: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n30,
    borderColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n24,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: PX.h20,
    fontFamily: "SongTi",
    letterSpacing: 1,
    textAlign: "center",
  },
  confirmCancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: PX.n30,
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n24,
  },
  confirmCancelButtonText: {
    color: "#666",
    fontSize: PX.h18,
    fontWeight: "500",
    textAlign: "center",
    fontFamily: "SongTi",
  },

  // 成功弹窗样式
  successModalContainer: {
    paddingHorizontal: PX.n32,
    paddingVertical: PX.n32,
    minWidth: 320,
    maxWidth: "100%",
    alignItems: "center",
  },
  successIconContainer: {
    alignItems: "center",
    marginBottom: PX.n16,
  },
  successIcon: {
    fontSize: PX.h40,
  },
  successModalTitle: {
    fontSize: PX.h22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: PX.n12,
    fontFamily: "SongTi",
  },
  successModalSubtitle: {
    fontSize: PX.h16,
    color: "#666",
    textAlign: "center",
    lineHeight: PX.h24,
    marginBottom: PX.n20,
    fontFamily: "SongTi",
  },
  successButtonContainer: {
    width: "100%",
    gap: PX.n12,
    marginTop: PX.n20,
  },
  successPrintButton: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n30,
    borderColor: "rgba(255, 255, 255, 0.9)",
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n24,
  },
  successPrintButtonText: {
    color: "#fff",
    fontSize: PX.h20,
    fontFamily: "SongTi",
    letterSpacing: 1,
    textAlign: "center",
  },
  successCancelButton: {
    backgroundColor: "transparent",
    borderRadius: PX.n30,
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n24,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  successCancelButtonText: {
    color: "#666",
    fontSize: PX.h20,
    fontFamily: "SongTi",
    letterSpacing: 1,
    textAlign: "center",
  },

  // 容器详情样式
  packageDetailsContainer: {
    width: "100%",
    backgroundColor: "#f8f9fa",
    borderRadius: PX.n12,
    padding: PX.n16,
    marginVertical: PX.n16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  packageDetailsTitle: {
    fontSize: PX.h18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: PX.n12,
    fontFamily: "SongTi",
  },
  packageScrollView: {
    maxHeight: 200,
    marginBottom: PX.n12,
  },
  packageList: {
    paddingBottom: PX.n4,
  },
  packageItem: {
    backgroundColor: "#fff",
    borderRadius: PX.n8,
    padding: PX.n10,
    marginBottom: PX.n6,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  packageText: {
    fontSize: PX.h16,
    color: "#495057",
    fontFamily: "SongTi",
  },
  packageSummary: {
    fontSize: PX.h16,
    fontWeight: "600",
    color: "#2563eb",
    textAlign: "center",
    paddingTop: PX.n8,
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
    fontFamily: "SongTi",
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
  labelView: {
    backgroundColor: "white",
    // padding: PX.n16,
    borderRadius: PX.n8,
    alignItems: "center",
  },
});
