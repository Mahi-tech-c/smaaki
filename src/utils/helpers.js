/**
 * Compress an image file to a Base64 data URL using an HTML5 Canvas.
 * Automatically keeps file size minimal for fast Firestore synchronization.
 */
export const compressImageFile = (file, maxDimension = 400, quality = 0.6) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(objectUrl);

        const base64String = canvas.toDataURL('image/jpeg', quality);
        resolve(base64String);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
};

/**
 * Format currency with fallback to INR symbol.
 */
export const formatCurrency = (amount, symbol = '₹') => {
  const num = Number(amount);
  if (isNaN(num)) return `${symbol}0.00`;
  return `${symbol}${num.toFixed(2)}`;
};

/**
 * Sanitize text descriptions by stripping old hardcoded Read More / Customisable suffixes.
 */
export const sanitizeDescription = (text) => {
  if (!text) return '';
  return String(text)
    .replace(/(?:\.\.\.)?\s*Read More\s*(?:Customisable)?/gi, '')
    .replace(/^[^•\n]+•\s*\d+\s*kcal[^.]*\.\s*/i, '')
    .trim();
};
