import {
  postPayload,
  postFormdata,
  getFormdata,
  postQuery,
  del,
  put,
} from "./axios";

export const addProductLine = (data: FormData) => {
  return postPayload("/api/app/production-line/production-line", data);
};

export const delProductLine = (data: FormData) => {
  return del("/api/app/production-line/production-line", data);
};

export const updateProductLine = (data: FormData) => {
  return put("/api/app/production-line/production-line", data);
};

export const getProductLine = (data: FormData) => {
  return getFormdata("/api/app/production-line/production-line", data);
};
