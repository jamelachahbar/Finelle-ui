import axios from "axios";

export const askFinelle = async (prompt: string) => {
  const response = await axios.post("http://localhost:8081/ask", { prompt });
  return response.data.response;
};
