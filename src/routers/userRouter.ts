import { Router } from 'express';
import {
    createUser,
    getUser,
} from '../controllers/userController';
import { 
    validateCreateUser,
    validateGetUser,
} from '../validation/validateUser';

const router = Router();

router.post(
    '/',
    validateCreateUser,
    createUser,
);

router.get(
    '/:id',
    validateGetUser,
    getUser,
);

export default router;