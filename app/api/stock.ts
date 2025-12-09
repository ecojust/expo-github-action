import { postPayload, postFormdata, getFormdata, get } from "./axios";

export const getStockList = (data: {
  productCode: string;
  color: string;
  size: string;
  needleType: string;
  productName: string;
  orderId: string;
  pageNumber: number;
  pageSize: number;
}) => {
  return getFormdata(
    "/api/app/inventory-management/inventory-management-list",
    data
  );
};

// export const getStockListByProcess = (data: {
//   productCode: string;
//   orderId: string;
//   color: string;
//   size: string;
//   needleType: string;
//   productName: string;
//   pageNumber: number;
//   pageSize: number;
//   processCode: string;
// }) => {
//   console.log("getStockListByProcess", data);
//   return get(
//     "/api/app/inventory-management/inventory-management-list-by-process",
//     data
//   );
// };

export const getStockListByProcess = (data: {
  productCode: string;
  productName: string;
  color: string;
  size: string;
  needleType: string;
  pageNumber: number;
  pageSize: number;
  processArray: string[];
  orderId: string;
}) => {
  console.log("getStockListByProcess", data);

  const single = {
    productCode: data.productCode,
    productName: data.productName,
    color: data.color,
    size: data.size,
    needleType: data.needleType,
    pageNumber: data.pageNumber,
    pageSize: data.pageSize,
    orderId: data.orderId,
  };

  let arr = "";
  data.processArray.forEach((p) => {
    arr += `processArray=${p}&`;
  });

  return get(
    `/api/app/inventory-management/inventory-management-list-by-process?${arr}`,
    single
  );
};

export const getStockOptions = (data: { productCode: string }) => {
  return get("/api/app/product-information/product-info-dictionary", data);
};
