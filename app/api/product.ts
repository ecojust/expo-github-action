import {
  postPayload,
  postFormdata,
  getFormdata,
  postQuery,
  del,
  put,
} from "./axios";

export const getProduct = (data: {
  productCode: String;
  color: String;
  size: String;
  needleType: String;
  productName: String;
  processCode: String;
  pageNumber: number;
  pageSize: number;
}) => {
  return getFormdata(
    "/api/app/product-information/product-information-list",
    data
  );
};
