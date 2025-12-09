import { Request, Response } from 'express';
import CartModel from '../models/CartModel';
import CartItemModel from '../models/CartItemModel';
import ProductModel from '../models/ProductModel';
import ProductVariantModel from '../models/ProductVariantModel';
import { AttributeValueModel, AttributeModel } from '../models';
import { getFileUrl } from '../services/fileService';

const getCart = async (req: Request, res: Response) => {
    try {
        const { sub: userId } = req.user as any;

        let cart = await CartModel.findOne({ where: { user_id: userId } });
        if (!cart) {
            cart = await CartModel.create({ user_id: userId });
        }

        const cartData = await CartModel.findOne({
            where: { user_id: userId },
            include: [
                {
                    model: CartItemModel,
                    as: 'items',
                    include: [
                        {
                            model: ProductModel,
                            as: 'product',
                            include: [{
                                model: ProductVariantModel,
                                as: 'variants',
                                limit: 1,
                                attributes: ['image']
                            }]
                        },
                        {
                            model: ProductVariantModel,
                            as: 'variant',
                            include: [
                                {
                                    model: AttributeValueModel,
                                    as: 'values',
                                    through: { attributes: [] },
                                    include: [{ model: AttributeModel, as: 'attribute' }]
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [[{ model: CartItemModel, as: 'items' }, 'created_at', 'ASC']]
        });

        const plainCart = cartData ? cartData.get({ plain: true }) : null;

        if (plainCart && plainCart.items) {
            plainCart.items = await Promise.all(plainCart.items.map(async (item: any) => {
                const variantImage = item.variant?.image ? await getFileUrl(item.variant.image) : null;
                const productImage = (item.product?.variants && item.product.variants.length > 0 && item.product.variants[0].image)
                    ? await getFileUrl(item.product.variants[0].image)
                    : null;

                if (item.variant && !item.variant.name && item.variant.values) {
                    item.variant.name = item.variant.values
                        .map((val: any) => `${val.value}`)
                        .join(' - ');
                }

                return {
                    ...item,
                    imageUrl: variantImage || productImage || null
                };
            }));
        }

        res.status(200).json({
            code: 200,
            message: 'Success',
            data: plainCart
        });
    } catch (error: any) {
        res.status(500).json({
            code: 500,
            message: error.message
        });
    }
};

const addToCart = async (req: Request, res: Response) => {
    try {
        const { sub: userId } = req.user as any;
        const { product_id, variant_id, quantity } = req.body;

        let cart = await CartModel.findOne({ where: { user_id: userId } });
        if (!cart) {
            cart = await CartModel.create({ user_id: userId });
        }

        const existingItem = await CartItemModel.findOne({
            where: {
                cart_id: cart.getDataValue('id'),
                product_id,
                variant_id: variant_id || null
            }
        });

        if (existingItem) {
            await existingItem.increment('quantity', { by: quantity || 1 });
        } else {
            await CartItemModel.create({
                cart_id: cart.getDataValue('id'),
                product_id,
                variant_id: variant_id || null,
                quantity: quantity || 1
            });
        }

        await getCart(req, res);

    } catch (error: any) {
        res.status(500).json({
            code: 500,
            message: error.message
        });
    }
};

const updateItem = async (req: Request, res: Response) => {
    try {
        const { id, quantity } = req.body;

        await CartItemModel.update({ quantity }, {
            where: { id: id }
        });

        res.status(200).json({
            code: 200,
            message: 'Item updated'
        });
    } catch (error: any) {
        res.status(500).json({
            code: 500,
            message: error.message
        });
    }
};

const removeItem = async (req: Request, res: Response) => {
    try {
        const { id } = req.query;

        await CartItemModel.destroy({
            where: { id: id }
        });

        res.status(200).json({
            code: 200,
            message: 'Item removed'
        });
    } catch (error: any) {
        res.status(500).json({
            code: 500,
            message: error.message
        });
    }
};

const getCount = async (req: Request, res: Response) => {
    try {
        const { sub: userId } = req.user as any;
        const cart = await CartModel.findOne({ where: { user_id: userId } });

        let count = 0;
        if (cart) {
            count = await CartItemModel.count({ where: { cart_id: cart.getDataValue('id') } });
        }

        res.status(200).json({
            code: 200,
            message: 'Success',
            data: count
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
}

export default {
    getCart,
    addToCart,
    updateItem,
    removeItem,
    getCount
};
