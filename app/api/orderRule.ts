import { postPayload, postFormdata, getFormdata, del, put, get } from "./axios";

export const getOrderNumberRule = (data: {
  pageNumber: number;
  pageSize: number;
}) => {
  return getFormdata("/api/app/order-number-rule/order-number-rule", data);
};

export const delOrderNumberRule = (data: { id: number }) => {
  return del("/api/app/order-number-rule/order-number-rule", data);
};

export const updateOrderNumberRule = (data: {
  id: number;
  ruleId: string;
  prefix: string;
  orderType: string;
  format: string;
  description: string;
  example: string;
  suffix: string;
}) => {
  return put("/api/app/order-number-rule/order-number-rule", data);
};

export const addOrderNumberRule = (data: {
  ruleId: string;
  prefix: string;
  orderType: string;
  format: string;
  description: string;
  example: string;
  suffix: string;
}) => {
  return postPayload("/api/app/order-number-rule/order-number-rule", data);
};

export const getRuleList = (data: {}) => {
  return get("/api/app/order-number-rule/rule-list", data);
};

export const generateOrderId = (data: { ruleId: number }) => {
  return get("/api/app/order-number-rule/random-order-number", data);
};

export const getRuleOrderList = (data: { prefix: string }) => {
  return get("/api/app/order-number-rule/order-number-list", data);
};
