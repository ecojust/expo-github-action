import { postPayload, postFormdata, getFormdata, get } from "./axios";

export const getOutStorageRecord = (data: {
  pageNumber: number;
  pageSize: number;
}) => {
  return getFormdata("/api/app/out-storage-record/out-storage-record", data);
};

export const test = () => {
  return get("/?s=taskagent&c=service&m=getMiniApps");
};

export const getUnfinishedTask = () => {
  return get("/api/app/order-task/unfinished-task");
};

export const getUnfinishedTaskDetail = (data: {
  productId: string;
  issueTaskId: string;
  pageNumber: number;
  pageSize: number;
}) => {
  return get(
    "/api/app/out-storage-record/single-out-storage-record-by-task-id",
    data
  );
};

export const putOutList = (data: {
  productInfoId: number;
  outboundTaskId: number;
  outStorageDetail: Array<{
    productProcessId: number;
    outboundQuantity: number;
    storageCode: string;
  }>;
}) => {
  console.log("putOutList", data);
  return postFormdata(
    "/api/app/out-storage-record/out-storage-record-list",
    Object.assign(data, { operator: "123123" })
  );
};
