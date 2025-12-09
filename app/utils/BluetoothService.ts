import BluetoothClassic, {
  BluetoothDevice,
} from "react-native-bluetooth-classic";
import { PermissionsAndroid, Platform } from "react-native";

export class BluetoothService {
  private static instance: BluetoothService;
  private connectedDevice: BluetoothDevice | null = null;

  private constructor() {}

  static getInstance(): BluetoothService {
    if (!BluetoothService.instance) {
      BluetoothService.instance = new BluetoothService();
    }
    return BluetoothService.instance;
  }

  // 请求蓝牙权限
  async requestBluetoothPermissions(): Promise<boolean> {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return Object.values(granted).every(
          (permission) => permission === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (error) {
        console.error("权限请求失败:", error);
        return false;
      }
    }
    return true;
  }

  // 检查蓝牙是否可用
  async isBluetoothAvailable(): Promise<boolean> {
    try {
      return await BluetoothClassic.isBluetoothAvailable();
    } catch (error) {
      console.error("检查蓝牙可用性失败:", error);
      return false;
    }
  }

  // 检查蓝牙是否已启用
  async isBluetoothEnabled(): Promise<boolean> {
    try {
      return await BluetoothClassic.isBluetoothEnabled();
    } catch (error) {
      console.error("检查蓝牙状态失败:", error);
      return false;
    }
  }

  // 启用蓝牙
  async enableBluetooth(): Promise<boolean> {
    try {
      return await BluetoothClassic.requestBluetoothEnabled();
    } catch (error) {
      console.error("启用蓝牙失败:", error);
      return false;
    }
  }

  // 获取已配对设备列表
  async getPairedDevices(): Promise<BluetoothDevice[]> {
    try {
      return await BluetoothClassic.getBondedDevices();
    } catch (error) {
      console.error("获取已配对设备失败:", error);
      return [];
    }
  }

  // 开始设备发现
  async startDiscovery(): Promise<BluetoothDevice[]> {
    try {
      return await BluetoothClassic.startDiscovery();
    } catch (error) {
      console.error("设备发现失败:", error);
      return [];
    }
  }

  // 停止设备发现
  async stopDiscovery(): Promise<boolean> {
    try {
      return await BluetoothClassic.cancelDiscovery();
    } catch (error) {
      console.error("停止设备发现失败:", error);
      return false;
    }
  }

  // 连接设备
  async connectToDevice(device: BluetoothDevice): Promise<boolean> {
    try {
      const connected = await device.connect();
      if (connected) {
        this.connectedDevice = device;
        console.log(`已连接到设备: ${device.name}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("连接设备失败:", error);
      return false;
    }
  }

  // 断开连接
  async disconnect(): Promise<boolean> {
    try {
      if (this.connectedDevice) {
        const disconnected = await this.connectedDevice.disconnect();
        if (disconnected) {
          this.connectedDevice = null;
          console.log("设备已断开连接");
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("断开连接失败:", error);
      return false;
    }
  }

  // 发送数据
  async sendData(data: string): Promise<boolean> {
    try {
      if (!this.connectedDevice) {
        throw new Error("没有连接的设备");
      }

      await this.connectedDevice.write(data);
      console.log("数据发送成功:", data);
      return true;
    } catch (error) {
      console.error("发送数据失败:", error);
      return false;
    }
  }

  // 读取数据
  async readData(): Promise<string | null> {
    try {
      if (!this.connectedDevice) {
        throw new Error("没有连接的设备");
      }

      const data = await this.connectedDevice.read();
      console.log("接收到数据:", data);
      return data;
    } catch (error) {
      console.error("读取数据失败:", error);
      return null;
    }
  }

  // 获取当前连接的设备
  getConnectedDevice(): BluetoothDevice | null {
    return this.connectedDevice;
  }

  // 检查是否已连接
  isConnected(): boolean {
    return this.connectedDevice !== null;
  }
}

export default BluetoothService.getInstance();
