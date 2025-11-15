import { Router } from 'express';
import {
    changePassword,
    createUser,
    getListUsers,
    getMe,
    getUser,
    verifyUser,
} from '../controllers/userController';
import { 
    validateChangePassword,
    validateCreateUser,
    validateGetUser,
    validateVerifyUser,
} from '../validation/validateUser';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.post(
    '/',
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
    '/',
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

export default router;