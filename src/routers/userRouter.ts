import { Router } from 'express';
import {
    changePassword,
    createUser,
    getUser,
} from '../controllers/userController';
import { 
    validateChangePassword,
    validateCreateUser,
    validateGetUser,
} from '../validation/validateUser';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.post(
    '/',
    authenticate,
    authorize('USER_CREATE'),
    validateCreateUser,
    createUser,
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