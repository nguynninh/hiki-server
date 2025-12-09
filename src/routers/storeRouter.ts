import { Router } from 'express';
import multer from 'multer';
import storeController from '../controllers/storeController';
import { authenticate } from '../middlewares/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.post('/register', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 }
]), storeController.registerStore);

export default router;
