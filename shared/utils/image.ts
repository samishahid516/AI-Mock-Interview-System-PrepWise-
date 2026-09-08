/**
 * Resize an image file client-side and return it as a JPEG base64 data URL.
 * Keeps profile-photo uploads small (well under the backend's size cap)
 * without needing any server-side image processing.
 */
export function resizeImageToDataUrl(
  file: File,
  // The largest avatar shown in the app is 120px (the interview call
  // screen). On a high-DPI/Retina display that needs up to ~360px of real
  // pixel data to render crisp, so 256px was too small and looked blurry.
  // 512px covers up to 3x DPI at that size with headroom to spare, while
  // still producing a small JPEG (well under the backend's upload cap).
  maxDimension = 512,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Could not read the selected file."));
    reader.onload = () => {
      const img = new window.Image();

      img.onerror = () => reject(new Error("Could not load the selected image."));
      img.onload = () => {
        let { width, height } = img;

        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas is not supported in this browser."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
