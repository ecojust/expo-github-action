<template>
  <div class="package-split">
    <el-card>
      <el-scrollbar wrap-style="height: calc(100vh - 190px)">
        <div class="content">
          <!-- 容器ID输入区域 -->
          <div class="package-id-section">
            <div class="input-container">
              <el-input
                v-model="packageId"
                placeholder="请输入容器id"
                size="large"
                class="package-input"
                @keyup.enter="handleSearch"
              >
                <template #append>
                  <el-button @click="handleSearch" :loading="searchLoading">
                    搜索
                  </el-button>
                </template>
              </el-input>
            </div>
          </div>

          <!-- 产品信息展示区域 -->
          <div v-if="productInfo.productCode" class="product-info-section">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">货号：</span>
                <span class="value">{{ productInfo.productCode }}</span>
              </div>
              <div class="info-item">
                <span class="label">品名：</span>
                <span class="value">{{ productInfo.productName }}</span>
              </div>
              <div class="info-item">
                <span class="label">颜色：</span>
                <span class="value">{{ productInfo.color }}</span>
              </div>
              <div class="info-item">
                <span class="label">针型：</span>
                <span class="value">{{ productInfo.needleType }}</span>
              </div>
              <div class="info-item">
                <span class="label">尺码：</span>
                <span class="value">{{ productInfo.size }}</span>
              </div>
              <div class="info-item">
                <span class="label">工序：</span>
                <span class="value">{{ productInfo.finishedProcess }}</span>
              </div>
              <div class="info-item">
                <span class="label">库位：</span>
                <span class="value">{{ currentLocation }}</span>
              </div>
            </div>
          </div>

          <!-- 拆封操作区域 -->
          <div v-if="productInfo.productCode" class="split-section">
            <div class="split-container">
              <!-- 总数量 -->
              <div class="quantity-card total-quantity">
                <div class="card-header">总数量</div>
                <div class="quantity-display">
                  {{ productInfo.totalQuantity }}
                </div>
              </div>

              <!-- 箭头 -->
              <div class="arrow-container">
                <el-icon class="split-arrow" size="40">
                  <ArrowRight />
                </el-icon>
              </div>

              <!-- 移出信息 -->
              <div class="quantity-card split-quantity">
                <div class="card-header">拆分至新容器数量</div>
                <div class="quantity-input">
                  <el-input-number
                    v-model="splitQuantity"
                    :min="1"
                    :max="productInfo.totalQuantity"
                    style="width: 100%"
                  />
                </div>
                <div class="new-package-section">
                  <div class="card-header">移出容器id</div>
                  <div class="new-package-id">
                    <el-input
                      v-model="inProductProcessId"
                      placeholder="如果不填写，系统会自动生成新的容器id"
                    ></el-input>
                  </div>
                </div>
              </div>
            </div>

            <!-- 拆封按钮 -->
            <div class="split-actions">
              <el-button
                type="primary"
                size="large"
                @click="handleSplit"
                :loading="splitLoading"
                :disabled="
                  !splitQuantity || splitQuantity >= productInfo.totalQuantity
                "
              >
                确认拆分
              </el-button>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </el-card>

    <!-- 二维码打印弹窗 -->
    <el-dialog
      v-model="qrCodeDialogVisible"
      title="新容器二维码标识"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="qrcode-dialog-content">
        <!-- 容器ID突出显示 -->
        <div class="package-id-highlight">
          <div class="package-id-label">新容器ID</div>
          <div class="package-id-value">{{ qrCodeData.packageId }}</div>
        </div>

        <div class="qrcode-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">货号：</span>
              <span class="value">{{ qrCodeData.productCode }}</span>
            </div>
            <div class="info-item">
              <span class="label">颜色：</span>
              <span class="value">{{ qrCodeData.color }}</span>
            </div>
            <div class="info-item">
              <span class="label">尺码：</span>
              <span class="value">{{ qrCodeData.size }}</span>
            </div>
            <div class="info-item">
              <span class="label">针型：</span>
              <span class="value">{{ qrCodeData.needleType }}</span>
            </div>
            <div class="info-item">
              <span class="label">品名：</span>
              <span class="value">{{ qrCodeData.productName }}</span>
            </div>
            <div class="info-item">
              <span class="label">工序：</span>
              <span class="value">{{ qrCodeData.finishedProcess }}</span>
            </div>
          </div>
        </div>

        <div class="qrcode-section">
          <div class="qrcode-container">
            <img
              v-if="qrCodeDataURL"
              :src="qrCodeDataURL"
              alt="产品二维码"
              class="qrcode-img"
            />
            <div v-else class="qrcode-loading">生成二维码中...</div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeQrCodeDialog">取消</el-button>
          <el-button
            type="primary"
            @click="printQRCode"
            :disabled="!qrCodeDataURL"
          >
            打印
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowRight } from "@element-plus/icons-vue";
import QRCode from "qrcode";
import printJS from "print-js";

