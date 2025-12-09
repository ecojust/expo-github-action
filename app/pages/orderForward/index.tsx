import React, { useState, useEffect } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import AnimatedBackground from "../../components/AnimatedBackground";

import * as PX from "@/app/pages/config";

import {
  transferOrderWaitConfirm,
  transferOrderConfirm,
} from "@/app/api/order";
export default function OrderForward() {
  const router = useRouter();

  const [orderData, setOrderData] = useState<OrderData[]>([]);
  const [confirmDialogVisible, setConfirmDialogVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number>(0);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string>("");

  // 订单数据类型定义
  interface OrderData {
    id: number;
    orderId: string;
    taskId: number;
    productCode: string;
    productName: string;
    color: string;
    size: string;
    needleType: string;
    finishedProcess: string;
    nextProcess: string;
    originalProductLine: string;
    newProductLine: string;
    quantity?: number; //
    totalQuantity?: number; //
    photoPath: string;
    productProcessIds: string;
  }

  const getList = async () => {
    const res = await transferOrderWaitConfirm({
      pageNumber: 1,
      pageSize: 10,
    });
    console.log(res);

    //@ts-ignore
    if (res.code == 200) {
      const data = res.data;

      setOrderData(data);
      console.log(data);
    }
  };

  const handleConfirmTransfer = (taskId: number) => {
    setSelectedTaskId(taskId);
    setConfirmDialogVisible(true);
  };

  const confirmDialog = async () => {
    setConfirmDialogVisible(false);
    await confirmTransfer(selectedTaskId);
  };

  const confirmTransfer = async (taskId: number) => {
    try {
      const res = await transferOrderConfirm({ id: taskId });
      //@ts-ignore
      if (res.code === 200) {
        // 确认成功后刷新列表
        getList();
        // 显示成功提示
        Alert.alert("成功", "订单转发确认成功！");
      } else {
        Alert.alert("失败", "订单转发确认失败，请重试");
      }
    } catch (error) {
      console.error("确认转发失败:", error);
      Alert.alert("错误", "网络错误，请检查网络连接后重试");
    }
  };

  useEffect(() => {
    getList();
  }, []);

  return (
    <AnimatedBackground
      source={require("../../../assets/images/background2.png")}
      duration={600}
    >
      <View style={styles.container}>
        <Text style={styles.title}>订单转发</Text>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {orderData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无转发订单</Text>
            </View>
          ) : (
            orderData.map((order, index) => (
              // <TouchableOpacity
              //   key={order.taskId}
              //   onPress={() => router.push("/pages/orderForward/detail")}
              // >
              <View key={order.taskId} style={styles.orderCard}>
                <Text style={styles.orderTitle}>
                  {orderData.length - index}
                </Text>

                <View style={styles.orderInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>订单:</Text>
                    <Text style={styles.infoValue}>{order.orderId}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>货号:</Text>
                    <Text style={styles.infoValue}>{order.productCode}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>品名:</Text>
                    <Text style={styles.infoValue}>{order.productName}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>颜色:</Text>
                    <Text style={styles.infoValue}>{order.color}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>尺码:</Text>
                    <Text style={styles.infoValue}>{order.size}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>针型:</Text>
                    <Text style={styles.infoValue}>{order.needleType}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>已完成工序:</Text>
                    <Text style={styles.infoValue}>
                      {order.finishedProcess.replaceAll(",", " ")}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>下道工序:</Text>
                    <Text style={styles.infoValue}>{order.nextProcess}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>照片:</Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (order.photoPath) {
                          setPreviewImageUri(order.photoPath);
                          setShowImagePreview(true);
                        }
                      }}
                    >
                      <Image
                        source={{ uri: order.photoPath }}
                        style={styles.productImage}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* 转发摘要表格 */}
                  <View style={styles.summaryContainer}>
                    <Text style={styles.summaryTitle}>转发摘要</Text>
                    <View style={styles.summaryTable}>
                      <View style={styles.tableRow}>
                        <Text style={styles.tableLabel}>原计划下发产线:</Text>
                        <Text style={styles.tableValue}>
                          {order.originalProductLine || "ZS015"}(
                          {order.totalQuantity})
                        </Text>
                      </View>

                      <View style={[styles.tableRow]}>
                        <Text style={styles.tableLabel}>转发目标产线:</Text>
                        <Text style={styles.tableValue}>
                          {order.newProductLine || "ZS003"}({order.quantity})
                        </Text>
                      </View>

                      <View style={[styles.tableRow, styles.lastTableRow]}>
                        <Text style={styles.tableLabel}>容器:</Text>
                        <Text style={styles.tableValue}>
                          {order.productProcessIds}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* 操作按钮 */}
                <View style={styles.actionContainer}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => handleConfirmTransfer(order.id)}
                  >
                    <Text style={styles.confirmButtonText}>确认转发</Text>
                  </TouchableOpacity>
                </View>
              </View>
              // </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.returnButton, { backgroundColor: "#dbdbdb" }]}
            onPress={() => router.replace("/menus")}
          >
            <Text style={styles.returnButtonText}>返回主页</Text>
          </TouchableOpacity>
        </View>

        {/* 确认转发对话框 */}
        <Modal
          visible={confirmDialogVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setConfirmDialogVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContainer,
                styles.confirmModalContainer,
                {
                  borderWidth: 1,
                  borderColor: "red",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "center",
                },
              ]}
            >
              <View
                style={[
                  styles.confirmIconContainer,
                  {
                    borderWidth: 1,
                    borderColor: "blue",
                  },
                ]}
              >
                <Text style={styles.confirmIcon}>⚠️</Text>
              </View>

              <Text style={styles.confirmModalTitle}>确认转发</Text>
              <Text
                style={[
                  styles.confirmModalSubtitle,
                  {
                    borderWidth: 1,
                    borderColor: "blue",
                  },
                ]}
              >
                您确定要转发此订单吗？转发后将无法撤销。
              </Text>

              <View
                style={[
                  styles.modalButtonContainer,
                  styles.confirmButtonContainer,
                  {
                    borderWidth: 1,
                    borderColor: "blue",
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.dialogConfirmButton}
                  onPress={confirmDialog}
                >
                  <Text style={styles.dialogConfirmButtonText}>确认</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dialogCancelButton}
                  onPress={() => setConfirmDialogVisible(false)}
                >
                  <Text style={styles.dialogCancelButtonText}>取消</Text>
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
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: PX.n20,
    // marginTop: 10,
    marginBottom: PX.n20,
  },
  orderCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: PX.n15,
    paddingVertical: PX.n4,
    paddingHorizontal: PX.n8,
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
  orderTitle: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
    marginBottom: PX.n20,
    paddingVertical: PX.n2,
    paddingBottom: PX.n4,
    // backgroundColor: "#f8f9fa",
    borderRadius: PX.n8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  orderInfo: {
    // gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: PX.n4,
    // borderBottomWidth: 1,
    // borderBottomColor: "#f0f0f0",
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
  buttonContainer: {
    paddingHorizontal: PX.n20,
    paddingVertical: PX.n12,
    paddingBottom: PX.n50 + 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
  },
  returnButton: {
    borderRadius: PX.n30,
    paddingVertical: PX.pv8,
    paddingHorizontal: PX.n36,
    minWidth: 120,
    alignItems: "center",
  },
  returnButtonText: {
    color: "#555",
    fontSize: PX.h20,
    fontFamily: "SongTi",
    letterSpacing: 1,
  },
  actionContainer: {
    // marginTop: PX.n15,
    paddingVertical: PX.n4,
    // borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n30,
    paddingVertical: PX.n10,
    paddingHorizontal: PX.n20,
    minWidth: 100,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: PX.h18,
    fontFamily: "SongTi",
    fontWeight: "500",
  },
  summaryContainer: {
    // marginTop: PX.n10,
    // paddingTop: PX.n10,
  },
  summaryTitle: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#333",
    marginBottom: PX.n10,
  },
  summaryTable: {
    backgroundColor: "#f8f9fa",
    borderRadius: PX.n8,
    padding: PX.n12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: PX.n8,
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  tableLabel: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#495057",
    flex: 1,
  },
  tableValue: {
    fontSize: PX.h18,
    fontFamily: "SongTi",
    color: "#212529",
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
  },
  lastTableRow: {
    borderBottomWidth: 0,
  },
  // 对话框样式
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignSelf: "center",
  },
  confirmModalContainer: {
    // paddingHorizontal: PX.n32,
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
  productImage: {
    width: PX.n30 * 2,
    height: PX.n30 * 2,
    borderRadius: PX.n8,
    backgroundColor: "#f0f0f0",
    marginLeft: "auto",
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmButtonContainer: {
    width: "100%",
    flexDirection: "row",
    gap: PX.n12,
  },
  dialogConfirmButton: {
    backgroundColor: "#2563eb",
    borderRadius: PX.n30,
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n24,
    flex: 1,
    marginRight: PX.n6,
  },
  dialogConfirmButtonText: {
    color: "#fff",
    fontSize: PX.h20,
    fontFamily: "SongTi",
    letterSpacing: 1,
    textAlign: "center",
    fontWeight: "500",
  },
  dialogCancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: PX.n30,
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n24,
    flex: 1,
    marginLeft: PX.n6,
  },
  dialogCancelButtonText: {
    color: "#666",
    fontSize: PX.h18,
    fontWeight: "500",
    textAlign: "center",
    fontFamily: "SongTi",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: PX.n50 * 2,
  },
  emptyText: {
    fontSize: PX.h20,
    fontFamily: "SongTi",
    color: "#999",
    textAlign: "center",
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
