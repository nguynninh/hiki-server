import { Router } from 'express';
import {
    createAttribute,
    getListAttributes,
    getAttribute,
    updateAttribute,
    deleteAttribute
} from '../controllers/attributeController';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.post(
    '/',
    authenticate,
    authorize('CATEGORY_CREATE'), // Reuse or create specific permission
    createAttribute
);

router.get(
    '/',
    authenticate,
    // authorize('CATEGORY_LIST'), // Attributes might be public or protected
    getListAttributes
);

router.get('/:id', authenticate, getAttribute);

router.put(
    '/:id',
    authenticate,
    authorize('CATEGORY_UPDATE'),
    updateAttribute
);

router.delete(
    '/:id',
    authenticate,
    authorize('CATEGORY_DELETE'),
    deleteAttribute
);

export default router;
