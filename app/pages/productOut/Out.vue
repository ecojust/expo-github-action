<template>
  <div class="out-page">
    <el-card>
      <el-scrollbar wrap-style="height: calc(100vh - 475px)">
        <el-table
          v-loading="loading"
          border
          :data="tableData"
          style="width: 100%"
        >
          <el-table-column type="index" fixed />

          <el-table-column prop="productCode" label="货号" width="120">
            <!-- <template #default="scope">
            {{ scope.row.productInformation.productCode }}
          </template> -->
          </el-table-column>
          <el-table-column prop="color" label="颜色" width="80">
            <!-- <template #default="scope">
            {{ scope.row.productInformation.color }}
          </template> -->
          </el-table-column>
          <el-table-column prop="size" label="尺码" width="80">
            <!-- <template #default="scope">
            {{ scope.row.productInformation.size }}
          </template> -->
          </el-table-column>
          <el-table-column prop="productName" label="品名" width="120">
            <!-- <template #default="scope">
            {{ scope.row.productInformation.productName }}
          </template> -->
          </el-table-column>
          <el-table-column prop="processString" label="工序" width="100">
            <!-- <template #default="scope">
            {{ scope.row.productInformation.processString }}
          </template> -->
          </el-table-column>
          <el-table-column
            prop="outboundQuantity"
            label="出库数量"
            width="120"
          />
          <el-table-column prop="productLine" label="产线" width="120">
            <!-- <template #default="scope">
            {{ scope.row.productInformation.productLineString }}
          </template> -->
          </el-table-column>
          <el-table-column prop="issueTimeString" label="下发时间">
            <!-- <template #default="scope">
            {{ scope.row.productInformation.creationTime }}
          </template> -->
          </el-table-column>
          <el-table-column
            prop="deliveryTimeString"
            label="交付时间"
            width="180"
          >
            <!-- <template #default="scope">
            {{ scope.row.productInformation.creationTimeString }}
          </template> -->
          </el-table-column>
          <el-table-column fixed="right" label="操作" width="120">
            <template #default="scope">
              <el-button
                type="success"
                size="small"
                @click="viewDetail(scope.row)"
                >查看</el-button
              >
            </template>
          </el-table-column>
        </el-table>
      </el-scrollbar>
    </el-card>

    <!-- 出库详情弹窗，两列布局 -->
    <el-dialog
      v-model="detailVisible"
      class="out-details"
      title="出库详情"
      width="600px"
    >
      <el-scrollbar wrap-style="height:300px">
        <div style="width: 540px">
          <el-form :model="detailData" label-width="110px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="货号：">{{
                  detailData.productCode
                }}</el-form-item>
                <el-form-item label="颜色：">{{
                  detailData.color
                }}</el-form-item>
                <el-form-item label="尺码：">{{
                  detailData.size
                }}</el-form-item>
                <el-form-item label="产线：">{{
                  detailData.productLine
                }}</el-form-item>
                <el-form-item label="日期：">{{
                  detailData.deliveryTimeString
                }}</el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="品名：">{{
                  detailData.productName
                }}</el-form-item>
                <el-form-item label="针型：">{{
                  detailData.needleType
                }}</el-form-item>
                <el-form-item label="工序：">{{
                  detailData.processString
                }}</el-form-item>

                <el-form-item label="照片：">
                  <img
                    v-if="detailData.photo"
                    :src="detailData.photo"
                    alt="产品照片"
                    style="max-width: 100px"
                  />
                  <span v-else>无</span>
                </el-form-item>

                <el-form-item label="总出库数量：">{{
                  detailData.outboundQuantity
                }}</el-form-item>

                <el-form-item :style="caculStyle" label="实际出库数：">{{
                  actualOutboundQuantity
                }}</el-form-item>
              </el-col>
            </el-row>

            <el-table border :data="table2Data" style="width: 100%">
              <el-table-column prop="storage" label="库位" width="100" />
              <el-table-column prop="stockQuantity" label="库存数" />
              <el-table-column prop="issueQuantity" label="下发出库数" />
              <el-table-column prop="actualQuantity" label="实际出库">
                <!-- <template #default="scope">
              <el-input-number
                v-model="scope.row.actualQuantity"
                :min="0"
                :max="detailData.outboundQuantity"
                @change="numChange"
                size="small"
              />
            </template> -->
              </el-table-column>
            </el-table>
          </el-form>
        </div>
      </el-scrollbar>
      <el-divider></el-divider>

      <el-form
        :model="outStorageDetail"
        ref="formRef"
        label-width="100px"
        class="filter-form"
        style="max-width: 600px; margin: 24px auto"
      >
        <el-row v-for="(item, index) in outStorageDetail.list" :key="index">
          <el-col :span="8">
            <el-input
              placeholder="请输入容器id"
              v-model="item.productProcessId"
              @input="clearPackage(item, index)"
            >
              <template #append>
                <el-button @click="packageChange(item, index)" :icon="Search" />
              </template>
            </el-input>
          </el-col>
          <el-col :span="8">
            <el-form-item label="所属库位">
              <span>{{ item.storageCode }}</span>
            </el-form-item></el-col
          >
          <el-col :span="4">
            <el-form-item label="货物数量">
              <span>{{ item.outboundQuantity }}</span>
            </el-form-item></el-col
          >

          <el-col :span="4" style="text-align: right">
            <el-button
              type="danger"
              @click="removeListItem(index)"
              v-show="outStorageDetail.list.length > 1"
              ><i class="iconfont icon-thremove"></i
            ></el-button>
          </el-col>
        </el-row>

        <div class="store-details-btn">
          <el-button @click="addListItem"
            ><i class="iconfont icon-thadd"></i>新增出库容器</el-button
          >
        </div>

        <el-divider></el-divider>

        <div :style="caculStyle">温馨提示：{{ diffmessage }}</div>
      </el-form>
      <template #footer>
        <el-button @click="detailVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!canOut" @click="confirmOut"
          >确认出库</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { onMounted, ref, onActivated, onDeactivated, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getOutStorageRecord,
  getUnfinishedTaskDetail,
  getUnfinishedTask,
  putOutList,
} from "@/api/out";
import { Search } from "@element-plus/icons-vue";
import { getPackageDetails } from "@/api/package";

