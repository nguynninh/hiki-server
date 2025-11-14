import { Router } from 'express';
import {
    createUser,
    getUser,
} from '../controllers/userController';
import { 
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

export default router;