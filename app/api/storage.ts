import { postPayload, postFormdata, getFormdata, del, put } from "./axios";

export const getStorage = (data: { pageNumber: number; pageSize: number }) => {
  return getFormdata("/api/app/storage-information/storage-information", data);
};

export const delStorage = (data: { id: number }) => {
  return del("/api/app/storage-information/storage-information", data);
};

export const updateStorage = (data: {
  id: number;
  name: string;
  location: string;
  capacity: number;
}) => {
  return put("/api/app/storage-information/storage-information", data);
};

export const addStorage = (data: {
  name: string;
  location: string;
  capacity: number;
}) => {
  return postPayload("/api/app/storage-information/storage-information", data);
};
