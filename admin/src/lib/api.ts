import axios from "axios";

/** Shared HTTP client for the StaffSync backend. Services call this once the API replaces the mock data. */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  withCredentials: true,
});
