import axios from "axios";

type Zusatzdaten = Record<string, unknown>;

const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL: string =
  typeof envBaseUrl === "string" && envBaseUrl.length > 0
    ? envBaseUrl
    : "http://localhost:8000/api/";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function updateAkteZusatzinfo(akteId: string, jsonData: Zusatzdaten) {
  if (!akteId) {
    throw new Error("Akte-ID fehlt.");
  }

  const url = `akten/${akteId}/update_zusatzinfo/`;
  await client.post(url, { json_data: jsonData });
}

