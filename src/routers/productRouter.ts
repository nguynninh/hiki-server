import { Router } from 'express';
import {
    createProduct,
    getListProducts,
    getMyProducts,
    getProductDetail,
    deleteProduct,
    updateProduct
} from '../controllers/productController';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

// Public or Authenticated List
router.get('/', getListProducts);

// Seller Management Routes
router.get('/my-products', authenticate, getMyProducts); // Needs checking if user is seller? Or just any user can have products?

router.post(
    '/',
    authenticate,
    // Add authorize('SELLER') if strictly restricted
    createProduct
);

router.get('/:id', getProductDetail);

router.put('/:id', authenticate, updateProduct);

router.delete('/:id', authenticate, deleteProduct);

export default router;
