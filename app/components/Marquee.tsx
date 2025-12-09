import type { Ref } from "react";
import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Easing,
  findNodeHandle,
  PixelRatio,
  ScrollView,
  UIManager,
  View,
  ViewProps,
} from "react-native";

export interface MarqueeProps<T> extends ViewProps {
  /**
   * 滚动数据
   */
  data: T[];
  /**
   * 渲染函数
   */
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * 滚动速度（单位：像素/秒）
   */
  speed?: number;
  /**
   * 是否循环播放滚动动画
   */
  loop?: boolean;
  /**
   * 动画开始前的延迟时间（毫秒）
   */
  delay?: number;
  /**
   * 是否垂直滚动，默认为水平滚动
   */
  isVertical?: boolean;
}

export interface MarqueeHandles {
  start: () => void; // 启动滚动动画方法
  stop: () => void; // 停止滚动动画方法
}

/**
 * 创建动画配置（支持循环和连续动画）
 * @param animValue 动画值对象
 * @param config 动画配置（目标值、持续时间、是否循环、延迟时间）
 * @returns 组合动画对象
 */
const createAnim = (
  animValue: Animated.Value,
  config: {
    toValue: number;
    duration: number;
    loop: boolean;
    delay: number;
  }
): Animated.CompositeAnimation => {
  // 动画（线性缓动，原生驱动）
  const anim = Animated.timing(animValue, {
    easing: Easing.linear,
    useNativeDriver: true,
    ...config,
  });

  if (config.loop) {
    // 循环（动画完成后延迟1秒重复）
    return Animated.loop(Animated.sequence([anim]));
  }

  return anim; // 单次动画
};

