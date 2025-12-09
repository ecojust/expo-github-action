import {
  postPayload,
  postFormdata,
  getFormdata,
  postQuery,
  del,
  put,
} from "./axios";

export const addBinding = (data: FormData) => {
  return postPayload("/api/app/phone-bindings/phone-binding", data);
};

export const getBinding = (data: { pageNumber: number; pageSize: number }) => {
  return getFormdata("/api/app/phone-bindings/phone-binding", data);
};

export const deleteBinding = (data: { id: number }) => {
  return del("/api/app/phone-bindings/phone-binding", data);
};

export const updateBinding = (data: {
  id: number;
  phoneMac: string;
  printerMac: string;
}) => {
  return put("/api/app/phone-bindings/phone-binding", data);
};