// 示例数据结构，实际应由后台推送填充
const tableData = ref([]);

const outStorageDetail = ref({
  list: [],
});

const loading = ref(false);

// 示例数据结构，实际应由后台推送填充
const table2Data = ref([
  {
    productCode: "k12",
    color: "2000",
    size: "1000",
    needleType: "0",
  },
  {
    productCode: "k13",
    color: "2000",
    size: "1000",
    needleType: "2000",
  },
]);

const detailVisible = ref(false);
const detailData = ref({});
const actualQuantity = ref(0);

let timer = null;

const actualOutboundQuantity = computed(() => {
  // return table2Data.value.reduce((sum, item) => {
  //   return sum + (item.actualQuantity || 0);
  // }, 0);

  return outStorageDetail.value.list.reduce((sum, item) => {
    return sum + (item.outboundQuantity || 0);
  }, 0);
});

const caculStyle = computed(() => {
  if (
    Math.abs(actualOutboundQuantity.value - detailData.value.outboundQuantity) <
    100
  ) {
    return {
      color: "green",
    };
  } else {
    return {
      color: "red",
    };
  }
});

const diffmessage = computed(() => {
  const diff = Math.abs(
    actualOutboundQuantity.value - detailData.value.outboundQuantity
  );
  if (diff < 100) {
    return `当前出库操作数量与计划的数量相差${diff},在合理区间内`;
  } else {
    return `当前出库操作数量与计划的数量相差${diff},相差较大，建议将容器拆分之后，再进行出库操作`;
  }
});

const detailsAvaliable = computed(() => {
  if (outStorageDetail.value.list.length == 0) {
    return false;
  }
  var avaliable = true;
  outStorageDetail.value.list.forEach((l) => {
    if (!l.productProcessId || !l.storageCode || !l.outboundQuantity) {
      avaliable = false;
    }
  });
  return avaliable;
});

