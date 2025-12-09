import {
  postPayload,
  postFormdata,
  getFormdata,
  postQuery,
  del,
  put,
  get,
} from "./axios";

export const getPackageDetails = (data: { productProcessId: String }) => {
  return get("/api/app/product-information/product-process-detail", data);
};

export const packageSplit = (data: {
  productProcessId: String;
  quantity: Number;
}) => {
  return postPayload("/api/app/product-information/unpack-the-bag", data);
};

export const packageMerge = (data: {
  outProductProcessId: String;
  inProductProcessId: String;
  quantity: Number;
}) => {
  return postPayload("/api/app/product-information/combine-the-bag", data);
};

export const packagerRelocation = (data: {
  productProcessId: number;
  remark: String;
  fromStorage: String;
  putInStorageCode: String;
}) => {
  return postPayload("/api/app/transfer-order/product-relocation", data);
};

export const getPrePackagerId = () => {
  return get("/api/app/product-information/pre-product-process-id");
};

export const getPackageList = (data: {
  productCode: string;
  productName: string;
  color: string;
  size: string;
  needleType: string;
  processArray: string[];
  pageNumber: number;
  pageSize: number;
}) => {
  const single = {
    productCode: data.productCode,
    productName: data.productName,
    color: data.color,
    size: data.size,
    needleType: data.needleType,
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
    `/api/app/product-information/product-process-list?${arr}`,
    single
  );
};
