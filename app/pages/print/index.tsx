import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Dropdown } from "react-native-element-dropdown";

import { useRouter } from "expo-router";
import { BluetoothDevice } from "react-native-bluetooth-classic";
import AnimatedBackground from "../../components/AnimatedBackground";
import { getStockList, getStockOptions } from "../../api/stock";
import {
  getProcess,
  getStorage,
  getProductionLine,
  getNeedle,
  getSize,
} from "@/app/api/common";
import * as PX from "@/app/pages/config";

export default function Manual() {
  const router = useRouter();
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [connectedDevice, setConnectedDevice] =
    useState<BluetoothDevice | null>(null);

  const [formData, setFormData] = useState({
    orderId: "",
    productCode: "",
    color: "",
    size: "",
    needleType: "",
    productName: "",
    processId: "",
    storageId: "",
    productLineId: "",
    putInboundQuantity: "",
  });

  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [needleOptions, setNeedleOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [processOptions, setProcessOptions] = useState([]);
  const [productionLineOptions, setProductionLineOptions] = useState([]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "productCode") {
      fetchData();
    }
  };

  const fetchData = async () => {
    try {
      console.log("更新选项列表", formData.productCode);
      const res = await getStockOptions({
        productCode: formData.productCode,
      });

      console.log("res options", res);
      const data = res.data;

      setColorOptions(
        data?.color.map((c) => {
          return {
            label: c,
            value: c,
          };
        })
      );
      setSizeOptions(
        data?.size.map((c) => {
          return {
            label: c,
            value: c,
          };
        })
      );

      setNeedleOptions(
        data?.needleType.map((c) => {
          return {
            label: c,
            value: c,
          };
        })
      );

      setProductOptions(
        data?.productName.map((c) => {
          return {
            label: c,
            value: c,
          };
        })
      );

      console.log(res);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchData2 = async () => {
    try {
      console.log("fetchData-start");

      const process = await getProcess({ pageNumber: 1, pageSize: 100 });
      // const productionLine = await getProductionLine({
      //   pageNumber: 1,
      //   pageSize: 100,
      // });

      // console.log("fetchData", process.data);

      // const storage = await getStorage({ pageNumber: 1, pageSize: 100 });
      setProcessOptions(
        process.data.map((p: any) => {
          return {
            label: p.name,
            value: p.code,
            // id: p.id,
          };
        })
      );
      // setProductionLineOptions(
      //   productionLine.data.map((p: any) => {
      //     return {
      //       label: p.name,
      //       value: p.code,
      //       // id: p.id,
      //     };
      //   })
      // );

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
    } catch (error) {
      setProductionLineOptions([] as any);
      setProcessOptions([] as any);

      console.error("Error fetching data:", error);
    }
  };

  const handleSearch = () => {
    // 跳转到详情页，传递查询参数
    router.push({
      pathname: "/pages/print/searchList",
      params: {
        orderId: formData.orderId,

        productCode: formData.productCode,
        productName: formData.productName,

        color: formData.color,
        size: formData.size,
        needleType: formData.needleType,

        processId: formData.processId,
        // storageId: formData.storageId,
        // productLineId: formData.productLineId,
        // putInboundQuantity: formData.putInboundQuantity,
      },
    });
  };

  const handleReset = () => {
    setFormData({
      orderId: "",
      productCode: "",
      productName: "",

      color: "",
      size: "",
      needleType: "",
      processId: "",
      storageId: "",
      productLineId: "",
      putInboundQuantity: "",
    });
  };

  useEffect(() => {
    fetchData2();
    // fetchData();
  }, []);

  return (
    <AnimatedBackground
      source={require("../../../assets/images/background2.png")}
      duration={600}
    >
      <View style={styles.container}>
        <Text style={styles.title}>标签打印</Text>

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
          <View style={styles.formContainer}>
            {/* 货号 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>订单号:</Text>
              <TextInput
                style={styles.inputContainer}
                value={formData.orderId}
                onBlur={() => {
                  // fetchData();
                }}
                onChangeText={(value) => handleInputChange("orderId", value)}
                placeholder="输入订单号"
                placeholderTextColor="#999"
              />
            </View>

            {/* 货号 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>货号:</Text>
              <TextInput
                style={styles.inputContainer}
                value={formData.productCode}
                onBlur={() => {
                  // fetchData();
                }}
                onChangeText={(value) =>
                  handleInputChange("productCode", value)
                }
                placeholder="输入"
                placeholderTextColor="#999"
              />
            </View>
            {/* 品名下拉选择 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>品名:</Text>
              <TextInput
                style={styles.inputContainer}
                value={formData.productName}
                onChangeText={(value) =>
                  handleInputChange("productName", value)
                }
                placeholder="输入"
                placeholderTextColor="#999"
              />
            </View>

            {/* 颜色输入 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>颜色:</Text>
              <TextInput
                style={styles.inputContainer}
                value={formData.color}
                onChangeText={(value) => handleInputChange("color", value)}
                placeholder="输入"
                placeholderTextColor="#999"
              />
            </View>
            {/* 尺码下拉选择 */}
            {/* <View style={styles.fieldContainer}>
              <Text style={styles.label}>尺码:</Text>
              <TextInput
                style={styles.inputContainer}
                value={formData.size}
                onChangeText={(value) => handleInputChange("size", value)}
                placeholder="输入"
                placeholderTextColor="#999"
              />
            </View> */}
            {/* 针型下拉选择 */}
            {/* <View style={styles.fieldContainer}>
              <Text style={styles.label}>针型:</Text>
              <TextInput
                style={styles.inputContainer}
                value={formData.needleType}
                onChangeText={(value) => handleInputChange("needleType", value)}
                placeholder="输入"
                placeholderTextColor="#999"
              />
            </View> */}

            {/* 品名下拉选择 */}
            {/* <View style={styles.fieldContainer}>
              <Text style={styles.label}>品名:</Text>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                containerStyle={styles.dropdownContainer}
                itemTextStyle={styles.itemTextStyle}
                itemContainerStyle={styles.itemContainerStyle}
                data={productOptions}
                maxHeight={200}
                labelField="label"
                valueField="value"
                placeholder="请选择品名"
                value={formData.productName}
                onChange={(item) =>
                  handleInputChange("productName", item.value)
                }
                showsVerticalScrollIndicator={false}
              />
            </View> */}

            {/* 颜色下拉选择 */}
            {/* <View style={styles.fieldContainer}>
              <Text style={styles.label}>颜色:</Text>
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                containerStyle={styles.dropdownContainer}
                itemTextStyle={styles.itemTextStyle}
                itemContainerStyle={styles.itemContainerStyle}
                data={colorOptions}
                maxHeight={200}
                labelField="label"
                valueField="value"
                placeholder="请选择颜色"
                value={formData.color}
                onChange={(item) => handleInputChange("color", item.value)}
                showsVerticalScrollIndicator={false}
              />
            </View> */}
            {/* 尺码下拉选择 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>尺码:</Text>
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
            </View>
            {/* 针型下拉选择 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>针型:</Text>
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
            </View>

            {/* 工序下拉选择 */}
            {/* <View style={styles.fieldContainer}>
              <Text style={styles.label}>工序:</Text>
              <TextInput
                style={styles.inputContainer}
                value={formData.processId}
                onChangeText={(value) => handleInputChange("processId", value)}
                placeholder="输入"
                placeholderTextColor="#999"
              />
            </View> */}

            {/* 产线下拉选择 */}
            {/* <View style={styles.fieldContainer}>
              <Text style={styles.label}>产线:</Text>
              <TextInput
                style={styles.inputContainer}
                value={formData.productLineId}
                onChangeText={(value) =>
                  handleInputChange("productLineId", value)
                }
                placeholder="输入"
                placeholderTextColor="#999"
              />
            </View> */}

            {/* 工序 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>工序:</Text>
              <Dropdown
                style={styles.dropdown}
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
                value={formData.processId}
                onChange={(item) => handleInputChange("processId", item.value)}
                showsVerticalScrollIndicator={false}
              />
            </View>

            {/* 产线 */}
            {/* <View style={styles.fieldContainer}>
              <Text style={styles.label}>产线:</Text>
              <Dropdown
                style={styles.dropdown}
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
                value={formData.productLineId}
                onChange={(item) =>
                  handleInputChange("productLineId", item.value)
                }
                showsVerticalScrollIndicator={false}
              />
            </View> */}
            {/* 库位下拉选择 */}
            {/* <View style={styles.fieldContainer}>
              <Text style={styles.label}>库位:</Text>
              <TextInput
                style={styles.inputContainer}
                value={formData.storageId}
                onChangeText={(value) => handleInputChange("storageId", value)}
                placeholder="输入"
                placeholderTextColor="#999"
              />
            </View> */}
            {/* 数量下拉选择 */}
            {/* <View style={styles.fieldContainer}>
              <Text style={styles.label}>数量:</Text>
              <TextInput
                style={styles.inputContainer}
                value={formData.putInboundQuantity}
                onChangeText={(value) =>
                  handleInputChange("putInboundQuantity", value)
                }
                placeholder="输入"
                placeholderTextColor="#999"
              />
            </View> */}
          </View>
        </KeyboardAwareScrollView>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.btnContainerWrap, { backgroundColor: "#2563eb" }]}
            onPress={handleSearch}
          >
            <View style={styles.backBtn}>
              <Text style={[styles.backBtnText, { color: "#fff" }]}>搜索</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnContainerWrap, { backgroundColor: "#2563eb" }]}
            onPress={handleReset}
          >
            <View style={styles.backBtn}>
              <Text style={[styles.backBtnText, { color: "#fff" }]}>重置</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnContainerWrap, { backgroundColor: "#dbdbdb" }]}
            onPress={() => router.back()}
          >
            <View style={styles.backBtn}>
              <Text style={[styles.backBtnText, { color: "#555" }]}>返回</Text>
            </View>
          </TouchableOpacity>
        </View>
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
    // paddingTop: 40,
    // paddingBottom: 20,
    // backgroundColor: "rgba(255, 255, 255, 0.1)",
    // marginHorizontal: 20,
    // marginTop: 20,
    borderRadius: PX.n15,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: PX.n20,
    // marginTop: 10,
    marginBottom: PX.n20,
  },
  formContainer: {
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
  fieldContainer: {
    marginBottom: PX.n8,
  },
  label: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#333",
    // marginBottom: PX.n10,
  },
  inputContainer: {
    // backgroundColor: "#f5f5f5",
    // borderRadius: PX.n12,
    // paddingHorizontal: PX.n15,
    // paddingVertical: PX.n12,
    // fontSize: h18,
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n12,
    paddingHorizontal: PX.n8,
    paddingVertical: PX.n8,
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
  },
  // dropdown: {
  //   // height: PX.n40,
  //   backgroundColor: "#f5f5f5",
  //   borderRadius: PX.n12,
  //   paddingHorizontal: PX.n15,
  //   paddingVertical: PX.n12,
  //   borderWidth: 0,
  // },
  // placeholderStyle: {
  //   fontSize: PX.h20,
  //   color: "#999",
  //   fontFamily: "SongTi",
  //   paddingVertical: PX.n12,
  // },
  // selectedTextStyle: {
  //   fontSize: PX.h20,
  //   color: "#333",
  //   fontFamily: "SongTi",
  // },
  // dropdownContainer: {
  //   backgroundColor: "#fff",
  //   borderRadius: PX.n12,
  //   shadowColor: "#000",
  //   shadowOffset: {
  //     width: 0,
  //     height: 2,
  //   },
  //   shadowOpacity: 0.15,
  //   shadowRadius: 4,
  //   elevation: 5,
  //   marginTop: PX.n5,
  // },
  // itemTextStyle: {
  //   fontSize: PX.h18,
  //   color: "#333",
  //   fontFamily: "SongTi",
  // },
  // itemContainerStyle: {
  //   paddingHorizontal: PX.n10,
  //   paddingVertical: PX.n0,
  //   borderBottomWidth: 1,
  //   borderBottomColor: "#f0f0f0",
  // },

  dropdown: {
    // height: PX.n40,
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n12,
    paddingHorizontal: PX.n8,
    // paddingVertical: PX.n12,
    borderWidth: 0,
    fontSize: PX.h18,
  },
  placeholderStyle: {
    fontSize: PX.h18,
    paddingVertical: PX.n8,
    color: "#999",
    fontFamily: "SongTi",
  },
  selectedTextStyle: {
    color: "#333",
    fontSize: PX.h18,
    fontFamily: "SongTi",
    paddingVertical: PX.n8,
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
    fontSize: PX.h18,
  },
  itemTextStyle: {
    color: "#333",
    fontSize: PX.h18,
    fontFamily: "SongTi",
    marginVertical: -PX.n12,
  },
  itemContainerStyle: {
    paddingHorizontal: PX.n10,
    paddingVertical: PX.n0,
    // borderBottomWidth: 1,
    // borderBottomColor: "#f0f0f0",
    fontSize: PX.h18,
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: PX.n20,
    paddingVertical: PX.n12,
    paddingBottom: PX.n50 + 8,

    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  btnContainerWrap: {
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
    fontSize: PX.h20,
    fontFamily: "SongTi",
    letterSpacing: 1,
  },
  returnButtonContainer: {
    paddingHorizontal: PX.n20,
    paddingVertical: PX.n20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
  },
  returnBtn: {
    backgroundColor: "transparent",
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n36,
    // minWidth: 120,
    alignItems: "center",
  },
  returnBtnText: {
    color: "#000",
    fontSize: PX.h20,
    fontFamily: "SongTi",
    letterSpacing: 1,
  },
});
