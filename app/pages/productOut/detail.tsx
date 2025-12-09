import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  TextInput,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import AnimatedBackground from "../../components/AnimatedBackground";
import ScanModal from "../../components/ScanModal";
import FloatingPackageButton from "../../components/FloatingPackageButton";
import * as PX from "@/app/pages/config";
import { getUnfinishedTaskDetail, putOutList } from "@/app/api/out";
import { getPackageDetails } from "@/app/api/package";
import NativeTestModule from "../productIn/NativeTestModule";

export default function OutboundTaskDetail() {
  const router = useRouter();
  const {
    issueTaskId,
    productInfoId,
    productCode,
    color,
    size,
    needleType,
    productName,
    processString,
    issueTimeString,
    deliveryTimeString,
    outboundQuantity,
    productLine,
    totalStockQuantity,
    threshold,
  } = useLocalSearchParams();

  const [showScanModal, setShowScanModal] = useState(false);
  const [quantityDialogVisible, setQuantityDialogVisible] = useState(false);

  const [actualPutInboundQuantity, setActualPutInboundQuantity] = useState("");

  const [selectedWarehouseStorage, setSelectedWarehouseStorage] = useState<
    string | null
  >(null);
  const [selectedWarehouseQuantity, setSelectedWarehouseQuantity] = useState(0);

  const [sumQuantity, setSumQuantity] = useState(0);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);

  // 拖拽相关状态
  const [modalPosition] = useState(new Animated.ValueXY({ x: 0, y: 0 }));
  const [isDragging, setIsDragging] = useState(false);

  // 创建PanResponder用于拖拽
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => false,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
    },
    onMoveShouldSetPanResponderCapture: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
    },
    onPanResponderGrant: (evt, gestureState) => {
      setIsDragging(true);
      modalPosition.setOffset({
        x: modalPosition.x._value,
        y: modalPosition.y._value,
      });
      modalPosition.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: Animated.event(
      [null, { dx: modalPosition.x, dy: modalPosition.y }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (evt, gestureState) => {
      setIsDragging(false);
      modalPosition.flattenOffset();
    },
    onPanResponderTerminate: (evt, gestureState) => {
      setIsDragging(false);
      modalPosition.flattenOffset();
    },
  });

  // 容器选择相关状态
  const [packageList, setPackageList] = useState([
    // {
    //   productProcessId: "",
    //   outboundQuantity: 0,
    //   storageCode: "",
    // },
  ]);

  const [thd, setThd] = useState<number>(Number(threshold));

  const [warehouses, setWarehouses] = useState([
    // 示例数据结构，实际数据从API获取
    // {
    //   storage: "abc-0008",
    //   stockQuantity: 1600,
    //   issueQuantity: 1800,
    //   storageQuantityDetail: [
    //     {
    //       packageNumber: "17",
    //       packageId: "pkg_17_001",
    //       quantity: 800,
    //     },
    //     {
    //       packageNumber: "18",
    //       packageId: "pkg_18_001",
    //       quantity: 800,
    //     }
    //   ]
    // }
  ]);

  // 模拟任务详情数据
  const [taskDetail] = useState({
    // id: taskId,
    taskNumber: `任务详情`,
    productCode: productCode,
    color: color,
    size: size,
    needleType: needleType,
    productName: productName,
    processString: processString,
    issueTimeString: issueTimeString,
    deliveryTimeString: deliveryTimeString,
    outboundQuantity: outboundQuantity,
    actualOutbound: 0,
    productLine: productLine,
    totalStockQuantity: totalStockQuantity,
    // stock: 30000,
    // productLine: "产线2",
    // image: require("../../../assets/images/logo.png"),
    // orderDate: "2025年6月16日",
    // deliveryDate: "2025年8月18日",
    // totalOutbound: 5000,
    // actualOutbound: 0,
    // warehouses: [
    //   {
    //     location: "A",
    //     stock: 1500,
    //     outbound: 1500,
    //   },
    //   {
    //     location: "B",
    //     stock: 2000,
    //     outbound: 2000,
    //   },
    // ],
  });

  // 计算容器总出库数量
  const calculatePackageTotal = () => {
    return packageList.reduce(
      (sum, item) => sum + (item.outboundQuantity || 0),
      0
    );
  };

  // 检查是否可以出库
  const canConfirmOutbound = () => {
    const packageTotal = calculatePackageTotal();

    console.log("packageTotal", packageTotal);

    console.log("outboundQuantity", outboundQuantity);

    console.log("packageList", packageList);

    const diff = Math.abs(packageTotal - Number(outboundQuantity));
    return (
      diff <= thd &&
      packageList.every(
        (item) =>
          item.productProcessId && item.storageCode && item.outboundQuantity > 0
      )
    );
  };

  // 处理容器卡片点击
  const handlePackageCardPress = (detail, warehouse) => {
    const isInPackageList = packageList.some(
      (item) => item.productProcessId === detail.productProcessId
    );

    if (isInPackageList) {
      // 如果已存在，则从列表中移除
      const updatedPackageList = packageList.filter(
        (item) => item.productProcessId !== detail.productProcessId
      );
      setPackageList(updatedPackageList);
    } else {
      // 如果不存在，则添加到列表中
      // const newPackageItem = {
      //   productProcessId: detail.productProcessId,
      //   outboundQuantity: detail.quantity || 0,
      //   storageCode: warehouse.storage,
      // };
      // setPackageList([...packageList, newPackageItem]);
    }
  };

  const handleConfirmOutbound = async () => {
    const data = {
      productInfoId: Number(productInfoId),
      outboundTaskId: Number(issueTaskId),
      outStorageDetail: packageList.map((item) => ({
        outboundQuantity: item.outboundQuantity,
        storageCode: item.storageCode,
        productProcessId: item.productProcessId,
      })),
    };
    console.log("handleConfirmOutbound-data", data);

    //@ts-ignore
    const res = await putOutList(data);
    console.log("handleConfirmOutbound-res", res);

    //@ts-ignore
    if (res.code == 200) {
      NativeTestModule.showToast("出库成功");
      router.back();
    } else {
      //@ts-ignore
      Alert.alert("错误", res.message || "出库失败");
    }
  };

  const setStockNum = () => {
    warehouses.find(
      (W) => W.storage == selectedWarehouseStorage
    ).actualQuantity = actualPutInboundQuantity;
    let sum = 0;
    warehouses.forEach((w) => {
      sum += w.actualQuantity;
    });

    console.log("sum", sum);

    setSumQuantity(parseInt(sum + ""));

    setQuantityDialogVisible(false);
  };

  const handleScanSuccess = (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      if (data.tag == "packageQRCode") {
        console.log("扫描到容器ID:", data.id);

        // 在所有仓库的storageQuantityDetail中查找匹配的容器
        for (const warehouse of warehouses) {
          if (
            warehouse.storageQuantityDetail &&
            warehouse.storageQuantityDetail.length > 0
          ) {
            const packageDetail = warehouse.storageQuantityDetail.find(
              (detail) => detail.productProcessId == data.id
            );

            if (packageDetail) {
              // 检查是否已经在出库列表中
              const existingIndex = packageList.findIndex(
                (item) =>
                  item.productProcessId === packageDetail.productProcessId
              );

              if (existingIndex >= 0) {
                // Alert.alert("提示", "该容器已在出库列表中");
                return;
              }

              // 创建新的容器项并添加到packageList
              const newPackageItem = {
                productProcessId: packageDetail.productProcessId || data.id,
                outboundQuantity: packageDetail.quantity || 0,
                storageCode: warehouse.storage,
              };

              // 去重处理：检查是否已存在相同的 productProcessId
              const isDuplicate = packageList.some(
                (item) =>
                  item.productProcessId === newPackageItem.productProcessId
              );

              if (!isDuplicate) {
                setPackageList([...packageList, newPackageItem]);
              } else {
                Alert.alert("提示", "该容器已在出库列表中");
                return;
              }

              break;
            }
          }
        }
      } else {
        Alert.alert("错误", "请扫描容器二维码");
      }
    } catch (error) {
      Alert.alert("错误", "请扫描容器二维码");
    }
  };

  const fetchData = async () => {
    const data = {
      productId: productInfoId,
      issueTaskId,
      pageNumber: 1,
      pageSize: 100,
    };
    console.log("fetch data", data);
    //@ts-ignore
    const res = await getUnfinishedTaskDetail(data);
    console.log("res", res);
    //@ts-ignore
    if (res.code == 200) {
      // 确保每个warehouse都有storageQuantityDetail数组
      const warehousesWithDetails = res.data.map((warehouse: any) => ({
        ...warehouse,
        storageQuantityDetail: warehouse.storageQuantityDetail || [],
      }));
      setWarehouses(warehousesWithDetails);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AnimatedBackground
      source={require("../../../assets/images/background2.png")}
      duration={600}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{taskDetail.taskNumber}</Text>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 产品信息 */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>货号:</Text>
              <Text style={styles.infoValue}>{taskDetail.productCode}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>颜色:</Text>
              <Text style={styles.infoValue}>{taskDetail.color}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>尺码:</Text>
              <Text style={styles.infoValue}>{taskDetail.size}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>针型:</Text>
              <Text style={styles.infoValue}>{taskDetail.needleType}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>品名:</Text>
              <Text style={styles.infoValue}>{taskDetail.productName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>工序:</Text>
              <Text style={styles.infoValue}>{taskDetail.processString}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>库存:</Text>
              <Text style={styles.infoValue}>
                {taskDetail.totalStockQuantity}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>产线:</Text>
              <Text style={styles.infoValue}>{taskDetail.productLine}</Text>
            </View>

            {/* 照片 */}
            {/* <View style={styles.imageSection}>
              <Text style={styles.infoLabel}>照片:</Text>
              <Image source={taskDetail.image} style={styles.productImage} />
            </View> */}

            {/* 日期信息 */}
            <View style={styles.dateSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>下发日期:</Text>
                <Text style={[styles.infoValue, { fontSize: PX.h16 }]}>
                  {taskDetail.issueTimeString}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>交货日期:</Text>
                <Text style={[styles.infoValue, { fontSize: PX.h16 }]}>
                  {taskDetail.deliveryTimeString}
                </Text>
              </View>
            </View>

            {/* 出库数量信息 */}
            <View style={styles.outboundSection}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>总出库数:</Text>
                <Text style={styles.infoValue}>
                  {taskDetail.outboundQuantity}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>实际出库:</Text>
                <Text style={styles.infoValue}>{calculatePackageTotal()}</Text>
              </View>
            </View>

            {/* 库位信息和容器详情 */}
            <View style={styles.warehouseSection}>
              {warehouses.map((warehouse, warehouseIndex) => (
                <View key={warehouseIndex} style={styles.warehouseContainer}>
                  {/* 库位标题 */}
                  <View style={styles.warehouseHeader}>
                    <Text style={styles.warehouseTitle}>
                      库位: {warehouse.storage}
                    </Text>
                    <Text style={styles.warehouseSubtitle}>
                      (库存数: {warehouse.stockQuantity} | 下发出库数:{" "}
                      {warehouse.issueQuantity})
                    </Text>
                  </View>

                  {/* 容器详情列表 */}
                  <View style={styles.storageDetailsContainer}>
                    {warehouse.storageQuantityDetail &&
                    warehouse.storageQuantityDetail.length > 0 ? (
                      <View style={styles.packageCardsRow}>
                        {warehouse.storageQuantityDetail.map(
                          (detail, detailIndex) => {
                            // 检查当前容器是否在出库列表中
                            const isInPackageList = packageList.some(
                              (item) =>
                                item.productProcessId ===
                                detail.productProcessId
                            );

                            return (
                              <TouchableOpacity
                                key={detailIndex}
                                style={[
                                  styles.packageDetailCard,
                                  isInPackageList &&
                                    styles.packageDetailCardHighlight,
                                ]}
                                onPress={() =>
                                  handlePackageCardPress(detail, warehouse)
                                }
                                activeOpacity={0.7}
                              >
                                <View style={styles.packageDetailHeader}>
                                  <Text style={styles.packageDetailNumber}>
                                    {detail.productProcessId ||
                                      `${detailIndex + 1}`}
                                  </Text>
                                  <View style={styles.packageDetailQuantity}>
                                    <Text style={styles.quantityLabel}>
                                      数量
                                    </Text>
                                    <Text style={styles.quantityValue}>
                                      {detail.quantity || 0}
                                    </Text>
                                  </View>
                                </View>

                                {/* <View style={styles.packageDetailActions}>
                                <Text style={styles.selectableText}>
                                  可选择
                                </Text>
                                <TouchableOpacity
                                  style={styles.selectButton}
                                  onPress={() =>
                                    handlePackageSelect(
                                      warehouse,
                                      detail,
                                      warehouseIndex,
                                      detailIndex
                                    )
                                  }
                                >
                                  <Text style={styles.selectButtonText}>
                                    选择
                                  </Text>
                                </TouchableOpacity>
                              </View> */}
                              </TouchableOpacity>
                            );
                          }
                        )}
                      </View>
                    ) : (
                      <View style={styles.noPackageContainer}>
                        <Text style={styles.noPackageText}>暂无容器详情</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}

              <View style={styles.packageSummary}>
                <Text
                  style={[
                    styles.summaryText,
                    {
                      color:
                        Math.abs(
                          calculatePackageTotal() - Number(outboundQuantity)
                        ) <= thd
                          ? "green"
                          : "red",
                    },
                  ]}
                >
                  温馨提示: 当前出库操作数量与计划数量相差
                  {Math.abs(calculatePackageTotal() - Number(outboundQuantity))}
                  {Math.abs(
                    calculatePackageTotal() - Number(outboundQuantity)
                  ) <= thd
                    ? `，在阈值区间${thd}内。`
                    : `，与允许阈值${thd}相差较大，建议将容器拆分后再进行出库操作。`}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.btnWrap,
              {
                backgroundColor: canConfirmOutbound() ? "#2563eb" : "#cccccc",
              },
            ]}
            onPress={() => {
              if (canConfirmOutbound()) {
                modalPosition.setValue({ x: 0, y: 0 });
                setConfirmDialogVisible(true);
              }
            }}
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

        {/* <ScanModal
          visible={showScanModal}
          onClose={() => setShowScanModal(false)}
          onScanSuccess={handleScanSuccess}
          title={`扫描库位 ${selectedWarehouseStorage}`}
        /> */}

        {/* 浮动容器按钮 */}
        <FloatingPackageButton onScanSuccess={handleScanSuccess} />

        {/*  填写数量 弹窗 */}
        <Modal
          visible={quantityDialogVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* 产品信息 */}
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.infoContainerDialog}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>货号:</Text>
                    <Text style={styles.infoValue}>
                      {taskDetail.productCode}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>颜色:</Text>
                    <Text style={styles.infoValue}>{taskDetail.color}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>尺码:</Text>
                    <Text style={styles.infoValue}>{taskDetail.size}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>针型:</Text>
                    <Text style={styles.infoValue}>
                      {taskDetail.needleType}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>品名:</Text>
                    <Text style={styles.infoValue}>
                      {taskDetail.productName}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>工序:</Text>
                    <Text style={styles.infoValue}>
                      {taskDetail.processString}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>产线:</Text>
                    <Text style={styles.infoValue}>
                      {taskDetail.productLine}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>库位:</Text>
                    <Text style={styles.infoValue}>
                      {selectedWarehouseStorage}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>库存:</Text>
                    <Text style={styles.infoValue}>
                      {selectedWarehouseQuantity}
                    </Text>
                  </View>

                  {/* 照片 */}
                  {/* <View style={styles.imageSection}>
                  <Text style={styles.infoLabel}>照片:</Text>
                  <Image
                    source={taskDetail.image}
                    style={styles.productImage}
                  />
                </View> */}

                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>实际出库数:</Text>
                    <TextInput
                      style={[styles.infoValueRow]}
                      value={actualPutInboundQuantity}
                      onChangeText={(value) => {
                        setActualPutInboundQuantity(value);
                      }}
                      onBlur={Keyboard.dismiss}
                      placeholder="输入"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity
                      style={[styles.printButton]}
                      onPress={() => {
                        // confirmDialog();
                        setStockNum();
                      }}
                    >
                      <Text style={styles.printButtonText}>确认</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
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
            <Animated.View
              style={[
                styles.modalContainer,
                {
                  transform: modalPosition.getTranslateTransform(),
                },
                isDragging && styles.modalContainerDragging,
              ]}
              {...panResponder.panHandlers}
            >
              <View style={styles.modalDragHandle}>
                <View style={styles.modalDragIndicator} />
              </View>
              <Text style={styles.modalTitle}>请核对提交数据是否正确</Text>

              {/* <Text style={styles.modalSubtitle}>{scanSubTitle}</Text> */}

              <View style={styles.modalButtonContainer2}>
                <TouchableOpacity
                  style={[styles.printButton2]}
                  onPress={() => {
                    handleConfirmOutbound();
                  }}
                >
                  <Text style={styles.printButtonText}>确认</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton2}
                  onPress={() => {
                    setConfirmDialogVisible(false);
                    // 重置弹窗位置
                    // modalPosition.setValue({ x: 0, y: 0 });
                  }}
                >
                  <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
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
    marginBottom: 20,
  },
  infoContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: PX.n15,
    padding: PX.n20,
    marginBottom: PX.n15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: PX.n4,
    // borderBottomWidth: 1,
    // borderBottomColor: "#f8f9fa",
  },

  infoCol: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: PX.n8,
  },
  infoLabel: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#333",

    // flex: 1,
  },
  infoValue: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  infoValueRow: {
    // flex: 1,
    fontSize: PX.h18,
    // color: "#222",
    // fontFamily: "SongTi",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n8,
    paddingHorizontal: PX.n16,
    paddingVertical: PX.n8,
    marginVertical: PX.n8,
    fontFamily: "SongTi",
    width: "100%",
  },
  imageSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: PX.n12,
    // borderBottomWidth: 1,
    // borderBottomColor: "#f8f9fa",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: PX.n8,
    backgroundColor: "#f0f0f0",
    marginLeft: "auto",
  },
  dateSection: {
    marginTop: PX.n10,
    // paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: "#e8f5e8",
  },
  outboundSection: {
    marginVertical: PX.n10,
    // paddingTop: 15,
    // borderTopWidth: 2,
    // borderTopColor: "#e8f5e8",
    borderBottomWidth: 2,
    borderBottomColor: "#e8f5e8",
  },
  stockContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: PX.n15,
    marginBottom: PX.n15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stockHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n15,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  stockHeaderText: {
    flex: 1,
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#495057",
    textAlign: "center",
  },
  stockRow: {
    flexDirection: "row",
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n15,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  stockCell: {
    flex: 1,
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
  },
  // 库位和容器详情样式
  warehouseSection: {
    // marginBottom: PX.n20,
  },
  warehouseContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: PX.n15,
    // marginBottom: PX.n15,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  warehouseHeader: {
    backgroundColor: "#f8f9fa",
    paddingVertical: PX.n15,
    paddingHorizontal: PX.n20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  warehouseTitle: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#333",
    fontWeight: "bold",
    marginBottom: PX.n5,
  },
  warehouseSubtitle: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#666",
  },
  storageDetailsContainer: {
    padding: PX.n8,
  },
  packageCardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: PX.n10,
  },
  packageDetailCard: {
    backgroundColor: "#fff",
    borderRadius: PX.n12,
    padding: PX.n10,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    // minWidth: 150,
    // maxWidth: 180,
    flex: 0,
  },
  packageDetailCardHighlight: {
    borderColor: "#2563eb",
    // borderWidth: 2,
    borderWidth: 1,

    backgroundColor: "#e6f3ff",
  },
  packageDetailCardInnerShadow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: PX.n10,
    backgroundColor: "transparent",
    // 使用 box-shadow inset 的替代方案
    borderWidth: 1,
    borderColor: "rgba(37, 99, 235, 0.3)",
    shadowColor: "#2563eb",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 0,
  },
  packageDetailHeader: {
    alignItems: "center",
    marginBottom: PX.n6,
  },
  packageDetailNumber: {
    fontSize: PX.h22,
    fontFamily: "SongTi",
    color: "#333",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: PX.n3,
  },
  packageDetailQuantity: {
    alignItems: "center",
  },
  quantityLabel: {
    fontSize: PX.h12,
    fontFamily: "SongTi",
    color: "#666",
    marginBottom: PX.n1,
  },
  quantityValue: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#333",
    fontWeight: "bold",
  },
  packageDetailActions: {
    alignItems: "center",
    marginTop: PX.n8,
  },
  selectableText: {
    fontSize: PX.h12,
    fontFamily: "SongTi",
    color: "#999",
    marginBottom: PX.n5,
  },
  selectButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: PX.n16,
    paddingVertical: PX.n6,
    borderRadius: PX.n15,
    width: "100%",
  },
  selectButtonText: {
    fontSize: PX.h14,
    fontFamily: "SongTi",
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  noPackageContainer: {
    padding: PX.n20,
    alignItems: "center",
  },
  noPackageText: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#999",
  },
  modalTitle: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
    marginBottom: PX.n24,
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
    paddingVertical: PX.n20,
    alignItems: "center",
    minWidth: 300,
    width: "90%",
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
  modalContainerDragging: {
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  modalDragHandle: {
    width: 60,
    height: 20,
    backgroundColor: "transparent",
    borderRadius: 10,
    marginBottom: PX.n5,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  modalDragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#ccc",
    borderRadius: 2,
  },
  modalContent: {
    alignItems: "center",
    paddingVertical: PX.n10,
  },

  infoContainerDialog: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    // borderWidth: 2,
    // borderColor: "red",
    width: "100%",
    // borderRadius: PX.n15,
    paddingHorizontal: PX.n20,
    // marginBottom: 15,
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 2,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    // elevation: 3,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  modalButtonContainer2: {
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
    width: "50%",
    marginHorizontal: "25%",
  },

  printButtonText: {
    color: "#fff",
    fontSize: PX.h18,
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
  printButton2: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n25,
    paddingHorizontal: PX.n30,
    paddingVertical: PX.n10,
  },
  cancelButton2: {
    backgroundColor: "#f5f5f5",
    borderRadius: PX.n25,
    paddingHorizontal: PX.n30,
    paddingVertical: PX.n10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: PX.h18,
    fontFamily: "SongTi",
    textAlign: "center",
  },

  // 容器选择相关样式
  packageSection: {
    marginTop: PX.n20,
    paddingTop: PX.n15,
    borderTopWidth: 2,
    borderTopColor: "#e8f5e8",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: PX.n15,
  },
  sectionTitle: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#333",
  },
  commonScanButton: {
    backgroundColor: "#4F8EF7",
    borderRadius: PX.n20,
    paddingHorizontal: PX.n16,
    paddingVertical: PX.n8,
    shadowColor: "#4F8EF7",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  commonScanButtonText: {
    color: "#fff",
    fontSize: PX.h16,
    fontFamily: "SongTi",
    fontWeight: "bold",
  },
  packageItem: {
    backgroundColor: "#fff",
    borderRadius: PX.n12,
    padding: PX.n15,
    marginBottom: PX.n12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  packageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: PX.n12,
  },
  packageIdContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: PX.n8,
    paddingHorizontal: PX.n12,
    paddingVertical: PX.n10,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  packageIdDisplay: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#495057",
    fontWeight: "500",
    flex: 1,
  },
  packageIdInput: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#495057",
    fontWeight: "500",
    padding: 0,
    margin: 0,
  },
  packageActions: {
    flexDirection: "row",
    marginLeft: PX.n10,
  },
  scanButton: {
    backgroundColor: "#4F8EF7",
    borderRadius: PX.n8,
    paddingHorizontal: PX.n12,
    paddingVertical: PX.n10,
    marginRight: PX.n8,
    shadowColor: "#4F8EF7",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  scanButtonText: {
    color: "#fff",
    fontSize: PX.h16,
    textAlign: "center",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    borderRadius: PX.n15,
    paddingHorizontal: PX.n8,
    paddingVertical: PX.n4,
    marginLeft: PX.n8,
    shadowColor: "#dc3545",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: PX.h18,
    fontFamily: "SongTi",
    fontWeight: "bold",
    textAlign: "center",
  },
  packageInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    borderRadius: PX.n8,
    padding: PX.n12,
  },
  packageInfoItem: {
    flex: 1,
    alignItems: "center",
  },
  packageInfoLabel: {
    fontSize: PX.h14,
    fontFamily: "SongTi",
    color: "#6c757d",
    marginBottom: PX.n4,
  },
  packageInfoValue: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#495057",
    fontWeight: "600",
  },
  addPackageButton: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n10,
    paddingVertical: PX.n12,
    alignItems: "center",
    marginBottom: PX.n15,
    shadowColor: "#28a745",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addPackageText: {
    color: "#fff",
    fontSize: PX.h18,
    fontFamily: "SongTi",
    fontWeight: "600",
  },
  packageSummary: {
    backgroundColor: "rgba(255, 243, 205, 0.9)",
    borderRadius: PX.n10,
    padding: PX.n15,
    // borderLeftWidth: 4,
    // borderLeftColor: "#ffc107",
  },
  summaryText: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    lineHeight: PX.h22,
    fontWeight: "500",
  },
});
