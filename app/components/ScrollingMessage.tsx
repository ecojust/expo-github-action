import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import Marquee from "./Marquee";

interface Message {
  content: string;
}

interface ScrollingMessageProps {
  messages: Message[];
}

const { width: screenWidth } = Dimensions.get("window");

const ScrollingMessage: React.FC<ScrollingMessageProps> = ({ messages }) => {
  const scrollX = useRef(new Animated.Value(screenWidth)).current;
  const [textWidth, setTextWidth] = useState(0);

  // 将所有消息合并成一个字符串
  let messageText =
    messages.length > 0 ? messages.map((msg) => msg.content) : [];

  if (messageText.length == 1) {
    messageText = [].concat(messageText, messageText);
  }

  useEffect(() => {
    if (messageText && textWidth > 0) {
      // 重置位置
      scrollX.setValue(screenWidth);

      // 根据文字宽度计算滚动距离和时间
      const totalDistance = screenWidth + textWidth;
      const duration = Math.max(8000, (totalDistance / screenWidth) * 4000); // 根据文字长度调整时间

      // 开始滚动动画
      const animate = () => {
        Animated.loop(
          Animated.timing(scrollX, {
            toValue: -textWidth,
            duration: duration,
            useNativeDriver: true,
          })
        ).start();
      };

      // animate();
    }
  }, [messageText, scrollX, textWidth]);

  if (messageText.length == 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Marquee
        style={{ width: screenWidth }}
        speed={0.6}
        loop={true}
        delay={0}
        isVertical={false}
        data={messageText}
        renderItem={(item: string, index: number) => (
          <View>
            <Text style={[styles.messageText]}>{item}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50, // 状态栏下方
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "rgba(37, 99, 235, 0.9)", // 使用蓝色主题
  },

  messageText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontFamily: "SongTi",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default ScrollingMessage;
