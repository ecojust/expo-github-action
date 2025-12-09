import {
  postPayload,
  postFormdata,
  getFormdata,
  postQuery,
  del,
  put,
} from "./axios";

export const addUnit = (data: FormData) => {
  return postPayload("/api/app/unit-conversion/unit-conversion", data);
};

export const deleteUnit = (data: { id: number }) => {
  return del("/api/app/unit-conversion/unit-conversion", data);
};

export const updateUnit = (data: {
  id: number;
  name: string;
  conversionRate: number;
  isEnable: number;
}) => {
  return put("/api/app/unit-conversion/unit-conversion", data);
};

export const getUnit = (data: { pageNumber: number; pageSize: number }) => {
  return getFormdata("/api/app/unit-conversion/unit-conversion", data);
};
