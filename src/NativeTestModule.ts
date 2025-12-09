import { NativeModules } from "react-native";

interface DeviceInfo {
  model: string;
  brand: string;
  version: string;
  manufacturer: string;
  device: string;
  sdkInt: number;
}

interface PrinterStatus {
  status: string;
  model: string;
  isReady: boolean;
}

interface NativeTestModuleInterface {
  hello(): Promise<string>;
  setOptions(options: Record<string, any>): Promise<string>;
  getDeviceInfo(): Promise<DeviceInfo>;
  showToast(message: string): Promise<string>;

  // 打印机相关方法
  initPrinter(): Promise<string>;
  printText(text: string): Promise<string>;
  getPrinterStatus(): Promise<PrinterStatus>;
  connectPrinter(address: string): Promise<string>;
  connectAndPrintQrCode(
    address: string,
    type: string,
    content: string
  ): Promise<string>;
}

const { NativeTestModule } = NativeModules;

export default NativeTestModule as NativeTestModuleInterface;
export type { DeviceInfo, PrinterStatus };
