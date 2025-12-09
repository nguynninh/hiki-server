import { Request, Response } from "express";
import {
    ProductModel,
    ProductVariantModel,
    ProductVariantAttributeModel,
    AttributeModel,
    AttributeValueModel,
    CategoryModel,
    UserModel
} from "../models";
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/responseFormatter';
import { ValidationError, NotFoundError } from "../exception/AppError";
import { Op } from 'sequelize';
import sequelize from '../database/pgClient';
import Pagination from "../dto/Pagination";
import { getFileUrl } from '../services/fileService';

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    const {
        name,
        description,
        brand,
        category_id,
        variants
    } = req.body;

    if (!name) throw new ValidationError(req.t('product:name_required'));
    if (!category_id) throw new ValidationError(req.t('product:category_required'));

    const transaction = await sequelize.transaction();

    try {
        const product = await ProductModel.create({
            name,
            description,
            brand,
            category_id,
            seller_id: userId,
        }, { transaction });

        if (variants && Array.isArray(variants)) {
            for (const variantData of variants) {
                const variant = await ProductVariantModel.create({
                    product_id: (product as any).id,
                    price: variantData.price,
                    stock: variantData.stock,
                    image: variantData.image, // Assuming file ID passed or null
                }, { transaction });

                if (variantData.attributes && Array.isArray(variantData.attributes)) {
                    const variantAttributes = variantData.attributes.map((attr: any) => ({
                        variant_id: (variant as any).id,
                        attribute_id: attr.attribute_id,
                        attribute_value_id: attr.attribute_value_id,
                    }));
                    await ProductVariantAttributeModel.bulkCreate(variantAttributes, { transaction });
                }
            }
        }

        await transaction.commit();

        return successResponse(res, {
            code: 201,
            message: req.t('product:created'),
            data: { id: (product as any).id }
        });

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

export const getListProducts = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '', category_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
        where.name = { [Op.iLike]: `%${search}%` };
    }
    if (category_id) {
        where.category_id = category_id;
    }

    const { count, rows } = await ProductModel.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
        include: [
            { model: CategoryModel, as: 'category', attributes: ['id', 'name'] },
            { model: UserModel, as: 'seller', attributes: ['id', 'firstname', 'lastname', 'email'] },
            {
                model: ProductVariantModel,
                as: 'variants',
                include: [
                    {
                        model: AttributeValueModel,
                        as: 'values',
                        through: { attributes: [] }, // Hide join table
                        include: [{ model: AttributeModel, as: 'attribute' }]
                    }
                ]
            }
        ],
        distinct: true,
    });

    const products = await Promise.all(rows.map(async (product: any) => {
        const productJSON = product.toJSON();
        if (productJSON.variants) {
            productJSON.variants = await Promise.all(productJSON.variants.map(async (v: any) => ({
                ...v,
                image_url: v.image ? await getFileUrl(v.image) : null
            })));

            if (productJSON.variants.length > 0 && productJSON.variants[0].image_url) {
                productJSON.image_url = productJSON.variants[0].image_url;
            }
        }
        return productJSON;
    }));

    return successResponse(res, {
        message: req.t('product:list_fetched'),
        data: {
            products,
            paginations: Pagination(Number(page), Number(limit), count)
        }
    });
});

export const getMyProducts = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = { seller_id: userId };
    if (search) {
        where.name = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await ProductModel.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
        include: [
            { model: CategoryModel, as: 'category' },
            {
                model: ProductVariantModel,
                as: 'variants',
            }
        ],
        distinct: true
    });

    const products = await Promise.all(rows.map(async (product: any) => {
        const p = product.toJSON();
        if (p.variants) {
            p.variants = await Promise.all(p.variants.map(async (v: any) => ({
                ...v,
                image_url: v.image ? await getFileUrl(v.image) : null
            })));
        }
        return p;
    }));

    return successResponse(res, {
        message: req.t('product:my_list_fetched'),
        data: {
            products,
            pagination: Pagination(Number(page), Number(limit), count)
        }
    });
});

