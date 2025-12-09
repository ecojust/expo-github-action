import {
  postPayload,
  postFormdata,
  getFormdata,
  postQuery,
  del,
  put,
} from "./axios";

export const getSystemLog = (data: {
  pageNumber: number;
  pageSize: number;
}) => {
  return getFormdata("/api/app/operation-log/operation-log", data);
};
