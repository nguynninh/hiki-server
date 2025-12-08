import { Router } from 'express';
import multer from 'multer';
import {
    getListBanners,
    createBanner,
    getBannerDetail,
    updateBanner,
    deleteBanner
} from '../controllers/bannerController';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';
import roles from '../constants/appRoles';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get(
    '/',
    getListBanners
);

router.post(
    '/',
    authenticate,
    authorize(roles.SUPER_ADMIN),
    upload.single('image'),
    createBanner
);

router.get(
    '/:id',
    getBannerDetail
);

router.put(
    '/:id',
    authenticate,
    authorize(roles.SUPER_ADMIN),
    upload.single('image'),
    updateBanner
);

router.delete(
    '/:id',
    authenticate,
    authorize(roles.SUPER_ADMIN),
    deleteBanner
);

export default router;