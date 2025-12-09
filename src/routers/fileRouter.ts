import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth';
import { uploadFile, removeFile, getFile } from '../controllers/fileController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
    '/upload',
    authenticate,
    upload.single('file'),
    uploadFile,
);

router.delete(
    '/:id',
    authenticate,
    removeFile,
);

router.get(
    '/:id',
    getFile,
);

export default router;
