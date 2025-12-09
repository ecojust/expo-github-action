import { postPayload, postFormdata, getFormdata, del, put, get } from "./axios";

export const transferOrderWaitConfirm = (data: {
  pageNumber: number;
  pageSize: number;
}) => {
  return get("/api/app/order-task/unconfirmed-transfer-order-task", data);
};

export const transferOrderConfirm = (data: { id: number }) => {
  return postPayload("/api/app/order-task/confirmed-transfer-order-task", data);
};
