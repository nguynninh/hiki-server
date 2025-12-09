import { Router } from 'express';
import multer from 'multer';
import {
    changePassword,
    createUser,
    getListUsers,
    getMe,
    getUser,
    uploadAvatar,
    verifyUser,
    updateUser,
    deleteUser,
    restoreUser,
    createAvatarDefault,
    getListAvatarDefault,
    deleteAvatarDefault,
    requestSeller,
    approveSeller,
    rejectSeller,
} from '../controllers/userController';
import {
    validateAvatar,
    validateChangePassword,
    validateCreateUser,
    validateGetUser,
    validateVerifyUser,
    validateUpdateUser,
    validateDeleteUser,
    validateRestoreUser,
} from '../validation/validateUser';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
    ['/', '/registration'],
    validateCreateUser,
    createUser,
);

router.post(
    '/verify',
    validateVerifyUser,
    verifyUser,
);

router.post(
    '/avatar-defaults',
    authenticate,
    authorize('USER_AVATAR_DEFAULT_CREATE'),
    upload.single('avatar'),
    createAvatarDefault,
);

router.get(
    ['/avatar-defaults', '/avatar-defaults/search'],
    authenticate,
    authorize('USER_AVATAR_DEFAULT_LIST'),
    getListAvatarDefault,
);

router.delete(
    '/avatar-defaults/:id',
    authenticate,
    authorize('USER_AVATAR_DEFAULT_DELETE'),
    deleteAvatarDefault,
)

router.put(
    '/:id',
    authenticate,
    authorize('USER_EDIT'),
    validateUpdateUser,
    updateUser,
);

router.get(
    '/me',
    authenticate,
    getMe,
);

router.get(
    ['/', "/search"],
    authenticate,
    authorize('USER_LIST'),
    getListUsers,
);

router.get(
    '/:id',
    authenticate,
    authorize('USER_VIEW'),
    validateGetUser,
    getUser,
);

router.delete(
    '/:id',
    authenticate,
    authorize('USER_DELETE'),
    validateDeleteUser,
    deleteUser,
);

router.put(
    '/:id/restore',
    authenticate,
    authorize('USER_RESTORE'),
    validateRestoreUser,
    restoreUser,
);

router.post(
    '/change-password',
    authenticate,
    authorize('USER_CHANGE_PASSWORD'),
    validateChangePassword,
    changePassword,
);

router.post(
    '/avatar',
    authenticate,
    authorize('USER_UPLOAD_AVATAR'),
    upload.single('avatar'),
    validateAvatar,
    uploadAvatar,
);

// Seller routes
router.post(
    '/request-seller',
    authenticate,
    requestSeller,
);

router.post(
    '/approve-seller/:id',
    authenticate,
    authorize('SUPER_ADMIN'), // Using role directly as per bannerRouter pattern
    approveSeller,
);

router.post(
    '/reject-seller/:id',
    authenticate,
    authorize('SUPER_ADMIN'),
    rejectSeller,
);

export default router;