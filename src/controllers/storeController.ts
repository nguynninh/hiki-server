import { Request, Response } from 'express';
import StoreModel from '../models/StoreModel';
import UserModel from '../models/UserModel';
import { uploadImage } from '../services/fileService';

const registerStore = async (req: Request, res: Response) => {
    try {
        const { sub: userId } = req.user as any;
        const {
            store_name, slug, address, province_code, district_code,
            ward_code, tax_code, phone
        } = req.body;

        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        let logoUrl = req.body.logo;
        let coverUrl = req.body.cover_image;

        if (files) {
            if (files['logo']?.[0]) {
                const { publicUrl } = await uploadImage(userId, files['logo'][0]);
                logoUrl = publicUrl;
            }
            if (files['cover_image']?.[0]) {
                const { publicUrl } = await uploadImage(userId, files['cover_image'][0]);
                coverUrl = publicUrl;
            }
        }

        let store = await StoreModel.findOne({ where: { user_id: userId } });

        if (store) {
            if ((store as any).status === 'rejected') {
                await StoreModel.destroy({ where: { id: (store as any).id } });
                store = null;
            } else {
                return res.status(400).json({
                    code: 400,
                    message: 'Store already exists for this user'
                });
            }
        }

        if (!store) {
            store = await StoreModel.create({
                user_id: userId,
                store_name,
                slug,
                address,
                province_code,
                district_code,
                ward_code,
                tax_code,
                logo: logoUrl,
                cover_image: coverUrl,
                phone,
                status: 'pending'
            });
        }

        await UserModel.update({ seller_request_status: 'pending' }, { where: { id: userId } });

        res.status(200).json({
            code: 200,
            message: 'Store registration submitted successfully',
            data: store
        });
    } catch (error: any) {
        res.status(500).json({
            code: 500,
            message: error.message
        });
    }
};

export default {
    registerStore
};
