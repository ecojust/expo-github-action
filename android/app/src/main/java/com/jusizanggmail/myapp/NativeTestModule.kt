package com.jusizanggmail.myapp

import android.os.Build
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.bridge.Arguments

import com.gengcon.www.jcprintersdk.JCPrintApi;
import com.gengcon.www.jcprintersdk.callback.Callback;
import com.gengcon.www.jcprintersdk.callback.PrintCallback;

import com.jusizanggmail.myapp.utils.PrintUtil;
import com.jusizanggmail.myapp.utils.PrintData;

import java.util.HashMap;
import android.app.Dialog;
import android.view.Window;
import android.view.WindowManager;
import android.widget.TextView;
import android.widget.ProgressBar;
import android.widget.LinearLayout;
import android.view.Gravity;
import android.graphics.Color;

class NativeTestModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var loadingDialog: Dialog? = null

    override fun getName(): String {
        return "NativeTestModule"
    }

    @ReactMethod
    fun hello(promise: Promise) {
        try {
            val message = "Hello from Android native module! 🤖"
            promise.resolve(message)
        } catch (e: Exception) {
            promise.reject("HELLO_ERROR", "Failed to get hello message", e)
        }
    }

    @ReactMethod
    fun setOptions(options: ReadableMap, promise: Promise) {
        try {
            // 处理选项设置
            val optionsMap = options.toHashMap()
            println("Native module received options: $optionsMap")
            promise.resolve("Options set successfully")
        } catch (e: Exception) {
            promise.reject("SET_OPTIONS_ERROR", "Failed to set options", e)
        }
    }

    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        try {
            val deviceInfo = Arguments.createMap()
            deviceInfo.putString("model", Build.MODEL)
            deviceInfo.putString("brand", Build.BRAND)
            deviceInfo.putString("version", Build.VERSION.RELEASE)
            deviceInfo.putString("manufacturer", Build.MANUFACTURER)
            deviceInfo.putString("device", Build.DEVICE)
            deviceInfo.putInt("sdkInt", Build.VERSION.SDK_INT)
            
            promise.resolve(deviceInfo)
        } catch (e: Exception) {
            promise.reject("DEVICE_INFO_ERROR", "Failed to get device info", e)
        }
    }

    @ReactMethod
    fun showToast(message: String, promise: Promise) {
        try {
            val activity = currentActivity
            if (activity != null) {
                activity.runOnUiThread {
                    val toast = android.widget.Toast.makeText(activity, message, android.widget.Toast.LENGTH_SHORT)
                    // 设置 Toast 显示在屏幕上方
                    toast.setGravity(Gravity.TOP or Gravity.CENTER_HORIZONTAL, 0, 100)
                    toast.show()
                }
                promise.resolve("Toast shown successfully")
            } else {
                promise.reject("TOAST_ERROR", "Activity not available")
            }
        } catch (e: Exception) {
            promise.reject("TOAST_ERROR", "Failed to show toast", e)
        }
    }

    @ReactMethod
    fun showLoading(message: String, promise: Promise) {
        try {
            val activity = currentActivity
            if (activity != null) {
                activity.runOnUiThread {
                    // 如果已经有 loading 在显示，先隐藏
                    loadingDialog?.dismiss()
                    
                    // 创建自定义的满屏 Dialog
                    loadingDialog = Dialog(activity).apply {
                        requestWindowFeature(Window.FEATURE_NO_TITLE)
                        setCancelable(false)
                        
                        // 创建布局
                        val layout = LinearLayout(activity).apply {
                            orientation = LinearLayout.VERTICAL
                            gravity = Gravity.CENTER
                            setBackgroundColor(Color.parseColor("#00000000")) // 纯透明背景
                            setPadding(50, 50, 50, 50)
                        }
                        
                        // 添加进度条
                        val progressBar = ProgressBar(activity).apply {
                            layoutParams = LinearLayout.LayoutParams(
                                LinearLayout.LayoutParams.WRAP_CONTENT,
                                LinearLayout.LayoutParams.WRAP_CONTENT
                            ).apply {
                                setMargins(0, 0, 0, 30)
                            }
                        }
                        layout.addView(progressBar)
                        
                        // 添加文字
                        val textView = TextView(activity).apply {
                            text = message
                            textSize = 16f
                            setTextColor(Color.WHITE)
                            gravity = Gravity.CENTER
                            layoutParams = LinearLayout.LayoutParams(
                                LinearLayout.LayoutParams.WRAP_CONTENT,
                                LinearLayout.LayoutParams.WRAP_CONTENT
                            )
                        }
                        layout.addView(textView)
                        
                        setContentView(layout)
                        
                        // 设置窗口属性为全屏
                        window?.let { window ->
                            window.setLayout(
                                WindowManager.LayoutParams.MATCH_PARENT,
                                WindowManager.LayoutParams.MATCH_PARENT
                            )
                            window.setFlags(
                                WindowManager.LayoutParams.FLAG_FULLSCREEN,
                                WindowManager.LayoutParams.FLAG_FULLSCREEN
                            )
                        }
                        
                        show()
                    }
                }
                promise.resolve("Loading shown successfully")
            } else {
                promise.reject("LOADING_ERROR", "Activity not available")
            }
        } catch (e: Exception) {
            promise.reject("LOADING_ERROR", "Failed to show loading", e)
        }
    }

    @ReactMethod
    fun hideLoading(promise: Promise) {
        try {
            val activity = currentActivity
            if (activity != null) {
                activity.runOnUiThread {
                    loadingDialog?.dismiss()
                    loadingDialog = null
                }
                promise.resolve("Loading hidden successfully")
            } else {
                promise.reject("LOADING_ERROR", "Activity not available")
            }
        } catch (e: Exception) {
            promise.reject("LOADING_ERROR", "Failed to hide loading", e)
        }
    }

    @ReactMethod
    fun connectPrinter(address: String, promise: Promise) {
        try {
            val ret = PrintUtil.connectBluetoothPrinter(address)
            promise.resolve("$ret")
        } catch (e: Exception) {
            promise.reject("PRINTER_CONNECT_ERROR", "Failed to connect to printer", e)
        }
    }

    @ReactMethod
    fun close(promise: Promise) {
        try {
            PrintUtil.close()
            promise.resolve("Printer close")
        } catch (e: Exception) {
            promise.reject("PRINTER_CLOSE_ERROR", "Failed to close ", e)
        }
    }

    @ReactMethod
    fun connectAndPrintQrCode(address: String, printType:String, data:String, promise: Promise) {
        try {
            // 检查连接状态并连接打印机
            //PrintUtil.close()

            if (PrintUtil.isConnection() != 0) {
                PrintUtil.connectBluetoothPrinter(address)
                //promise.reject("No connectedDevice", "Please connect first")
                //return
            }

            var isPromiseResolved = false
      
            // 打印份数
            val copies = 1 
            // 打印浓度 B50/B50W/T6/T7/T8 建议设置6或8，Z401/B32建议设置8，B3S/B21/B203/B1建议设置3
            val printDensity = 3
            // 标签类型，固定值1
            val labelType = 1
            // 打印模式 1或者2
            val printMode = 1
            // 打印倍率（分辨率） 除B32/Z401/T8的printMultiple为11.81，其他的为8
            val multiple = 8.0f


            //promise.resolve("getPrintData 123")


            // 使用 PrintData 类获取打印数据
            val printData = PrintData.getPrintData(copies, printType, multiple, data)
            //promise.resolve("getPrintData $printType")

            val jsonList = ArrayList<String>()
            val infoList = ArrayList<String>()
            if (printData != null) {
                val length = printData[0].size
                //android.util.Log.d("NativeTestModule", "printLabel: $length")
                for (i in 0 until length) {
                    jsonList.add(printData[0][i])
                    infoList.add(printData[1][i])
                }
            } else {
                promise.reject("PRINT_DATA_ERROR", "Failed to generate print data")
                return
            }
            //promise.resolve("$jsonList")



            PrintUtil.startLabelPrintJob(copies, printDensity, labelType, printMode, jsonList, infoList, object : PrintCallback {
                override fun onProgress(pageIndex: Int, quantityIndex: Int, hashMap: HashMap<String, Any>) {
                    android.util.Log.d("NativeTestModule", "测试：打印进度:已打印到第: $pageIndex")
                    // 打印完成时 resolve promise (注意：pageIndex 通常从1开始)
                    if (pageIndex >= copies && !isPromiseResolved) {
                        isPromiseResolved = true
                        promise.resolve("success")
                    }
                }

                override fun onError(i: Int) {
                    // 处理错误
                    if (!isPromiseResolved) {
                        isPromiseResolved = true
                        promise.reject("PRINT_ERROR", "Print error occurred: $i")
                    }
                }

                override fun onError(errorCode: Int, printState: Int) {
                    // 处理错误
                    if (!isPromiseResolved) {
                        isPromiseResolved = true
                        promise.reject("PRINT_ERROR", "Print error - Code: $errorCode, State: $printState")
                    }
                }

                override fun onCancelJob(isSuccess: Boolean) {
                    // 取消打印成功回调
                    if (isSuccess && !isPromiseResolved) {
                        isPromiseResolved = true
                        promise.reject("PRINT_CANCELLED", "Print job was cancelled")
                    }
                }

                override fun onBufferFree(pageIndex: Int, bufferSize: Int) {
                    // 缓冲区释放回调
                }
            })

            // 不在这里立即 resolve，而是等待打印完成或出错
            android.util.Log.d("NativeTestModule", "Print job started at: $address")
        } catch (e: Exception) {
            promise.reject("PRINTER_CONNECT_ERROR", "Failed to connect and print", e)
        }
    }

    @ReactMethod
    fun printQRcode(text: String, promise: Promise) {
        try {
            // 调用打印机SDK打印文本
            // 这里需要根据实际的AAR包API来调用
            // 示例调用（需要根据实际API调整）
            val result = "Text printed: $text"
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("PRINT_ERROR", "Failed to print text", e)
        }
    }

    @ReactMethod
    fun printText(text: String, promise: Promise) {
        try {
            // 调用打印机SDK打印文本
            // 这里需要根据实际的AAR包API来调用
            // 示例调用（需要根据实际API调整）
            val result = "Text printed: $text"
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("PRINT_ERROR", "Failed to print text", e)
        }
    }

    
}