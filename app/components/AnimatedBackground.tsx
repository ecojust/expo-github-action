import React, { useEffect, useRef } from "react";
import { ImageBackground, Animated, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";

import {
  h10,
  h12,
  h14,
  h16,
  h18,
  h20,
  h22,
  h24,
  h26,
  h28,
  h30,
  h32,
  h34,
  h36,
} from "@/app/pages/config";
interface AnimatedBackgroundProps {
  children: React.ReactNode;
  source: any;
  duration?: number;
}

export default function AnimatedBackground({
  children,
  source,
  duration = 800,
}: AnimatedBackgroundProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const d = 0;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: d,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, d]);

  return (
    <ImageBackground
      source={source}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {children}
        <StatusBar style="auto" />
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    // borderBlockColor: "black",
    // borderWidth: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
  },
});
