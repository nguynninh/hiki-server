import { Router } from 'express';
import {
    createRole,
    getAllPermissions,
} from '../controllers/roleController';
import { 

} from '../validation/validateRole';

const router = Router();

router.post(
    '/', 
    createRole,
);

router.get(
    '/permissions',
    getAllPermissions,
);

export default router;