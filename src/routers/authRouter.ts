import { Router } from 'express';
import {
    forgotPassword,
    login,
    loginSocial,
    refreshToken,
    resetPassword,
} from '../controllers/authController';
import {
    validateForgotPassword,
    validateLogin,
    validateLoginSocial,
    validateRefreshToken,
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
    '/refresh',
    validateRefreshToken,
    refreshToken,
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
