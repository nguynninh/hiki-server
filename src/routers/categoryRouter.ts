import { Router } from 'express';
import {
    createCategory,
    getListCategories,
    getCategory,
    deleteCategories,
} from '../controllers/categoryController';
import { 
    validateCreateCategory,
    validateGetCategory,
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

router.get(
    '/:id',
    authenticate,
    authorize('CATEGORY_VIEW'),
    validateGetCategory,
    getCategory,
);

export default router;