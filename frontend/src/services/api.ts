import axios from "axios";

type Zusatzdaten = Record<string, unknown>;

const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL: string =
  typeof envBaseUrl === "string" && envBaseUrl.length > 0
    ? envBaseUrl
    : "/api/";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to inject token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log("API Request Interceptor - Token:", token ? "Found" : "Missing", "URL:", config.url);
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export async function updateAkteZusatzinfo(akteId: string, jsonData: Zusatzdaten) {
  if (!akteId) {
    throw new Error("Akte-ID fehlt.");
  }

  const url = `akten/${akteId}/update_zusatzinfo/`;
  await api.post(url, { json_data: jsonData });
}

