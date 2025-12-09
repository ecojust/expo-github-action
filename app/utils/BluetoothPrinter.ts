import { BluetoothDevice } from "react-native-bluetooth-classic";
import BluetoothService from "./BluetoothService";

export interface PrinterCommands {
  // ESC/POS 命令常量
  ESC: string;
  INIT: string;
  FEED_LINE: string;
  CUT_PAPER: string;
  ALIGN_LEFT: string;
  ALIGN_CENTER: string;
  ALIGN_RIGHT: string;
  TEXT_SIZE_NORMAL: string;
  TEXT_SIZE_DOUBLE_HEIGHT: string;
  TEXT_SIZE_DOUBLE_WIDTH: string;
  TEXT_SIZE_DOUBLE: string;
  TEXT_BOLD_ON: string;
  TEXT_BOLD_OFF: string;
}

export class BluetoothPrinter {
  private static instance: BluetoothPrinter;
  private bluetoothService: BluetoothService;

  // ESC/POS 打印机命令
  private commands: PrinterCommands = {
    ESC: "\x1B",
    INIT: "\x1B\x40",
    FEED_LINE: "\x0A",
    CUT_PAPER: "\x1D\x56\x00",
    ALIGN_LEFT: "\x1B\x61\x00",
    ALIGN_CENTER: "\x1B\x61\x01",
    ALIGN_RIGHT: "\x1B\x61\x02",
    TEXT_SIZE_NORMAL: "\x1B\x21\x00",
    TEXT_SIZE_DOUBLE_HEIGHT: "\x1B\x21\x10",
    TEXT_SIZE_DOUBLE_WIDTH: "\x1B\x21\x20",
    TEXT_SIZE_DOUBLE: "\x1B\x21\x30",
    TEXT_BOLD_ON: "\x1B\x45\x01",
    TEXT_BOLD_OFF: "\x1B\x45\x00",
  };

  private constructor() {
    this.bluetoothService = BluetoothService.getInstance();
  }

  static getInstance(): BluetoothPrinter {
    if (!BluetoothPrinter.instance) {
      BluetoothPrinter.instance = new BluetoothPrinter();
    }
    return BluetoothPrinter.instance;
  }

  // 连接打印机
  async connectToPrinter(device: BluetoothDevice): Promise<boolean> {
    try {
      const connected = await this.bluetoothService.connectToDevice(device);
      if (connected) {
        // 初始化打印机
        await this.sendCommand(this.commands.INIT);
        console.log("打印机连接并初始化成功");
        return true;
      }
      return false;
    } catch (error) {
      console.error("连接打印机失败:", error);
      return false;
    }
  }

  // 断开打印机连接
  async disconnect(): Promise<boolean> {
    return await this.bluetoothService.disconnect();
  }

  // 发送原始命令
  private async sendCommand(command: string): Promise<boolean> {
    return await this.bluetoothService.sendData(command);
  }

  // 打印文本
  async printText(text: string): Promise<boolean> {
    try {
      const success = await this.sendCommand(text + this.commands.FEED_LINE);
      return success;
    } catch (error) {
      console.error("打印文本失败:", error);
      return false;
    }
  }

  // 打印居中文本
  async printCenterText(text: string): Promise<boolean> {
    try {
      await this.sendCommand(this.commands.ALIGN_CENTER);
      const success = await this.printText(text);
      await this.sendCommand(this.commands.ALIGN_LEFT);
      return success;
    } catch (error) {
      console.error("打印居中文本失败:", error);
      return false;
    }
  }

  // 打印右对齐文本
  async printRightText(text: string): Promise<boolean> {
    try {
      await this.sendCommand(this.commands.ALIGN_RIGHT);
      const success = await this.printText(text);
      await this.sendCommand(this.commands.ALIGN_LEFT);
      return success;
    } catch (error) {
      console.error("打印右对齐文本失败:", error);
      return false;
    }
  }

  // 打印粗体文本
  async printBoldText(text: string): Promise<boolean> {
    try {
      await this.sendCommand(this.commands.TEXT_BOLD_ON);
      const success = await this.printText(text);
      await this.sendCommand(this.commands.TEXT_BOLD_OFF);
      return success;
    } catch (error) {
      console.error("打印粗体文本失败:", error);
      return false;
    }
  }

  // 打印大字体文本
  async printLargeText(text: string): Promise<boolean> {
    try {
      await this.sendCommand(this.commands.TEXT_SIZE_DOUBLE);
      const success = await this.printText(text);
      await this.sendCommand(this.commands.TEXT_SIZE_NORMAL);
      return success;
    } catch (error) {
      console.error("打印大字体文本失败:", error);
      return false;
    }
  }

  // 打印分割线
  async printSeparator(
    char: string = "-",
    length: number = 32
  ): Promise<boolean> {
    const separator = char.repeat(length);
    return await this.printText(separator);
  }

  // 打印空行
  async printNewLine(lines: number = 1): Promise<boolean> {
    try {
      for (let i = 0; i < lines; i++) {
        await this.sendCommand(this.commands.FEED_LINE);
      }
      return true;
    } catch (error) {
      console.error("打印空行失败:", error);
      return false;
    }
  }

  // 切纸
  async cutPaper(): Promise<boolean> {
    try {
      await this.sendCommand(this.commands.CUT_PAPER);
      return true;
    } catch (error) {
      console.error("切纸失败:", error);
      return false;
    }
  }

  // 打印收据示例
  async printReceipt(data: {
    title: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    date?: string;
  }): Promise<boolean> {
    try {
      // 打印标题
      await this.printCenterText("=".repeat(32));
      await this.printCenterText(data.title);
      await this.printCenterText("=".repeat(32));
      await this.printNewLine();

      // 打印日期
      if (data.date) {
        await this.printText(`日期: ${data.date}`);
        await this.printNewLine();
      }

      // 打印商品列表
      await this.printText("商品明细:");
      await this.printSeparator();

      for (const item of data.items) {
        const line = `${item.name} x${item.quantity}`;
        const price = `¥${item.price.toFixed(2)}`;
        const spaces = 32 - line.length - price.length;
        await this.printText(line + " ".repeat(Math.max(1, spaces)) + price);
      }

      await this.printSeparator();

      // 打印总计
      const totalLine = "总计:";
      const totalPrice = `¥${data.total.toFixed(2)}`;
      const totalSpaces = 32 - totalLine.length - totalPrice.length;
      await this.printBoldText(
        totalLine + " ".repeat(Math.max(1, totalSpaces)) + totalPrice
      );

      await this.printNewLine(2);
      await this.printCenterText("谢谢惠顾!");
      await this.printNewLine(3);

      // 切纸
      await this.cutPaper();

      return true;
    } catch (error) {
      console.error("打印收据失败:", error);
      return false;
    }
  }

  // 检查打印机连接状态
  isConnected(): boolean {
    return this.bluetoothService.isConnected();
  }

  // 获取连接的设备
  getConnectedDevice(): BluetoothDevice | null {
    return this.bluetoothService.getConnectedDevice();
  }
}

export default BluetoothPrinter.getInstance();
