import { postPayload, postFormdata, getFormdata, postQuery } from "./axios";

export const login = (data: { userName: string; password: string }) => {
  return postPayload("/api/UserInfo/UserLogIn", data);
};

export const loginFace = (data: FormData) => {
  return postFormdata("/api/UserInfo/UserLogInByFace", data);
};

export const loginFaceUrl = () => {
  const host = process.env.EXPO_PUBLIC_API_URL || "http://218.90.252.27:50000";
  return `${host}/api/UserInfo/UserLogInByFace`;
};
