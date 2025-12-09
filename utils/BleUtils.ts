/**
 * BLE工具类 - 提供简化的BLE操作方法
 * 适用于简单的BLE操作场景
 */

import BleService, { BleCharacteristic } from "../services/BleService";
import { Peripheral } from "react-native-ble-manager";
import { Alert } from "react-native";

export class BleUtils {
  private static bleService: BleService;

  /**
   * 初始化BLE工具
   */
  static async initialize(): Promise<void> {
    if (!this.bleService) {
      this.bleService = BleService.getInstance();
      await this.bleService.initialize();
    }
  }

  /**
   * 扫描并连接第一个发现的设备
   * @param deviceNameFilter 设备名称过滤器（可选）
   * @param timeout 超时时间（毫秒，默认10秒）
   * @returns 连接的设备信息
   */
  static async scanAndConnectFirst(
    deviceNameFilter?: string,
    timeout: number = 10000
  ): Promise<Peripheral | null> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      let foundDevice: Peripheral | null = null;
      let isResolved = false;

      // 设置超时
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          reject(new Error("扫描超时"));
        }
      }, timeout);

      // 设置设备发现回调
      const callbacks = {
        onDiscoverPeripheral: async (peripheral: Peripheral) => {
          if (isResolved) return;

          // 检查设备名称过滤器
          if (
            deviceNameFilter &&
            peripheral.name &&
            !peripheral.name
              .toLowerCase()
              .includes(deviceNameFilter.toLowerCase())
          ) {
            return;
          }

          // 找到设备，尝试连接
          try {
            foundDevice = peripheral;
            await this.bleService.connectPeripheral(peripheral);

            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeoutId);
              resolve(peripheral);
            }
          } catch (error) {
            console.error("连接设备失败:", error);
            // 继续扫描其他设备
          }
        },

        onStopScan: () => {
          if (!isResolved && !foundDevice) {
            isResolved = true;
            clearTimeout(timeoutId);
            resolve(null);
          }
        },
      };

      // 重新初始化服务以设置回调
      this.bleService
        .initialize(callbacks)
        .then(() => {
          this.bleService.startScan();
        })
        .catch(reject);
    });
  }

  /**
   * 发送消息到已连接的设备
   * @param message 要发送的消息
   * @param characteristicFilter 特征过滤器（可选）
   * @returns 是否发送成功
   */
  static async sendMessageToConnectedDevice(
    message: string,
    characteristicFilter?: (char: BleCharacteristic) => boolean
  ): Promise<boolean> {
    await this.initialize();

    try {
      const characteristics =
        await this.bleService.getConnectedDeviceCharacteristics();

      if (characteristics.length === 0) {
        throw new Error("没有找到设备特征");
      }

      // 选择特征
      let targetCharacteristic: BleCharacteristic;

      if (characteristicFilter) {
        const filtered = characteristics.filter(characteristicFilter);
        if (filtered.length === 0) {
          throw new Error("没有找到匹配的特征");
        }
        targetCharacteristic = filtered[0];
      } else {
        // 默认选择第一个可写特征
        const writableChar = characteristics.find(
          (c) => c.properties.Write || c.properties.WriteWithoutResponse
        );

        if (!writableChar) {
          throw new Error("没有找到可写特征");
        }

        targetCharacteristic = writableChar;
      }

      await this.bleService.sendMessage(targetCharacteristic, message);
      return true;
    } catch (error) {
      console.error("发送消息失败:", error);
      return false;
    }
  }

  /**
   * 快速发送消息（扫描、连接、发送一体化）
   * @param message 要发送的消息
   * @param deviceNameFilter 设备名称过滤器（可选）
   * @param timeout 超时时间（毫秒，默认15秒）
   * @returns 是否发送成功
   */
  static async quickSendMessage(
    message: string,
    deviceNameFilter?: string,
    timeout: number = 15000
  ): Promise<boolean> {
    try {
      // 扫描并连接设备
      const device = await this.scanAndConnectFirst(deviceNameFilter, timeout);

      if (!device) {
        Alert.alert("错误", "未找到可连接的设备");
        return false;
      }

      // 等待连接稳定
      await this.sleep(1000);

      // 发送消息
      const success = await this.sendMessageToConnectedDevice(message);

      if (success) {
        Alert.alert("成功", `消息已发送到设备: ${device.name || device.id}`);
      } else {
        Alert.alert("失败", "消息发送失败");
      }

      return success;
    } catch (error) {
      console.error("快速发送消息失败:", error);
      Alert.alert("错误", `操作失败: ${error}`);
      return false;
    }
  }

  /**
   * 获取已连接的设备列表
   */
  static async getConnectedDevices(): Promise<Peripheral[]> {
    await this.initialize();
    return this.bleService.getConnectedPeripherals();
  }

  /**
   * 断开所有设备连接
   */
  static async disconnectAllDevices(): Promise<void> {
    await this.initialize();

    const connectedDevices = await this.getConnectedDevices();

    for (const device of connectedDevices) {
      try {
        await this.bleService.disconnectPeripheral(device.id);
      } catch (error) {
        console.error(`断开设备 ${device.id} 失败:`, error);
      }
    }
  }

  /**
   * 检查蓝牙是否可用
   */
  static async isBluetoothAvailable(): Promise<boolean> {
    try {
      await this.initialize();
      return true;
    } catch (error) {
      console.error("蓝牙不可用:", error);
      return false;
    }
  }

  /**
   * 启用蓝牙
   */
  static async enableBluetooth(): Promise<boolean> {
    try {
      await this.initialize();
      await this.bleService.enableBluetooth();
      return true;
    } catch (error) {
      console.error("启用蓝牙失败:", error);
      return false;
    }
  }

  /**
   * 工具方法：延时
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 清理资源
   */
  static destroy(): void {
    if (this.bleService) {
      this.bleService.destroy();
    }
  }
}

// 导出便捷方法
export const {
  scanAndConnectFirst,
  sendMessageToConnectedDevice,
  quickSendMessage,
  getConnectedDevices,
  disconnectAllDevices,
  isBluetoothAvailable,
  enableBluetooth,
} = BleUtils;
