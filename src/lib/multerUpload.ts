import multer from "multer";

const storage = multer.memoryStorage();

export const uploadSingleFile = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024, 
  },
}).single("file");