import { Router } from 'express';
import multer from 'multer';
import {
    changePassword,
    createNewFollow,
    createUser,
    getListFollowUsers,
    getListUsers,
    getListUsersFollow,
    getMe,
    getUser,
    uploadAvatar,
    verifyUser,
} from '../controllers/userController';
import { 
    validateAvatar,
    validateChangePassword,
    validateCreateUser,
    validateGetUser,
    validateVerifyUser,
} from '../validation/validateUser';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import { get } from 'http';

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
    "/following",
    authenticate,
    authorize('USER_LIST_FOLLOWING'),
    getListFollowUsers,
);

router.get(
    "/followers",
    authenticate,
    authorize('USER_LIST_FOLLOWERS'),
    getListUsersFollow,
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

router.post(
    "/:targetId/follow",
    authenticate,
    authorize('USER_CREATE_FOLLOW'),
    createNewFollow,
);

export default router;