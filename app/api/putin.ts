import { postPayload, postFormdata, getFormdata, get } from "./axios";

export const getPutInStorageRecordLog = (data: {
  pageNumber: number;
  pageSize: number;
}) => {
  return getFormdata(
    "/api/app/put-in-storage-records/put-in-storage-record",
    data
  );
};

export const putInStorageRecord = (data: {
  productCode: String;
  color: String;
  size: String;
  needleType: String;
  productName: String;
  photoPath: String;
  putInboundQuantity: Number;
  storageCode: String;
  processAndProductLineList: {
    processCode: String;
    productLineCode: String;
  }[];
}) => {
  console.log("putInStorageRecord", data);
  return postPayload(
    "/api/app/put-in-storage-records/put-in-storage-record",
    //@ts-ignore
    Object.assign(data, { operator: "iii" })
  );
};

export const putInStorageRecordAdd = (data: {
  storageCode: string;
  productId: number;
  putInboundQuantity: number;
  photoPath?: string;
}) => {
  console.log("putinStorageRecordadd", data);
  return postPayload(
    "/api/app/put-in-storage-records/ed-put-in-storage-record",
    //@ts-ignore
    Object.assign({}, data, { operator: "iii" })
  );
};

export const productProcessDetail = (data: { productProcessId: number }) => {
  return get(
    "/api/app/product-information/product-process-detail",
    //@ts-ignore
    data
  );
};

export const detectProduct = (data: {
  productCode: String;
  color: String;
  size: String;
  needleType: String;
  productName: String;
  //
  productProcessId: number;
  //
  processes: string[];
}) => {
  return get(
    "/api/app/product-information/product-process-detail",
    //@ts-ignore
    data
  );
};

export const getProductLineByProcess = (data: {
  processArray: string[];
  pageSize: number;
  pageNumber: number;
}) => {
  const single = {
    pageNumber: data.pageNumber,
    pageSize: data.pageSize,
  };

  let arr = "";
  data.processArray.forEach((p) => {
    arr += `processArray=${p}&`;
  });
  if (data.processArray.length == 0) {
    arr += `processArray=`;
  }

  return get(
    `/api/app/production-line/production-line-by-process?${arr}`,
    single
  );
};

export const detectProductProcesses = (data: {
  productProcessId: null | string | number;
  //
  productCode: string;
  productName: string;
  color: string;
  size: string;
  needleType: string;
  //
  processArray: string[];

  orderId?: string;
}) => {
  const single = {
    productProcessId: data.productProcessId,
    productCode: data.productCode,
    productName: data.productName,
    color: data.color,
    size: data.size,
    needleType: data.needleType,
    orderId: data.orderId || "",
  };

  let arr = "";
  data.processArray.forEach((p) => {
    arr += `processArray=${p}&`;
  });

  return get(
    `/api/app/product-information/check-product-is-exists?${arr}`,
    single
  );
};
