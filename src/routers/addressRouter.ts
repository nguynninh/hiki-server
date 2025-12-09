import { Router } from 'express';
import addressController from '../controllers/addressController';

const router = Router();

import { authenticate } from '../middlewares/auth';

router.get('/provinces', addressController.getProvinces);
router.get('/wards', addressController.getWards);

router.post('/add', authenticate, addressController.addNewAddress);
router.get('/get-all', authenticate, addressController.getAllAddresses);
router.put('/update', authenticate, addressController.updateAddress);
router.delete('/delete', authenticate, addressController.deleteAddress);

export default router;
