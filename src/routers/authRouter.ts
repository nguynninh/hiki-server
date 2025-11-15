import { Router } from 'express';
import {
    forgotPassword,
    login,
    loginSocial,
    resetPassword,
} from '../controllers/authController';
import {
    validateForgotPassword,
    validateLogin,
    validateLoginSocial,
    validateResetPassword,
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

router.post(
    '/reset-password',
    validateResetPassword,
    resetPassword,
);

export default router;
