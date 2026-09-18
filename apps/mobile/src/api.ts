import { RedVitalApiClient } from "@redvital/api-client";
import { Platform } from "react-native";

const configured = process.env.EXPO_PUBLIC_API_BASE_URL;
export const API_BASE_URL = configured || (Platform.OS === "android" ? "http://10.0.2.2:3001" : "http://127.0.0.1:3001");
export const api = new RedVitalApiClient({ baseUrl: API_BASE_URL });
export const secureRefreshKey = "redvital.mobile.refresh-token";
