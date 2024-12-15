import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://20.28.50.23",
  withCredentials: true,
});

export default axiosInstance;
