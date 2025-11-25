import { Router } from 'express';
import multer from 'multer';
import {
} from '../controllers/bannerController';
import { 

} from '../validation/validateUser';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
    '/',
);

export default router;