import {
  getPackageDetails,
  packageMerge,
  packageSplit,
  getPrePackagerId,
} from "@/api/package";

// 页面状态
const packageId = ref("");
const searchLoading = ref(false);
const splitLoading = ref(false);

// 产品信息
const productInfo = ref({
  productCode: "",
  productName: "",
  color: "",
  needleType: "",
  size: "",
  processName: "",
  processCode: "",
  totalQuantity: 0,
});

// 库位信息
const currentLocation = ref("");

// 拆封相关
const splitQuantity = ref(200);
const inProductProcessId = ref("");

// 二维码弹窗相关
const qrCodeDialogVisible = ref(false);
const qrCodeDataURL = ref("");
const qrCodeData = ref({
  packageId: "",
  productCode: "",
  color: "",
  size: "",
  needleType: "",
  productName: "",
  finishedProcess: "",
});

// 搜索容器信息
const handleSearch = async () => {
  if (!packageId.value.trim()) {
    ElMessage.error("请输入容器ID");
    return;
  }

  searchLoading.value = true;
  try {
    const res = await getPackageDetails({ productProcessId: packageId.value });
    if (res.code == 200) {
      productInfo.value = {
        productCode: res.data.productCode,
        productName: res.data.productName,
        color: res.data.color,
        needleType: res.data.needleType,
        size: res.data.size,
        finishedProcess: res.data.finishedProcess,
        totalQuantity: res.data.currentQuantity,
      };
      currentLocation.value = res.data.currentStorage;
      splitQuantity.value = 1;
    }

    ElMessage.success("查询成功");
  } catch (error) {
    console.error("查询失败:", error);
    ElMessage.error("查询失败，请重试");
  } finally {
    searchLoading.value = false;
  }
};

const newID = ref("");

// 执行拆封
const handleSplit = async () => {
  if (!splitQuantity.value || splitQuantity.value <= 0) {
    ElMessage.error("请输入有效的移出数量");
    return;
  }

  if (splitQuantity.value >= productInfo.value.totalQuantity) {
    ElMessage.error("移出数量不能大于等于总数量");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确认从容器 ${packageId.value} 中移出 ${splitQuantity.value} 件？`,
      "确认拆封",
      {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    splitLoading.value = true;

    if (inProductProcessId.value) {
      const inproduct = await getPackageDetails({
        productProcessId: inProductProcessId.value,
      });

      if (res.code != 200) {
        ElMessage.warning("目标容器不存在");
        return;
      }

      if (productInfo.value.productInfoId !== inproduct.data.productInfoId) {
        ElMessage.warning("目标容器物品与当前容器物品不一致");
        return;
      }

      const res = await packageMerge({
        outProductProcessId: packageId.value,
        inProductProcessId: inProductProcessId.value,
        quantity: splitQuantity.value,
      });
      console.log("res", res.data);

      ElMessage.success(res.message);
      handleSearch();
    } else {
      const res = await getPrePackagerId();
      showQrCodeDialog(res.data.id);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("拆封失败:", error);
      ElMessage.error("拆封失败，请重试");
    }
  } finally {
    splitLoading.value = false;
  }
};

const newIdSplit = async () => {
  //
  const res = await packageSplit({
    productProcessId: packageId.value,
    quantity: splitQuantity.value,
  });
  const newId = res.data.id;

  console.log("res", newId);
  ElMessage.success(res.message);
  handleSearch();

  // 显示新容器的二维码
};

// 显示二维码打印弹窗
const showQrCodeDialog = (newId) => {
  // 设置二维码数据
  Object.assign(qrCodeData.value, {
    packageId: newId,
    productCode: productInfo.value.productCode,
    color: productInfo.value.color,
    size: productInfo.value.size,
    needleType: productInfo.value.needleType,
    productName: productInfo.value.productName,
    finishedProcess: productInfo.value.finishedProcess,
  });

  // 显示弹窗并生成二维码
  qrCodeDialogVisible.value = true;
  generateQRCode(newId);
};

// 生成二维码
const generateQRCode = async (newId) => {
  try {
    const qrData = {
      tag: "packageQRCode",
      id: newId,
      productCode: qrCodeData.value.productCode,
      color: qrCodeData.value.color,
      size: qrCodeData.value.size,
      needleType: qrCodeData.value.needleType,
      productName: qrCodeData.value.productName,
    };

    // 将数据转换为JSON字符串
    const qrString = JSON.stringify(qrData, null, 2);

    // 生成二维码
    const qrCodeURL = await QRCode.toDataURL(qrString, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    qrCodeDataURL.value = qrCodeURL;
  } catch (error) {
    console.error("生成二维码失败:", error);
    ElMessage.error("生成二维码失败");
  }
};

// 打印二维码
const printQRCode = () => {
  if (!qrCodeDataURL.value) {
    ElMessage.warning("二维码未生成，无法打印");
    return;
  }

  try {
    // 创建打印内容 - 只显示居中的二维码
    const printContent = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw;">
        <img src="${qrCodeDataURL.value}" alt="二维码" style="width: 500px; height: 500px;" />
      </div>
    `;

    // 使用 print.js 打印
    printJS({
      printable: printContent,
      type: "raw-html",
      style: `
        @media print {
          body { margin: 0; }
          .print-content {
            width: 100%;
            max-width: none;
          }
        }
      `,
      scanStyles: false,
      targetStyles: ["*"],
    });

    newIdSplit();

    ElMessage.success("正在打印二维码标签...");
  } catch (error) {
    console.error("打印失败:", error);
    ElMessage.error("打印失败，请检查打印机设置");
  }
};

