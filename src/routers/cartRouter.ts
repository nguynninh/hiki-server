import { Router } from 'express';
import cartController from '../controllers/cartController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/add-to-cart', cartController.addToCart);
router.put('/update-item', cartController.updateItem);
router.delete('/remove-item', cartController.removeItem);
router.get('/count', cartController.getCount);

export default router;