const canOut = computed(() => {
  if (!detailsAvaliable.value) {
    return false;
  }
  const diff = Math.abs(
    actualOutboundQuantity.value - detailData.value.outboundQuantity
  );
  if (diff < 100) {
    return true;
  } else {
    return false;
  }
});

const clearPackage = (item, index) => {
  item.outboundQuantity = 0;
  item.storageCode = "";
};

const packageChange = async (item, index) => {
  const id = item.productProcessId;
  const res = await getPackageDetails({ productProcessId: id });
  if (res.code == 200) {
    console.log("出库商品", detailData.value);

    console.log("容器商品", res.data.productInfoId);

    if (res.data.productInfoId !== detailData.value.productInfoId) {
      ElMessage({
        message: "该容器内商品与出库任务为商品不匹配",
        type: "warning",
      });
      return;
    }
    if (res.data.currentStorage.trim() == "") {
      //
      ElMessage({
        message: "该容器不在库位，请更换容器，或者手动移库",
        type: "info",
      });
    } else {
      //
      outStorageDetail.value.list[index] = {
        productProcessId: id,
        outboundQuantity: res.data.currentQuantity,
        storageCode: res.data.currentStorage,
      };
    }
  }
};

const addListItem = () => {
  outStorageDetail.value.list.push({
    productProcessId: "",
    outboundQuantity: 0,
    storageCode: "",
  });
};

const removeListItem = (index) => {
  outStorageDetail.value.list.splice(index, 1);
};

const numChange = (val) => {
  let sum = 0;
  table2Data.value.forEach((w) => {
    sum += w.actualQuantity;
  });
  actualQuantity.value = sum;
};

const viewDetail = async (row) => {
  detailData.value = { ...row };
  actualQuantity.value = row.outboundQuantity || 0;

  outStorageDetail.value.list = [];

  const res = await getUnfinishedTaskDetail({
    productId: row.productInfoId,
    issueTaskId: row.issueTaskId,
  });
  if (res.code == 200) {
    table2Data.value = res.data;
  } else {
    table2Data.value = [];
  }
  detailVisible.value = true;
};

const confirmOut = () => {
  // console.log()

  // 弹出二次确认
  ElMessageBox.confirm("请核对出库数据是否正确", "确认出库", {
    confirmButtonText: "确认",
    cancelButtonText: "返回",
    type: "warning",
    draggable: true,
  })
    .then(async () => {
      console.log("detailData", detailData.value);
      const res = await putOutList({
        productInfoId: Number(detailData.value.productInfoId),
        outboundTaskId: Number(detailData.value.issueTaskId),
        outStorageDetail: outStorageDetail.value.list.map((w) => {
          return {
            outboundQuantity: w.outboundQuantity,
            storageCode: w.storageCode,
            productProcessId: w.productProcessId,
          };
        }),
      });

      if (res.code == 200) {
        ElMessage.success(
          `货号 ${detailData.value.productCode} 实际出库 ${actualQuantity.value}`
        );
        detailVisible.value = false;
      } else {
        ElMessage.error(res.message);
      }
    })
    .catch(() => {
      // 用户点击返回，无需操作
    });
};

const getOutStorageRecordList = async () => {
  const fn = async () => {
    // tableData.value = [];
    loading.value = true;
    const res = await getUnfinishedTask({
      pageNumber: 1,
      pageSize: 10,
    });
    tableData.value = res.data;
    loading.value = false;
  };
  if (timer) {
    clearInterval(timer);
  }
  fn();
  timer = setInterval(() => {
    fn();
  }, 10000);
};

onDeactivated(() => {
  clearInterval(timer);
});

onActivated(() => {
  getOutStorageRecordList();
});

onMounted(async () => {
  getOutStorageRecordList();
});
</script>

<style lang="less">
.out-page {
  /* 可自定义样式 */
  .el-card {
    height: calc(100vh - 150px);
  }
  .out-details {
    .el-form-item {
      margin-bottom: 4px;
    }
  }
}
</style>
