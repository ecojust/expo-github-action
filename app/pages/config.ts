import { Dimensions, PixelRatio } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// 设计稿基准尺寸 (通常以iPhone 6/7/8的375px作为基准)
const designWidth = 375;

// 计算缩放比例 - 基于屏幕宽度
const widthScale = screenWidth / designWidth;

// 获取像素密度
const pixelRatio = PixelRatio.get();

// 最终的缩放比例
// 使用PixelRatio.getFontScale()来考虑用户的字体缩放设置
const fontScale = PixelRatio.getFontScale();

// 综合缩放比例：基于屏幕宽度，但限制最大最小值避免极端情况
export const scale = Math.min(Math.max(widthScale, 0.8), 2.0);

// 字体专用缩放（考虑用户字体设置）
export const fontSizeScale = Math.min(
  Math.max(widthScale / fontScale, 0.8),
  1.5
);

console.log("Screen:", screenWidth, "x", screenHeight);
console.log("Scale:", scale);
console.log("Font Scale:", fontSizeScale);

// 字体大小 - 使用字体专用缩放
export const h40 = 40 * fontSizeScale;
export const h38 = 38 * fontSizeScale;
export const h36 = 36 * fontSizeScale;
export const h34 = 34 * fontSizeScale;
export const h32 = 32 * fontSizeScale;
export const h30 = 30 * fontSizeScale;
export const h28 = 28 * fontSizeScale;
export const h26 = 26 * fontSizeScale;
export const h24 = 24 * fontSizeScale;
export const h22 = 22 * fontSizeScale;
export const h20 = 20 * fontSizeScale;
export const h18 = 18 * fontSizeScale;
export const h16 = 16 * fontSizeScale;
export const h14 = 14 * fontSizeScale;
export const h12 = 12 * fontSizeScale;
export const h10 = 10 * fontSizeScale;

// 内边距 - 使用普通缩放
export const pv4 = 4 * scale;
export const pv6 = 6 * scale;
export const pv8 = 8 * scale;
export const pv10 = 10 * scale;
export const pv12 = 12 * scale;

// 外边距 - 使用普通缩放
export const mv4 = 4 * scale;
export const mv6 = 6 * scale;
export const mv8 = 8 * scale;
export const mv10 = 10 * scale;
export const mv12 = 12 * scale;

// 通用尺寸 - 使用普通缩放
export const n0 = 0 * scale;

export const n1 = 1 * scale;
export const n2 = 2 * scale;
export const n3 = 3 * scale;
export const n4 = 4 * scale;
export const n5 = 5 * scale;
export const n6 = 6 * scale;
export const n7 = 7 * scale;
export const n8 = 8 * scale;
export const n9 = 9 * scale;
export const n10 = 10 * scale;
export const n11 = 11 * scale;
export const n12 = 12 * scale;
export const n13 = 13 * scale;
export const n14 = 14 * scale;
export const n15 = 15 * scale;
export const n16 = 16 * scale;
export const n17 = 17 * scale;
export const n18 = 18 * scale;
export const n19 = 19 * scale;
export const n20 = 20 * scale;
export const n21 = 21 * scale;
export const n22 = 22 * scale;
export const n23 = 23 * scale;
export const n24 = 24 * scale;
export const n25 = 25 * scale;
export const n26 = 26 * scale;
export const n27 = 27 * scale;
export const n28 = 28 * scale;
export const n29 = 29 * scale;
export const n30 = 30 * scale;
export const n31 = 31 * scale;
export const n32 = 32 * scale;
export const n33 = 33 * scale;
export const n34 = 34 * scale;
export const n35 = 35 * scale;
export const n36 = 36 * scale;
export const n37 = 37 * scale;
export const n38 = 38 * scale;
export const n39 = 39 * scale;
export const n40 = 40 * scale;
export const n41 = 41 * scale;
export const n42 = 42 * scale;
export const n43 = 43 * scale;
export const n44 = 44 * scale;
export const n45 = 45 * scale;
export const n46 = 46 * scale;
export const n47 = 47 * scale;
export const n48 = 48 * scale;
export const n49 = 49 * scale;
export const n50 = 50 * scale;

export const n160 = 160 * scale;

// 工具函数
export const scaleSize = (size: number) => size * scale;
export const scaleFontSize = (size: number) => size * fontSizeScale;

// 设备信息
export const deviceInfo = {
  screenWidth,
  screenHeight,
  scale,
  fontSizeScale,
  isSmallScreen: screenWidth < 350,
  isLargeScreen: screenWidth > 400,
  pixelRatio,
};
