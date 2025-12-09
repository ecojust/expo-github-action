import {
  postPayload,
  postFormdata,
  getFormdata,
  postQuery,
  get,
} from "./axios";

export const getProductionLine = (data: {
  pageNumber: number;
  pageSize: number;
}) => {
  return getFormdata("/api/app/production-line/production-line", data);
};

export const getStorageRule = (data: {
  preFix: string;
  pageNumber: number;
  pageSize: number;
}) => {
  return get("/api/app/storage-information/storage-rule-detail", data);
};

export const getStorage = (data: { pageNumber: number; pageSize: number }) => {
  return getFormdata("/api/app/storage-information/storage-information", data);
};

export const getProcess = (data: { pageNumber: number; pageSize: number }) => {
  return getFormdata("/api/app/process-info/process-info", data);
};

export const getNeedle = (data: { pageNumber: number; pageSize: number }) => {
  return getFormdata(
    "/api/app/needle-type-information/needle-type-information",
    data
  );
};

export const getSize = (data: { pageNumber: number; pageSize: number }) => {
  return getFormdata("/api/app/size-information/size-information", data);
};

export const uploadFile = (data: FormData) => {
  return postFormdata("/api/File/UploadFile", data);
};

export const getUploadUrl = () => {
  const host = process.env.EXPO_PUBLIC_API_URL || "http://218.90.252.27:50000";
  return `${host}/api/File/UploadFile`;
};

export const uploadFile2 = (data: FormData) => {
  const d = new FormData();
  d.append("name", "123");
  return postFormdata("/uploadfile", d);
};

export const findProduct = (data: { id: string; qrCode?: string }) => {
  console.log("findProduct", data);
  return getFormdata("/api/app/product-information/product-information", data);
};