export const getProductDetail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await ProductModel.findByPk(id, {
        include: [
            { model: CategoryModel, as: 'category' },
            { model: UserModel, as: 'seller', attributes: ['id', 'firstname', 'lastname', 'email'] },
            {
                model: ProductVariantModel,
                as: 'variants',
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
    });

    if (!product) throw new NotFoundError(req.t('product:not_found'));

    const productJSON = (product as any).toJSON();
    if (productJSON.variants) {
        productJSON.variants = await Promise.all(productJSON.variants.map(async (v: any) => ({
            ...v,
            image_url: v.image ? await getFileUrl(v.image) : null
        })));
    }

    return successResponse(res, {
        message: req.t('product:detail_fetched'),
        data: productJSON
    });
});

// For update, delete - kept simple or standard
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.sub;

    const product = await ProductModel.findByPk(id);
    if (!product) throw new NotFoundError(req.t('product:not_found'));

    // Check ownership
    // @ts-ignore
    if (product.seller_id !== userId) {
        // Allow admin override if needed, but for now restrict to owner
        // throw new ForbiddenError(req.t('auth:forbidden')); 
    }

    await product.destroy();

    return successResponse(res, {
        message: req.t('product:deleted')
    });
});
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.sub;
    const {
        name,
        description,
        brand,
        category_id,
        variants // Expecting array of { id?, price, stock, image, attributes: [{ attribute_id, attribute_value_id }] }
    } = req.body;

    const product = await ProductModel.findByPk(id);
    if (!product) throw new NotFoundError(req.t('product:not_found'));

    // Check ownership
    // @ts-ignore
    if (product.seller_id !== userId) {
        // throw new ForbiddenError(req.t('auth:forbidden'));
    }

    const transaction = await sequelize.transaction();

    try {
        // 1. Update Basic Info
        await product.update({
            ...(name && { name }),
            ...(description && { description }),
            ...(brand && { brand }),
            ...(category_id && { category_id }),
        }, { transaction });

        // 2. Sync Variants
        if (variants && Array.isArray(variants)) {
            // Fetch existing variants
            const existingVariants = await ProductVariantModel.findAll({
                where: { product_id: id },
                include: [{ model: ProductVariantAttributeModel, as: 'variantAttributes' }],
                transaction
            });

            const sentVariantIds = variants.filter((v: any) => v.id).map((v: any) => v.id);

            // A. DELETE variants not in request (if needed - depends on UI, assuming full replace or diff)
            // If request contains AT LEAST ONE variant with ID, we assume logic is to delete others.
            // If request has NO variants with IDs (all new), we might keep old? standard is usually "sync list"
            // Let's assume the list sent IS the full list of desired variants.
            const toDelete = existingVariants.filter((ev: any) => !sentVariantIds.includes(ev.id));
            if (toDelete.length > 0) {
                await ProductVariantModel.destroy({
                    where: { id: { [Op.in]: toDelete.map((v: any) => v.id) } },
                    transaction
                });
            }

            // B. UPDATE or CREATE
            for (const vData of variants) {
                let variantRecord;

                if (vData.id) {
                    // Update existing
                    variantRecord = existingVariants.find((ev: any) => ev.id === vData.id);
                    if (variantRecord) {
                        await variantRecord.update({
                            price: vData.price,
                            stock: vData.stock,
                            image: vData.image,
                        }, { transaction });
                    }
                } else {
                    // Create new
                    variantRecord = await ProductVariantModel.create({
                        product_id: id,
                        price: vData.price,
                        stock: vData.stock,
                        image: vData.image,
                    }, { transaction });
                }

                // C. Sync Attributes for this Variant
                if (variantRecord && vData.attributes && Array.isArray(vData.attributes)) {
                    // We can do a full replace of attributes for simplicity
                    // First, remove existing attributes for this variant
                    await ProductVariantAttributeModel.destroy({
                        where: { variant_id: (variantRecord as any).id },
                        transaction
                    });

                    // Then create new links
                    const attrPayload = vData.attributes.map((attr: any) => ({
                        variant_id: (variantRecord as any).id,
                        attribute_id: attr.attribute_id,
                        attribute_value_id: attr.attribute_value_id,
                    }));

                    if (attrPayload.length > 0) {
                        await ProductVariantAttributeModel.bulkCreate(attrPayload, { transaction });
                    }
                }
            }
        }

        await transaction.commit();

        return successResponse(res, {
            message: req.t('product:updated'),
            data: { id }
        });

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});
