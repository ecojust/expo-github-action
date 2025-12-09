import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import AnimatedBackground from "../../components/AnimatedBackground";

import * as PX from "@/app/pages/config";
export default function OrderForward() {
  const router = useRouter();

  // 模拟订单数据
  const order = {
    id: 1,
    title: "转发订单1",
    productCode: "253758745212872116",
    color: "红色",
    process: "容器工序",
    plannedProduction: "10000",
    actualProduction: "8000",
    forwardedOrder: "2000",
  };

  return (
    <AnimatedBackground
      source={require("../../../assets/images/background2.png")}
      duration={600}
    >
      <View style={styles.container}>
        <Text style={styles.title}>{order.title}</Text>

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View key={order.id} style={styles.orderCard}>
            {/* <Text style={styles.orderTitle}>{order.title}</Text> */}

            <View style={styles.orderInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>货号:</Text>
                <Text style={styles.infoValue}>{order.productCode}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>颜色:</Text>
                <Text style={styles.infoValue}>{order.color}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>工序:</Text>
                <Text style={styles.infoValue}>{order.process}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>计划生产:</Text>
                <Text style={styles.infoValue}>{order.plannedProduction}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>实际生产:</Text>
                <Text style={styles.infoValue}>{order.actualProduction}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>转出订单:</Text>
                <Text style={styles.infoValue}>{order.forwardedOrder}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* 底部按钮 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.returnButton, { backgroundColor: "#dbdbdb" }]}
            onPress={() => router.back()}
          >
            <Text style={styles.returnButtonText}>返回上页</Text>
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
    fontSize: PX.h28,
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
  orderTitle: {
    fontSize: PX.h24,
    fontFamily: "SongTi",
    color: "#333",
    textAlign: "center",
    marginBottom: PX.n20,
    paddingVertical: PX.n10,
    backgroundColor: "#f8f9fa",
    borderRadius: PX.n8,
  },
  orderInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: PX.n8,
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
    paddingBottom: PX.n50,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
  },
  returnButton: {
    borderRadius: PX.n30,
    paddingVertical: PX.n12,
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
});
