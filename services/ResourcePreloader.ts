import { Image } from "react-native";

// 资源加载器函数 - 只有在调用时才会真正加载资源
const RESOURCE_LOADERS = {
  images: {
    background: () => require("../assets/images/background.png"),
    background2: () => require("../assets/images/background2.png"),
    // icon: () => require("../assets/images/icon.png"),
    // adaptive: () => require("../assets/images/adaptive.png"),
    // favicon: () => require("../assets/images/favicon.png"),
    // splash: () => require("../assets/images/splash.png"),
    // reactLogo: () => require("../assets/images/react-logo.png"),
    // partialReactLogo: () => require("../assets/images/partial-react-logo.png"),
  },
  icons: {
    putin: () => require("../assets/icons/putin.png"),
    out: () => require("../assets/icons/out.png"),
    search: () => require("../assets/icons/search.png"),
    print: () => require("../assets/icons/print.png"),
    productTransfer: () => require("../assets/icons/transfer.png"),
    orderForward: () => require("../assets/icons/forward.png"),
  },
};

// 预加载后的资源缓存
export const PRELOAD_RESOURCES = {
  images: {} as Record<string, any>,
  icons: {} as Record<string, any>,
  sounds: {} as Record<string, any>,
};

export class ResourcePreloader {
  private static instance: ResourcePreloader;
  private preloadedResources: Set<string> = new Set();
  private preloadPromises: Promise<void>[] = [];

  static getInstance(): ResourcePreloader {
    if (!ResourcePreloader.instance) {
      ResourcePreloader.instance = new ResourcePreloader();
    }
    return ResourcePreloader.instance;
  }

  // 延迟加载并预加载所有图片资源
  private async preloadImages(): Promise<void> {
    const imagePromises: Promise<void>[] = [];
    console.log("开始延迟加载图片资源...");

    // 加载背景图片
    Object.entries(RESOURCE_LOADERS.images).forEach(([key, loader]) => {
      const promise = this.loadImageResource(key, loader, "images")
        .then(() => {
          console.log("Image preloaded:", key);
        })
        .catch((error: any) => {
          console.warn("Failed to preload image:", key, error);
        });
      imagePromises.push(promise);
    });

    // 加载菜单图标
    Object.entries(RESOURCE_LOADERS.icons).forEach(([key, loader]) => {
      const promise = this.loadImageResource(key, loader, "icons")
        .then(() => {
          console.log("Icon preloaded:", key);
        })
        .catch((error: any) => {
          console.warn("Failed to preload icon:", key, error);
        });
      imagePromises.push(promise);
    });

    await Promise.all(imagePromises);
    this.preloadedResources.add("images");
  }

  // 延迟加载单个图片资源
  private async loadImageResource(
    key: string,
    loader: () => any,
    type: "images" | "icons"
  ): Promise<void> {
    try {
      // 只有在这里才真正加载资源
      const imageSource = loader();

      // 预加载到内存
      const uri = Image.resolveAssetSource(imageSource).uri;
      await Image.prefetch(uri);

      // 存储到资源缓存中
      PRELOAD_RESOURCES[type][key] = imageSource;
    } catch (error) {
      console.warn(`Failed to load ${type} resource:`, key, error);
    }
  }

  // 延迟加载音频资源

  // 预加载所有资源
  async preloadAllResources(): Promise<void> {
    console.log("Starting lazy resource preloading...");

    this.preloadPromises = [this.preloadImages()];

    try {
      await Promise.all(this.preloadPromises);
      console.log("All resources preloaded successfully");
    } catch (error) {
      console.warn("Some resources failed to preload:", error);
    }
  }

  // 检查资源是否已预加载
  isResourcePreloaded(resourceType: string): boolean {
    return this.preloadedResources.has(resourceType);
  }

  // 检查所有资源是否已预加载
  areAllResourcesPreloaded(): boolean {
    return (
      this.preloadedResources.has("images") &&
      this.preloadedResources.has("sounds")
    );
  }

  // 获取预加载进度
  getPreloadProgress(): number {
    return this.preloadedResources.size / 2; // 2 是资源类型总数
  }

  // 获取预加载的资源
  getPreloadedResource(type: "images" | "icons" | "sounds", key: string): any {
    return PRELOAD_RESOURCES[type][key];
  }

  // 获取所有预加载的资源
  getAllPreloadedResources() {
    return PRELOAD_RESOURCES;
  }

  // 按需加载单个资源（如果还没有预加载的话）
  async loadResourceOnDemand(
    type: "images" | "icons" | "sounds",
    key: string
  ): Promise<any> {
    // 如果已经缓存了，直接返回
    if (PRELOAD_RESOURCES[type][key]) {
      return PRELOAD_RESOURCES[type][key];
    }

    // 否则按需加载
    try {
      const loader = (RESOURCE_LOADERS as any)[type][key];
      if (!loader) {
        throw new Error(`Resource loader not found for ${type}.${key}`);
      }

      const resource = loader();

      // 如果是图片，进行预加载
      if (type === "images" || type === "icons") {
        const uri = Image.resolveAssetSource(resource).uri;
        await Image.prefetch(uri);
      }

      // 缓存资源
      PRELOAD_RESOURCES[type][key] = resource;

      console.log(`Resource loaded on demand: ${type}.${key}`);
      return resource;
    } catch (error) {
      console.warn(`Failed to load resource on demand: ${type}.${key}`, error);
      throw error;
    }
  }
}
