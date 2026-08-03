const ImageKit = require("imagekit");

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGEKIT_PROVIDER_FOLDER = "/PPlusOne/providers";
const IMAGEKIT_KYC_FOLDER = "/PPlusOne/kyc";
const MAX_KYC_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_KYC_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const IMAGEKIT_CHAT_VOICE_FOLDER = "/PPlusOne/chat/voice";
const MAX_VOICE_BYTES = 5 * 1024 * 1024;
const ALLOWED_VOICE_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
]);

function getImageKitClient() {
  const { IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT } =
    process.env;

  if (!IMAGEKIT_PUBLIC_KEY || !IMAGEKIT_PRIVATE_KEY || !IMAGEKIT_URL_ENDPOINT) {
    const error = new Error("ImageKit is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    privateKey: IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
  });
}

function validateImage(file) {
  if (!file) {
    const error = new Error("Image file is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error("Only JPG, PNG and WebP images are allowed.");
    error.statusCode = 400;
    throw error;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    const error = new Error("Image must be 3 MB or smaller.");
    error.statusCode = 400;
    throw error;
  }
}

function getOptimizedUrl(url, transformation) {
  if (!url) return "";
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}tr=${transformation}`;
}

async function uploadProviderImage(file, index = 0) {
  validateImage(file);

  const imagekit = getImageKitClient();
  const extension = file.mimetype.split("/")[1].replace("jpeg", "jpg");
  const uploaded = await imagekit.upload({
    file: file.buffer,
    fileName: `provider-${Date.now()}-${index}.${extension}`,
    folder: IMAGEKIT_PROVIDER_FOLDER,
    useUniqueFileName: true,
  });

  const url = uploaded.url;

  return {
    url: getOptimizedUrl(url, "f-webp,q-85"),
    thumbnailUrl: getOptimizedUrl(url, "f-webp,q-80,w-420"),
    fileId: uploaded.fileId,
    width: uploaded.width,
    height: uploaded.height,
  };
}

async function uploadKycDocument(file) {
  if (!file || !ALLOWED_KYC_MIME_TYPES.has(file.mimetype)) {
    const error = new Error("A JPG, PNG, WebP or PDF identity document is required.");
    error.statusCode = 400;
    throw error;
  }
  if (!file.size || file.size > MAX_KYC_DOCUMENT_BYTES) {
    const error = new Error("Identity document must be 5 MB or smaller.");
    error.statusCode = 400;
    throw error;
  }
  const imagekit = getImageKitClient();
  const extension = file.mimetype === "application/pdf" ? "pdf" : file.mimetype.split("/")[1].replace("jpeg", "jpg");
  const uploaded = await imagekit.upload({
    file: file.buffer,
    fileName: `identity-${Date.now()}.${extension}`,
    folder: IMAGEKIT_KYC_FOLDER,
    useUniqueFileName: true,
  });
  return { url: uploaded.url, fileId: uploaded.fileId, mimeType: file.mimetype };
}

function validateVoice(file) {
  if (!file) {
    const error = new Error("Voice recording is required.");
    error.statusCode = 400;
    throw error;
  }

  const mimetype = String(file.mimetype || "").split(";")[0].toLowerCase();
  if (!ALLOWED_VOICE_MIME_TYPES.has(mimetype)) {
    const error = new Error("Only WebM, OGG, MP4, MP3 and WAV voice recordings are allowed.");
    error.statusCode = 400;
    throw error;
  }

  if (!file.size || file.size > MAX_VOICE_BYTES) {
    const error = new Error("Voice recording must be 5 MB or smaller.");
    error.statusCode = 400;
    throw error;
  }
}

async function uploadChatVoice(file, threadId) {
  validateVoice(file);
  const imagekit = getImageKitClient();
  const mimetype = String(file.mimetype || "audio/webm").split(";")[0];
  const extensions = {
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
  };
  const uploaded = await imagekit.upload({
    file: file.buffer,
    fileName: `voice-${threadId}-${Date.now()}.${extensions[mimetype] || "webm"}`,
    folder: IMAGEKIT_CHAT_VOICE_FOLDER,
    useUniqueFileName: true,
  });

  return {
    url: uploaded.url,
    fileId: uploaded.fileId,
    size: uploaded.size || file.size,
  };
}

async function deleteImageKitFile(fileId) {
  if (!fileId) return;
  const imagekit = getImageKitClient();
  await imagekit.deleteFile(fileId);
}

function fileFromBase64Image(value) {
  if (typeof value !== "string") return null;

  const match = value.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/);
  if (!match) return null;

  const mimetype = match[1].replace("image/jpg", "image/jpeg");
  const buffer = Buffer.from(match[2], "base64");

  return {
    buffer,
    mimetype,
    size: buffer.length,
    originalname: `provider-upload.${mimetype.split("/")[1]}`,
  };
}

async function uploadProviderBase64Image(value, index = 0) {
  const file = fileFromBase64Image(value);
  if (!file) {
    const error = new Error("Invalid base64 image.");
    error.statusCode = 400;
    throw error;
  }

  return uploadProviderImage(file, index);
}

function normalizeStoredImage(image) {
  if (!image) return null;

  if (typeof image === "string") {
    if (image.startsWith("data:image/")) return null;
    return {
      url: image,
      thumbnailUrl: getOptimizedUrl(image, "f-webp,q-80,w-420"),
      fileId: null,
    };
  }

  if (typeof image === "object" && image.url && !String(image.url).startsWith("data:image/")) {
    return {
      url: image.url,
      thumbnailUrl:
        image.thumbnailUrl || getOptimizedUrl(image.url, "f-webp,q-80,w-420"),
      fileId: image.fileId || null,
      width: image.width || null,
      height: image.height || null,
    };
  }

  return null;
}

module.exports = {
  MAX_IMAGE_BYTES,
  ALLOWED_MIME_TYPES,
  MAX_KYC_DOCUMENT_BYTES,
  ALLOWED_KYC_MIME_TYPES,
  uploadKycDocument,
  uploadProviderImage,
  uploadProviderBase64Image,
  fileFromBase64Image,
  normalizeStoredImage,
  MAX_VOICE_BYTES,
  ALLOWED_VOICE_MIME_TYPES,
  uploadChatVoice,
  deleteImageKitFile,
};
