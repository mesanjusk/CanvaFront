export async function removeBackground(file) {
  const apiKey = import.meta.env.VITE_REMOVE_BG_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Remove.bg API key");
  }

  const formData = new FormData();
  formData.append("image_file", file);
  formData.append("size", "auto");

  const response = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Remove.bg request failed: ${response.status} ${errorText}`);
  }

  return await response.blob();
}
