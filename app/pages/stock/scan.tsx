import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AnimatedBackground from "../../components/AnimatedBackground";

import * as PX from "@/app/pages/config";
export default function Scan() {
  const router = useRouter();
  return (
    <AnimatedBackground
      source={require("../../../assets/images/background2.png")}
      duration={600}
    >
      <View style={styles.container}>
        <Text style={styles.title}>扫描输入</Text>

        <TouchableOpacity
          style={styles.exitBtn}
          onPress={() => router.replace("/pages/stock")}
        >
          <Text style={styles.exitText}>返回上页</Text>
        </TouchableOpacity>
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: PX.n40,
  },
  title: {
    fontSize: PX.h26,

    color: "#222",
    marginBottom: PX.n160,
    textAlign: "center",
  },
  btn: {
    width: "50%",
    borderRadius: PX.n16,
    borderWidth: 2,
    borderColor: "#2563eb",
    alignItems: "center",
    marginBottom: PX.n32,
    backgroundColor: "#f7faff",
    paddingVertical: PX.n18,
    paddingHorizontal: PX.n24,
  },
  btnText: {
    color: "#2563eb",
    fontSize: PX.h24,

    letterSpacing: 2,
  },
  exitBtn: {
    position: "absolute",
    bottom: 40,
    backgroundColor: "#2563eb",
    borderRadius: PX.n30,
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
    paddingVertical: PX.n12,
    paddingHorizontal: PX.n36,
  },
  exitText: {
    color: "#fff",
    fontSize: PX.h22,

    letterSpacing: 2,
  },
});
