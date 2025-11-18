import { Router } from 'express';
import {
    createCategory,
} from '../controllers/categoryController';
import { 
    validateCreateCategory,
} from '../validation/validateCategory';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.post(
    '/',
    authenticate,
    authorize('CATEGORY_CREATE'),
    validateCreateCategory,
    createCategory,
);

export default router;