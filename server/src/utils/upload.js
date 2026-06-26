import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: 'public/uploads/logos/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `tenant-${req.params.id}-${Date.now()}${ext}`);
  },
});

export const uploadLogo = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten imágenes'));
    }
    cb(null, true);
  },
});
