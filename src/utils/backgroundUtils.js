import axios from "axios";

export async function removeBackground(file) {
  const apiKey = import.meta.env.VITE_REMOVE_BG_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Remove.bg API key");
  }

  const formData = new FormData();
  formData.append("image_file", file);
  formData.append("size", "auto");

  const response = await axios.post(
    "https://api.remove.bg/v1.0/removebg",
    formData,
    {
      headers: {
        "X-Api-Key": apiKey,
      },
      responseType: "blob",
    }
  );

  return URL.createObjectURL(response.data);
}
