import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import AnimatedBackground from "../../components/AnimatedBackground";
import { getOutStorageRecord, test, getUnfinishedTask } from "@/app/api/out";
import { testApiConnection, testDifferentMethods } from "@/app/utils/apiTest";
import NativeTestModule, { DeviceInfo } from "../productIn/NativeTestModule";

import * as PX from "@/app/pages/config";
export default function ProductOut() {
  const router = useRouter();

  const [outboundTasks] = useState([
    // {
    //   id: 1,
    //   taskNumber: "出库任务1",
    //   productCode: "253758745212872116",
    //   color: "红色",
    //   size: "37码",
    //   needleType: "15号针",
    //   productName: "袜子男士夏季薄款",
    //   workOrder: "包装工序",
    //   quantity: 3500,
    //   productLine: "产线2",
    //   image: require("../../../assets/images/logo.png"),
    //   orderDate: "2025年6月16日",
    //   deliveryDate: "2025年8月16日",
    //   expanded: false,
    // },
  ]);

  const [tasks, setTasks] = useState(outboundTasks);
  const [expanded, setExpanded] = useState([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string>("");

  const toggleTaskExpansion = (issueTaskId: number) => {
    if (expanded.includes(issueTaskId)) {
      setExpanded(expanded.filter((id) => id !== issueTaskId));
    } else {
      setExpanded([...expanded, issueTaskId]);
    }

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.issueTaskId === issueTaskId
          ? { ...task, expanded: !task.expanded }
          : task
      )
    );
  };

  const navigateToTaskDetail = (task: any) => {
    router.push({
      pathname: "/pages/productOut/detail",
      params: task,
    });
  };

  const [test1, setTest1] = useState([]);

  const fetchData = async () => {
    // NativeTestModule.showLoading("loading");

    try {
      const response = await getUnfinishedTask();
      console.log("请求成功，响应数据:", response.data);
      setTasks(
        response.data.map((t: any, index: number) => {
          return Object.assign(t, { expanded: index === 0 });
        })
      );
    } catch (error) {
      console.error("获取出库记录失败:");
      console.error("错误详情:", error);
    }

    // NativeTestModule.hideLoading();
  };

  useEffect(() => {
    // 先运行API测试，然后获取数据
    // const initializeData = async () => {
    //   await testApiConnection();
    //   await testDifferentMethods();
    //   await fetchData();
    // };

    // initializeData();
    fetchData();
  }, []);

  return (
    <AnimatedBackground
      source={require("../../../assets/images/background2.png")}
      duration={600}
    >
      <View style={styles.container}>
        <Text style={styles.title}>产品出库</Text>
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {tasks.length == 0 && (
            <View style={styles.noTaskContainer}>
              <Text style={styles.noTaskText}>暂无任务</Text>
            </View>
          )}
          {tasks.map((task, idx) => (
            <View key={task.issueTaskId} style={styles.taskCard}>
              <TouchableOpacity
                style={styles.taskHeader}
                onPress={() => toggleTaskExpansion(task.issueTaskId)}
              >
                <Text style={styles.taskTitle}>{tasks.length - idx}</Text>
                <Text style={styles.expandIcon}>
                  {task.expanded ? "▲" : "▼"}
                </Text>
              </TouchableOpacity>

              {task.expanded && (
                <View style={styles.taskContent}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>订单:</Text>
                    <Text style={styles.infoValue}>{task.orderId}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>货号:</Text>
                    <Text style={styles.infoValue}>{task.productCode}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>颜色:</Text>
                    <Text style={styles.infoValue}>{task.color}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>尺码:</Text>
                    <Text style={styles.infoValue}>{task.size}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>针型:</Text>
                    <Text style={styles.infoValue}>{task.needleType}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>品名:</Text>
                    <Text style={styles.infoValue}>{task.productName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>工序:</Text>
                    <Text style={styles.infoValue}>{task.processString}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>数量:</Text>
                    <Text style={styles.infoValue}>
                      {task.outboundQuantity}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>产线:</Text>
                    <Text style={styles.infoValue}>{task.productLine}</Text>
                  </View>

                  <View style={styles.imageSection}>
                    <Text style={styles.infoLabel}>照片:</Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (task.photoPath) {
                          setPreviewImageUri(task.photoPath);
                          setShowImagePreview(true);
                        }
                      }}
                    >
                      <Image
                        source={{ uri: task.photoPath }}
                        style={styles.productImage}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateSection}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>下发日期:</Text>
                      <Text style={[styles.infoValue, { fontSize: PX.h16 }]}>
                        {task.issueTimeString}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>交货日期:</Text>
                      <Text style={[styles.infoValue, { fontSize: PX.h16 }]}>
                        {task.deliveryTimeString}
                      </Text>
                    </View>
                  </View>

                  {/* 查看详情按钮 */}
                  <TouchableOpacity
                    style={styles.detailButton}
                    onPress={() => navigateToTaskDetail(task)}
                  >
                    <Text style={styles.detailButtonText}>查看详情</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => router.replace("/menus")}
          >
            <Text style={styles.exitText}>返回主页</Text>
          </TouchableOpacity>
        </View> */}

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.returnButton, { backgroundColor: "#2563eb" }]}
            onPress={() => router.replace("/menus")}
          >
            <Text style={styles.returnButtonText}>返回主页</Text>
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
    alignItems: "center",
    paddingTop: PX.n50,
  },
  title: {
    fontFamily: "SongTi",
    fontSize: PX.h26,
    color: "#222",
    marginBottom: PX.n20,
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: PX.n20,
    width: "100%",
    marginBottom: PX.n20,
  },
  taskCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: PX.n15,
    marginBottom: PX.n15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 30,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: PX.n20,
    paddingVertical: PX.n12,
  },
  taskTitle: {
    fontSize: PX.h24,
    fontFamily: "SongTi",

    color: "#2563eb",
  },
  expandIcon: {
    fontSize: PX.h16,
    fontFamily: "SongTi",
    color: "#2563eb",
  },
  taskContent: {
    paddingHorizontal: PX.n16,
    paddingBottom: PX.n16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: PX.n4,
    // borderBottomWidth: 1,
    // borderBottomColor: "#f8f9fa",
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

    flex: 1,
    textAlign: "right",
  },
  imageSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: PX.n12,
    // borderBottomWidth: 1,
    // borderBottomColor: "#f8f9fa",
  },
  productImage: {
    width: PX.n30 * 2,
    height: PX.n30 * 2,
    borderRadius: PX.n8,
    backgroundColor: "#f0f0f0",
    marginLeft: "auto",
  },
  dateSection: {
    marginTop: PX.n10,
    paddingTop: PX.n15,
    borderTopWidth: 2,
    borderTopColor: "#e3f2fd",
  },
  btnContainer: {
    width: "50%",
    marginBottom: PX.n32,
    borderRadius: PX.n25,
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    // shadowOpacity: 0.3,
    // shadowRadius: 4.65,
    // elevation: 8,
  },
  btn: {
    borderRadius: PX.n25,
    alignItems: "center",
    paddingVertical: PX.n18,
    paddingHorizontal: PX.n24,
  },
  btnText: {
    color: "#fff",
    fontSize: PX.h24,

    letterSpacing: 2,
  },
  detailButton: {
    backgroundColor: "#4F8EF7",
    borderRadius: PX.n20,
    paddingVertical: PX.n10,
    // paddingHorizontal: PX.n10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: PX.n15,
    shadowColor: "#4F8EF7",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    width: "auto",
    marginHorizontal: "24%",
  },
  detailButtonText: {
    color: "#fff",
    fontSize: PX.h18,
    fontFamily: "SongTi",
  },

  buttonContainer: {
    // paddingHorizontal: PX.n20,
    paddingHorizontal: PX.n20,
    paddingVertical: PX.n12,
    paddingBottom: PX.n50 + 8,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    width: "100%",
    // borderWidth: 2,
    // borderColor: "transparent",
    // borderTopColor: "#fff000",

    // shadowColor: "#000",
    // shadowOffset: {
    //   width: -20,
    //   height: -2,
    // },
    // shadowOpacity: 1,
    // shadowRadius: 8,
    // elevation: 1,
  },
  returnButton: {
    borderRadius: PX.n30,
    paddingVertical: PX.pv8,
    paddingHorizontal: PX.n32,
    // minWidth: 120,
    alignItems: "center",
  },
  returnButtonText: {
    color: "#ffffff",
    fontSize: PX.h20,
    fontFamily: "SongTi",

    letterSpacing: 1,
  },
  noTaskContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: PX.n50 * 2,
  },
  noTaskText: {
    //
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
