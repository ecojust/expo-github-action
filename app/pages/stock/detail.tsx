import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AnimatedBackground from "../../components/AnimatedBackground";
import { getStockList, getStockListByProcess } from "../../api/stock";
import Service from "./service";
import NativeTestModule, { DeviceInfo } from "../productIn/NativeTestModule";

import * as PX from "@/app/pages/config";
interface IStorageData {
  storageCode: string;
  id: string;
  uuid: string;

  stockQuantity: number;
}
interface IStockDetailProps {
  process: string;
  processCode: string;
  id: string;
  processInventoryDetail: IStorageData[];
}
interface IStockItem {
  id: string;
  productCode: string;
  processString: string;
  color: string;
  size: string;
  needleType: string;
  productName: string;
  total: number;
  orderId?: string;
  // processInventory: IStockDetailProps[];
  processInventoryDetail: IStorageData[];
  photoPath: string;
}

export default function StockDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [stockData, setStockData] = useState<IStockItem[]>([]);
  const [sum, setSum] = useState<number>(0);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string>("");

  const [fixedProductCode, setFixedProductCode] = useState(
    params.productCode ? true : false
  );
  const [fixedColor, setFixedColor] = useState(params.color ? true : false);
  const [fixedSize, setFixedSize] = useState(params.size ? true : false);
  const [fixedNeedleType, setFixedNeedleType] = useState(
    params.needleType ? true : false
  );
  const [fixedProductName, setFixedProductName] = useState(
    params.productName ? true : false
  );

  const productData = {
    productCode: params.productCode,
    color: params.color,
    size: params.size,
    needleType: params.needleType,
    productName: params.productName,
    orderId: params.orderId || "",
  };

  const search = async () => {
    // NativeTestModule.showLoading("loading");

    const res = await getStockListByProcess({
      productCode: params.productCode as string,
      productName: params.productName as string,
      color: params.color as string,
      size: params.size as string,
      needleType: params.needleType as string,

      orderId: (params.orderId || "") as string,
      processArray: [],
      pageNumber: 1,
      pageSize: 100,
    });

    console.log("search", res);
    setSum(res.totalStockQuantity || 0);

    const list = Service.calculateTotal(res.data);

    // 计算总库存数
    const totalSum = list.reduce((sum, item) => sum + item.total, 0);
    // setSum(totalSum);

    setStockData(list);

    console.log("list", list);

    // NativeTestModule.hideLoading();
  };

  useEffect(() => {
    search();
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
            <>
              {/* 总库存数显示 */}
              <View style={styles.totalSumContainer}>
                <Text style={styles.totalSumText}>商品总数: {sum}</Text>
              </View>
              {/* 库存详情列表 */}
              {stockData.map((productData, index) => (
                <View key={productData.id} style={styles.contentContainer}>
                  {/* 基本信息 */}
                  <View style={styles.infoSection}>
                    {productData.orderId && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>订单号:</Text>
                        <Text style={styles.infoValue}>
                          {productData.orderId}
                        </Text>
                      </View>
                    )}

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
                      <Text style={styles.infoLabel}>颜色:</Text>
                      <Text
                        style={[
                          styles.infoValue,
                          fixedColor ? styles.fixed : "",
                        ]}
                      >
                        {productData.color}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>尺码:</Text>
                      <Text
                        style={[
                          styles.infoValue,
                          fixedSize ? styles.fixed : "",
                        ]}
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

                    {
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>工序:</Text>
                        <Text style={styles.infoValue}>
                          {productData.processString}
                        </Text>
                      </View>
                    }

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

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>总库存数:</Text>
                      <Text style={styles.infoValue}>{productData.total}</Text>
                    </View>

                    {productData.total > 0 && (
                      <View style={styles.workshopSection}>
                        <View style={styles.tableContainer}>
                          {/* <View style={styles.workshopTitleRow}>
                          <Text style={styles.workshopTitleText}>
                            {workshop.processCode}
                          </Text>
                        </View> */}
                          <View style={styles.tableHeader}>
                            <Text
                              style={[
                                styles.tableHeaderText,
                                styles.cellLine,
                                { width: "60%" },
                              ]}
                            >
                              库位
                            </Text>
                            <Text style={[styles.tableHeaderText, { flex: 1 }]}>
                              数量
                            </Text>
                          </View>
                          {productData.processInventoryDetail.map(
                            (location, locationIndex) => (
                              <View key={location.uuid} style={styles.tableRow}>
                                <Text
                                  style={[
                                    styles.tableCellText,
                                    styles.cellLine,
                                    { width: "60%" },
                                  ]}
                                >
                                  {location.storageCode}
                                </Text>
                                {/* <Text style={[styles.tableCellText, styles.cellLine]}>
                            {location.id}
                          </Text> */}
                                <Text
                                  style={[styles.tableCellText, { flex: 1 }]}
                                >
                                  {location.stockQuantity}
                                </Text>
                              </View>
                            )
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.btnContainerWrap, { backgroundColor: "#dbdbdb" }]}
            onPress={() => {
              router.push("/pages/stock");
            }}
          >
            <View style={styles.backBtn}>
              <Text style={styles.backBtnText}>返回上页</Text>
            </View>
          </TouchableOpacity>
        </View>

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
    // marginBottom: PX.n30,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: PX.n8,
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
    // marginBottom: PX.n25,
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
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    // paddingVertical: PX.n12,
    paddingHorizontal: PX.n2,
    // borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  tableHeaderText: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
    paddingVertical: PX.n8,
  },
  tableRow: {
    flexDirection: "row",
    // paddingVertical: PX.n12,
    paddingHorizontal: PX.n2,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  tableCellText: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
    paddingVertical: PX.n8,
  },
  cellLine: {
    borderRightWidth: 1,
    borderRightColor: "#e0e0e0",
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
  totalSumContainer: {
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    borderRadius: PX.n10,
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n16,
    marginBottom: PX.n15,
    borderWidth: 1,
    borderColor: "#4a90e2",
  },
  totalSumText: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    fontWeight: "700",
    color: "#4a90e2",
    textAlign: "center",
    letterSpacing: 0.5,
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
    // paddingVertical: PX.n20,
    paddingHorizontal: PX.n36,

    minWidth: 120,
  },
  backBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: PX.pv8,
  },
  backBtnText: {
    color: "#555",
    fontSize: PX.h24,
    fontFamily: "SongTi",

    letterSpacing: 1,
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
});
