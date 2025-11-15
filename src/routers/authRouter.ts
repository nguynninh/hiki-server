import { Router } from 'express';
import {
    forgotPassword,
    login,
    loginSocial,
} from '../controllers/authController';
import {
    validateForgotPassword,
    validateLogin,
    validateLoginSocial,
} from '../validation/validateAuth';

const router = Router();

router.post(
    '/login', 
    validateLogin,
    login
);

router.post(
    '/login/:provider/social',
    validateLoginSocial,
    loginSocial,
);

router.post(
    '/forgot-password',
    validateForgotPassword,
    forgotPassword,
);

export default router;
