import { Router } from 'express';
import {
    createCategory,
    getListCategories,
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

router.get(
    ['/', "/search"],
    authenticate,
    authorize('CATEGORY_LIST'),
    getListCategories,
);

export default router;