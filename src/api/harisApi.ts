import axios from "axios";

// Base URL for the backend API - use environment variable or fallback
import env from '../config/env';

const BASE_URL = env.BACKEND_URL || "http://localhost:8000";

export const askHaris = async (prompt: string) => {
  const response = await axios.post(`${BASE_URL}/ask`, { prompt });
  return response.data.response;
};

// Export the base URL for use in other services
export { BASE_URL };
