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
} from '../controllers/userController';
import { 
    validateAvatar,
    validateChangePassword,
    validateCreateUser,
    validateGetUser,
    validateVerifyUser,
    validateUpdateUser,
} from '../validation/validateUser';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
    ['/','/registration'],
    validateCreateUser,
    createUser,
);

router.post(
    '/verify',
    validateVerifyUser,
    verifyUser,
);

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

export default router;