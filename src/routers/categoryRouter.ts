import { Router } from 'express';
import {
    createCategory,
    getListCategories,
    getCategory,
    restoreCategory,
    hardDeleteCategory,
    softdeleteCategory,
    deleteCategories,
} from '../controllers/categoryController';
import { 
    validateCreateCategory,
    validateGetCategory,
    validateRestoreCategory,
    validateHardDeleteCategory,
    validateSoftDeleteCategory,
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

router.delete(
    '/:id',
    authenticate,
    authorize('CATEGORY_SOFT_DELETE'),
    validateSoftDeleteCategory,
    softdeleteCategory,
);

router.delete(
    '/:id/hard',
    authenticate,
    authorize('CATEGORY_HARD_DELETE'),
    validateHardDeleteCategory,
    hardDeleteCategory,
);

router.post(
    '/:id/restore',
    authenticate,
    authorize('CATEGORY_RESTORE'),
    validateRestoreCategory,
    restoreCategory,
);

export default router;