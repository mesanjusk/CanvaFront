export async function removeBackground(file) {
  const endpoint = import.meta.env.VITE_BG_REMOVE_URL;
  if (!endpoint) {
    const error = new Error("Background removal service not configured");
    error.code = "BG_REMOVE_URL_MISSING";
    throw error;
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("image_file", file);

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Background removal request failed: ${response.status} ${errorText}`);
  }

  return await response.blob();
}
