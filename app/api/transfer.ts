import { postPayload, postFormdata, getFormdata, get } from "./axios";

export const transferOrder = (data: {
  productCode: string;
  color: string;
  size: string;
  needleType: string;
  productName: string;
  processCode: string;
  putInStorageCode: string;
  outStorageCode: string;
  quantity: number;
}) => {
  return postPayload(
    "/api/app/transfer-order/transfer-order",
    Object.assign(data, { operator: "a", isTransferred: true })
  );
};
