import { Router } from 'express';
import {
    createRole,
} from '../controllers/roleController';
import { 

} from '../validation/validateRole';

const router = Router();

router.post(
    '/', 
    createRole,
);

export default router;