// 跑马灯组件实现
const Marquee = <T,>(
  props: MarqueeProps<T>,
  ref: Ref<MarqueeHandles> // 暴露给父组件的句柄引用
) => {
  // 解构组件属性（带默认值）
  const {
    style,
    data,
    renderItem,
    speed = 1, // 默认速度1像素/秒
    loop = true, // 默认循环播放
    delay = 0, // 默认无延迟
    isVertical = false,
    children, // 子组件内容
    ...restProps // 其他传递属性
  } = props;

  // 状态：是否正在动画中
  const [isRunning, setIsRunning] = useState<boolean>(false);
  // 缓存：容器宽度（初始为null）
  const outWidth = useRef<number | null>(null);
  // 缓存：容器高度（初始为null）
  const outHeight = useRef<number | null>(null);
  // 缓存：跑马灯内容实际宽度（初始为null）
  const innerViewWidth = useRef<number | null>(null);
  // 缓存：跑马灯内容实际高度（初始为null）
  const innerViewHeight = useRef<number | null>(null);
  // 动画值（控制跑马灯内容水平位移）
  const animatedValue = useRef<Animated.Value>(new Animated.Value(0));
  // 跑马灯内容引用（用于测量宽度）
  const innerRef = useRef<typeof Animated.View & View>(null);
  // 滚动容器引用（用于测量容器宽度）
  const outRef = useRef<ScrollView>(null);
  // 动画实例引用（用于控制启动/停止）
  const animRef = useRef<Animated.CompositeAnimation>(null);
  // 配置缓存（避免重复读取props）
  const conf = useRef<{
    speed: number;
    loop: boolean;
    delay: number;
  }>({
    speed,
    loop,
    delay,
  });

  // 停止动画方法
  const stopAnim = useCallback(() => {
    setIsRunning(false); // 更新状态
    clearSize(); // 清空尺寸缓存（下次需要重新测量）
  }, []);

  // 启动动画方法（核心逻辑）
  const startAnim = useCallback(async (): Promise<void> => {
    stopAnim();

    setIsRunning(true); // 标记动画开始

    await calSize(); // 计算容器和内容的实际宽度

    // 计算需要滚动的距离（内容宽度的一半，因为内容重复了一次）
    let distance = 0;
    // 计算动画时长（根据速度和距离）
    let animDuration = 0;

    if (!isVertical) {
      if (!outWidth.current || !innerViewWidth.current) {
        // 如果宽度缓存未获取到（测量失败）
        return;
      }
      distance = innerViewWidth.current / 2;
      if (distance < outWidth.current) {
        // 内容宽度小于容器宽度，不需要滚动
        return;
      }
      // 计算动画时长（根据速度和距离）
      animDuration =
        PixelRatio.getPixelSizeForLayoutSize(innerViewWidth.current) /
        conf.current.speed;
    } else {
      if (!outHeight.current || !innerViewHeight.current) {
        // 如果高度缓存未获取到（测量失败）
        return;
      }
      distance = innerViewHeight.current / 2;
      if (distance < outHeight.current) {
        // 内容高度小于容器高度，不需要滚动
        return;
      }
      // 计算动画时长（根据速度和距离）
      animDuration =
        PixelRatio.getPixelSizeForLayoutSize(innerViewHeight.current) /
        conf.current.speed;
    }

    // 创建动画配置（使用循环模式）
    animRef.current = createAnim(animatedValue.current, {
      ...conf.current,
      toValue: -distance, // 目标位移（向左/下滚动内容宽度的一半）
      duration: animDuration, // 动画时长
    });

    // 启动动画（无完成回调）
    animRef.current.start((): void => {});
  }, [isVertical]);

  // 暴露命令式句柄给父组件（start/stop方法）
  useImperativeHandle(ref, () => {
    return {
      start: () => {
        startAnim().then(); // 调用启动方法
      },
      stop: () => {
        stopAnim(); // 调用停止方法
      },
    };
  });

  // 副作用：当isStart变化或子组件更新时触发
  useEffect(() => {
    stopAnim(); // 先停止现有动画
    startAnim().then(); // 重新启动动画
  }, [children, startAnim, stopAnim]); // 依赖子组件和动画方法

  // 测量容器和内容宽度的核心方法（异步）
  const calSize = async (): Promise<void> => {
    try {
      // 如果容器或内容引用不存在则返回
      if (!outRef.current || !innerRef.current) {
        return;
      }

      // 通用测量函数（通过UIManager获取组件宽度）
      const measureWidth = (component: ScrollView | View): Promise<number[]> =>
        new Promise((resolve) => {
          UIManager.measure(
            findNodeHandle(component) as number, // 获取组件节点句柄
            (_x: number, _y: number, w: number, h: number) => {
              // 测量回调（返回宽度w和高度h）
              return resolve([w, h]); // 解析宽高
            }
          );
        });

      // 并行测量容器宽度和内容宽度和高度
      const [oWidth, oHeight, iWidth, iHeight] = await Promise.all([
        ...(await measureWidth(outRef.current)), // 容器宽度和高度
        ...(await measureWidth(innerRef.current)), // 内容实际宽度和高度
      ]);

      // 缓存测量结果
      outWidth.current = oWidth;
      outHeight.current = oHeight;
      innerViewWidth.current = iWidth;
      innerViewHeight.current = iHeight;
    } catch (error) {
      console.error(error);
    }
  };

  // 清空尺寸缓存（用于动画停止后重新测量）
  const clearSize = () => {
    outWidth.current = null;
    outHeight.current = null;
    innerViewWidth.current = null;
    innerViewHeight.current = null;
  };

  // 组件渲染结构
  return (
    <View style={[{ overflow: "hidden" }, style]}>
      <ScrollView
        ref={outRef} // 绑定容器引用
        showsHorizontalScrollIndicator={false} // 隐藏水平滚动条
        showsVerticalScrollIndicator={false} // 隐藏垂直滚动条
        horizontal={!isVertical} // 水平滚动
        scrollEnabled={false} // 禁用用户手动滚动
        onContentSizeChange={startAnim}
      >
        <Animated.View
          ref={innerRef} // 绑定内容引用
          {...restProps} // 传递其他属性
          style={[
            {
              display: "flex",
              flexDirection: isVertical ? "column" : "row", // 子元素横向排列（使内容重复显示）
              transform: [
                isVertical
                  ? { translateY: animatedValue.current }
                  : { translateX: animatedValue.current },
              ], // 应用水平位移动画
              opacity: isRunning ? 1 : 0, // 动画时显示，停止时隐藏
            },
            isVertical ? { height: "100%" } : { width: "100%" },
          ]}
        >
          {data.map((item, index) => (
            <View key={index}>{renderItem(item, index)}</View>
          ))}
          {data.map((item, index) => (
            <View key={index + data.length}>{renderItem(item, index)}</View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

// 导出带ref的组件（支持命令式调用）
export default React.forwardRef<MarqueeHandles, MarqueeProps<any>>(Marquee);
