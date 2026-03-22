import multer, { FileFilterCallback } from 'multer';
import fs from 'fs';
import path from 'path';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import { Request } from 'express';
import config from '../config';

// ─────────────────────────────────────────────────────────
// Cloudinary Config
// ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

// ─────────────────────────────────────────────────────────
// Ensure uploads directory exists
// ─────────────────────────────────────────────────────────
const uploadsDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─────────────────────────────────────────────────────────
// Upload to Cloudinary
// ─────────────────────────────────────────────────────────
const uploadToCloudinary = async (
  file: Express.Multer.File,
  folder = 'rentezzi/receipts',
): Promise<UploadApiResponse> => {
  // Unique + sanitized filename
  const sanitizedName = path
    .parse(file.originalname)
    .name.replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 100); // Limit length
  const publicId = `${Date.now()}-${sanitizedName}`;

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      public_id: publicId,
      folder,
      overwrite: false,
      resource_type: 'auto', // supports pdf, image, etc.
    });

    return result;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  } finally {
    // Always delete temp file (non-blocking)
    await fs.promises.unlink(file.path).catch(() => {});
  }
};

// ─────────────────────────────────────────────────────────
// Multer Storage Config
// ─────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '_');

    cb(null, `${name}_${Date.now()}${ext}`);
  },
});

// ─────────────────────────────────────────────────────────
// File Filter (PDF + Image)
// ─────────────────────────────────────────────────────────
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedMimeTypes = [
    'application/pdf', // for receipts
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'File type not allowed. Only PDF, JPEG, PNG, WEBP, GIF are allowed',
      ),
    );
  }
};

// ─────────────────────────────────────────────────────────
// Multer Instance
// ─────────────────────────────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // ✅ 10MB (supports your ~7MB PDF)
  },
});

// ─────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────
export const fileUploader = {
  upload,
  uploadToCloudinary,
};
