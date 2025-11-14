import { Router } from 'express';
import {
    createRole,
    getAllPermissions,
} from '../controllers/roleController';
import { 
    validateCreateRole,
} from '../validation/validateRole';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.post(
    '/', 
    authenticate,
    authorize('ROLE_CREATE'),
    createRole,
    validateCreateRole,
);

router.get(
    '/permissions',
    authenticate,
    authorize('PERMISSION_VIEW'),
    getAllPermissions,
);

export default router;