// 关闭二维码弹窗
const closeQrCodeDialog = () => {
  qrCodeDialogVisible.value = false;
  qrCodeDataURL.value = "";
  Object.assign(qrCodeData.value, {
    packageId: "",
    productCode: "",
    color: "",
    size: "",
    needleType: "",
    productName: "",
    finishedProcess: "",
  });
};

onMounted(() => {
  // 初始化时可以做一些准备工作
});
</script>

<style lang="less" scoped>
.package-split {
  text-align: center;
  .content {
    max-width: 600px;
    margin: 0 auto;
  }

  // 容器ID输入区域
  .package-id-section {
    margin-bottom: 40px;
    text-align: center;

    .input-container {
      display: inline-block;
      width: 100%;
      max-width: 500px;
    }
  }

  // 产品信息展示区域
  .product-info-section {
    margin-bottom: 40px;
    padding: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;

      .info-item {
        display: flex;
        align-items: center;

        .label {
          font-weight: 500;
          color: #606266;
          min-width: 60px;
        }

        .value {
          color: #303133;
          font-weight: 600;
        }
      }
    }
  }

  // 拆封操作区域
  .split-section {
    .split-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 30px;
      gap: 20px;

      .quantity-card {
        flex: 1;
        padding: 30px 20px;
        border: 3px solid #409eff;
        border-radius: 12px;
        background-color: #e6f3ff;
        text-align: center;

        .card-header {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 20px;
        }

        &.total-quantity {
          .quantity-display {
            font-size: 32px;
            font-weight: bold;
            padding: 20px;
            border-radius: 6px;
          }
        }

        &.split-quantity {
          .quantity-input {
            margin-bottom: 20px;

            :deep(.el-input-number) {
              .el-input__inner {
                font-size: 18px;
                text-align: center;
              }
            }
          }

          .new-package-section {
            .card-header {
              font-size: 14px;
              margin-bottom: 10px;
            }

            .new-package-id {
              font-size: 20px;
              font-weight: bold;
              padding: 10px;
              border-radius: 6px;
            }
          }
        }
      }

      .arrow-container {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .split-arrow {
          color: #409eff;
          font-weight: bold;
        }
      }
    }

    .split-actions {
      text-align: center;

      .el-button {
        padding: 12px 40px;
        font-size: 16px;
        font-weight: 600;
      }
    }
  }

  // 二维码弹窗样式
  .qrcode-dialog-content {
    padding: 20px;

    // 容器ID突出显示
    .package-id-highlight {
      text-align: center;
      margin-bottom: 24px;
      padding: 20px;
      background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);

      .package-id-label {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 8px;
        font-weight: 500;
      }

      .package-id-value {
        font-size: 24px;
        font-weight: bold;
        color: #ffffff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        letter-spacing: 1px;
      }
    }

    .qrcode-info {
      margin-bottom: 24px;

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;

        .info-item {
          display: flex;
          align-items: center;

          .label {
            font-weight: 500;
            color: #606266;
            min-width: 60px;
            margin-right: 8px;
          }

          .value {
            color: #303133;
            font-weight: 500;
            flex: 1;
          }
        }
      }
    }

    .qrcode-section {
      padding: 16px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      border: 2px solid #409eff;
      text-align: center;

      .qrcode-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;

        .qrcode-img {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          background: white;
        }

        .qrcode-loading {
          color: #909399;
          font-size: 14px;
        }
      }
    }
  }
}
</style>
