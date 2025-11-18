import { Router } from 'express';
import {
    createCategory,
    getListCategories,
    deleteCategories,
} from '../controllers/categoryController';
import { 
    validateCreateCategory,
    validateDeleteCategories,
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

router.delete(
    '/',
    authenticate,
    authorize('CATEGORY_DELETE'),
    validateDeleteCategories,
    deleteCategories,
);

export default router;