import multer from 'multer';
import path from 'path';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // This is the folder where images will be stored
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // e.g., 1715854372631.jpg
  },
});

const upload = multer({
  storage: storage,
}) // 'photo' is the name of the field in the form

export default upload;
