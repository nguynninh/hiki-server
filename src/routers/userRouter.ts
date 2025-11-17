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
    getUserRelationship,
    handleUnfollow,
    uploadAvatar,
    verifyUser,
} from '../controllers/userController';
import { 
    validateAvatar,
    validateChangePassword,
    validateCreateFollow,
    validateCreateUser,
    validateGetUser,
    validateGetUserRelationship,
    validateUnfollow,
    validateVerifyUser,
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

router.get(
    "/:targetId/relationship", 
    authenticate,
    authorize('USER_VIEW_RELATIONSHIP'),
    validateGetUserRelationship,
    getUserRelationship,
);

router.post(
    "/:targetId/follow",
    authenticate,
    authorize('USER_CREATE_FOLLOW'),
    validateCreateFollow,
    createNewFollow,
);

router.delete(
    "/:targetId/follow",
    authenticate,
    authorize('USER_UNFOLLOW'),
    validateUnfollow,
    handleUnfollow,
);

export default router;