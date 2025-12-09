import {
  postPayload,
  postFormdata,
  getFormdata,
  postQuery,
  del,
  put,
} from "./axios";

export const addProcess = (data: FormData) => {
  return postPayload("/api/app/process-info/process-info", data);
};

export const deleteProcess = (data: { id: number }) => {
  return del("/api/app/process-info/process-info", data);
};

export const updateProcess = (data: {
  id: number;
  code: string;
  name: string;
}) => {
  return put("/api/app/process-info/process-info", data);
};

export const getProcess = (data: { pageNumber: number; pageSize: number }) => {
  return getFormdata("/api/app/process-info/process-info", data);
};
