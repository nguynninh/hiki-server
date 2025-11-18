import { Router } from 'express';
import multer from 'multer';
import {
    createCategory,
    getListCategories,
    getCategory,
    updateCategory,
    restoreCategory,
    hardDeleteCategory,
    softdeleteCategory,
    deleteCategories,
    uploadCategoryAvatar,
    deleteCategoryAvatar,
} from '../controllers/categoryController';
import { 
    validateCreateCategory,
    validateGetCategory,
    validateUpdateCategory,
    validateRestoreCategory,
    validateHardDeleteCategory,
    validateSoftDeleteCategory,
    validateDeleteCategories,
    validateUploadCategoryAvatar,
    validateDeleteCategoryAvatar,
} from '../validation/validateCategory';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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

router.put(
    '/:id',
    authenticate,
    authorize('CATEGORY_UPDATE'),
    validateUpdateCategory,
    updateCategory,
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

router.post(
    '/:id/avatar',
    authenticate,
    authorize('CATEGORY_UPLOAD_AVATAR'),
    upload.single('avatar'),
    validateUploadCategoryAvatar,
    uploadCategoryAvatar,
);

router.delete(
    '/:id/avatar',
    authenticate,
    authorize('CATEGORY_DELETE_AVATAR'),
    validateDeleteCategoryAvatar,
    deleteCategoryAvatar,
)

export default router;