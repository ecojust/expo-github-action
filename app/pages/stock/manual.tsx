import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter } from "expo-router";
import { Dropdown } from "react-native-element-dropdown";
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

  const [formData, setFormData] = useState({
    productCode: "",
    color: "",
    size: "",
    needleType: "",
    productName: "",
    orderId: "",
  });

  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [needleOptions, setNeedleOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);

  const handleInputChange = (field: string, value: string) => {
    console.log("handleInputChange", field, value);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // if (field === "ProductCode") {
    //   fetchData();
    // }
  };

  const handleSearch = async () => {
    // 校验至少填写一个字段
    const hasValue =
      formData.productCode ||
      formData.color ||
      formData.size ||
      formData.needleType ||
      formData.productName ||
      formData.orderId;

    if (!hasValue) {
      Alert.alert("提示", "请至少填写一个查询条件");
      return;
    }

    // 跳转到详情页，传递查询参数
    router.push({
      pathname: "/pages/stock/detail",
      params: {
        productCode: formData.productCode,
        color: formData.color,
        size: formData.size,
        needleType: formData.needleType,
        productName: formData.productName,
        orderId: formData.orderId,
      },
    });
  };

  const fetchData2 = async () => {
    try {
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
      console.error("Error fetching data:", error);
    }
  };

  const fetchData = async () => {
    try {
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

  useEffect(() => {
    fetchData2();
  }, []);

  return (
    <AnimatedBackground
      source={require("../../../assets/images/background2.png")}
      duration={600}
    >
      <View style={styles.container}>
        <Text style={styles.title}>手动输入</Text>

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
            {/* 订单号 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>订单号:</Text>
              <TextInput
                style={styles.inputContainer}
                value={formData.orderId}
                onChangeText={(value) => handleInputChange("orderId", value)}
                placeholder="输入"
                placeholderTextColor="#999"
              />
            </View>

            {/* 货号 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>货号:</Text>
              {/* <View style={styles.inputContainer}>
                <Text style={styles.codeText}>{formData.ProductCode}</Text>
              </View> */}
              <TextInput
                style={styles.inputContainer}
                value={formData.productCode}
                onChangeText={(value) => {
                  handleInputChange("productCode", value);
                }}
                placeholder="输入货号"
                placeholderTextColor="#999"
              />
            </View>

            {/* 品名下拉选择 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>品名:</Text>
              {/* <Dropdown
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
              /> */}

              <TextInput
                style={styles.inputContainer}
                value={formData.productName}
                onChangeText={(value) => {
                  handleInputChange("productName", value);
                }}
                placeholder="输入品名"
                placeholderTextColor="#999"
              />
            </View>

            {/* 颜色下拉选择 */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>颜色:</Text>
              {/* <Dropdown
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
              /> */}
              <TextInput
                style={styles.inputContainer}
                value={formData.color}
                onChangeText={(value) => {
                  handleInputChange("color", value);
                }}
                placeholder="输入颜色"
                placeholderTextColor="#999"
              />
            </View>

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
          </View>
        </KeyboardAwareScrollView>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.btnWrap, { backgroundColor: "#2563eb" }]}
            onPress={handleSearch}
          >
            <View style={[styles.backBtn]}>
              <Text style={[styles.backBtnText, { color: "#fff" }]}>搜索</Text>
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
    marginTop: PX.n10,
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
    marginBottom: PX.n4,
  },
  inputContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n12,
    paddingHorizontal: PX.n8,
    paddingVertical: PX.n8,
    fontSize: PX.h18,
    fontFamily: "SongTi",
  },
  codeText: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#333",
  },
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
    gap: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    // elevation: 5,
    paddingBottom: PX.n50 + 8,
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
    fontSize: PX.h20,
    fontFamily: "SongTi",
    letterSpacing: 1,
  },
});
