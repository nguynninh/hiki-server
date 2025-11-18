import { CategoryModel } from "../models";
import { Request, Response } from "express";
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/responseFormatter';
import { ValidationError, NotFoundError } from "../exception/AppError";
import { Op } from 'sequelize';
import Pagination from "../dto/Pagination";
import { deleteFile, getFileUrl, uploadImage } from '../services/fileService';

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
    const {
        name,
        slug,
        parent_id
    } = req.body;

    const existingCategory = await CategoryModel.findOne({ where: { slug } });
    if (existingCategory) {
        throw new ValidationError(req.t('category:slug_exists'));
    }

    if (parent_id) {
        const parentCategory = await CategoryModel.findByPk(parent_id);
        if (!parentCategory) {
            throw new ValidationError(req.t('category:parent_not_found'));
        }
    }

    const category = await CategoryModel.create({
        name,
        slug,
        parent_id: parent_id || null,
    });

    return successResponse(res, {
        code: 201,
        message: req.t('category:category_created'),
        data: {
            category: {
                ...category.toJSON(),
                image: await getFileUrl((category as any).image),
            }
        }
    });
});

export const getListCategories = asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 10,
        search = '',
        parent_id,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    const whereClause: any = {};
    
    if (search) {
        whereClause[Op.or] = [
            { name: { [Op.iLike]: `%${search}%` } },
            { slug: { [Op.iLike]: `%${search}%` } },
        ];
    }

    if (parent_id !== undefined) {
        whereClause.parent_id = parent_id === 'null' || parent_id === '' ? null : parent_id;
    }

    const { count, rows: categories } = await CategoryModel.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
        include: [
            {
                model: CategoryModel,
                as: 'parent',
                attributes: ['id', 'name', 'slug'],
            },
            {
                model: CategoryModel,
                as: 'children',
                attributes: ['id', 'name', 'slug'],
            }
        ],
    });

    return successResponse(res, {
        message: req.t('category:categories_fetched'),
        data: {
            categories: await Promise.all(categories.map(async (category) => ({
                ...category.toJSON(),
                image: await getFileUrl((category as any).image),
            }))),
            pagination: Pagination(
                Number(page),
                Number(limit),
                count
            )
        }
    });
});

export const deleteCategories = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        throw new ValidationError(req.t('category:ids_required'));
    }

    const results = {
        success: [] as any[],
        notFound: [] as string[],
        hasChildren: [] as any[],
        alreadyHardDeleted: [] as any[],
    };

    for (const id of ids) {
        const category = await CategoryModel.findByPk(id, {
            paranoid: false,
            include: [
                {
                    model: CategoryModel,
                    as: 'children',
                }
            ],
        });

        if (!category) {
            results.notFound.push(id);
            continue;
        }

        if ((category as any).deleted_at !== null) {
            await deleteFile((category as any).image);
            await category.destroy({ force: true });
            results.alreadyHardDeleted.push({
                id: (category as any).id,
                name: (category as any).name,
                deletedAt: (category as any).deleted_at,
            });
            continue;
        }

        if ((category as any).children && (category as any).children.length > 0) {
            results.hasChildren.push({
                id: (category as any).id,
                name: (category as any).name,
                childrenCount: (category as any).children.length,
            });
            continue;
        }

        await category.destroy();
        results.success.push({
            id: (category as any).id,
            name: (category as any).name,
        });
    }

    const totalProcessed = results.success.length + results.notFound.length + 
                          results.hasChildren.length + results.alreadyHardDeleted.length;

    return successResponse(res, {
        message: req.t('category:bulk_delete_completed', { 
            success: results.success.length,
            total: totalProcessed 
        }),
        data: {
            summary: {
                total: ids.length,
                successCount: results.success.length,
                notFoundCount: results.notFound.length,
                hasChildrenCount: results.hasChildren.length,
                hardDeletedCount: results.alreadyHardDeleted.length,
            },
            details: results,
        }
    });
});

export const uploadCategoryAvatar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
        throw new ValidationError(req.t('category:image_required'));
    }

    const category = await CategoryModel.findByPk(id);

    if (!category) {
        throw new NotFoundError(req.t('category:category_not_found'));
    }

    const userId = req.user?.sub;
    
    if ((category as any).image)
        await deleteFile((category as any).image);
    const { fileRecord } = await uploadImage(userId, file);
    await category.update({
        image: fileRecord.id,
    });

    await category.reload({
        include: [
            {
                model: CategoryModel,
                as: 'parent',
                attributes: ['id', 'name', 'slug'],
            },
            {
                model: CategoryModel,
                as: 'children',
                attributes: ['id', 'name', 'slug'],
            }
        ],
    });

    return successResponse(res, {
        message: req.t('category:image_uploaded'),
        data: {
            category: {
                ...category.toJSON(),
                image: await getFileUrl((category as any).image),
            },
        }
    });
});

export const deleteCategoryAvatar = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await CategoryModel.findByPk(id);

    if (!category) {
        throw new NotFoundError(req.t('category:category_not_found'));
    }

    if (!(category as any).image) {
        throw new ValidationError(req.t('category:no_image_to_delete'));
    }

    await deleteFile((category as any).image);

    await category.update({
        image: null,
    });

    await category.reload({
        include: [
            {
                model: CategoryModel,
                as: 'parent',
                attributes: ['id', 'name', 'slug'],
            },
            {
                model: CategoryModel,
                as: 'children',
                attributes: ['id', 'name', 'slug'],
            }
        ],
    });

    return successResponse(res, {
        message: req.t('category:image_deleted'),
        data: {
            category: {
                ...category.toJSON(),
                image: await getFileUrl((category as any).image),
            }
        }
    });
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await CategoryModel.findByPk(id, {
        include: [
            {
                model: CategoryModel,
                as: 'parent',
                attributes: ['id', 'name', 'slug'],
            },
            {
                model: CategoryModel,
                as: 'children',
                attributes: ['id', 'name', 'slug'],
            }
        ],
    });

    if (!category) {
        throw new NotFoundError(req.t('category:category_not_found'));
    }

    return successResponse(res, {
        message: req.t('category:category_fetched'),
        data: {
            category: {
                ...category.toJSON(),
                image: await getFileUrl((category as any).image),
            }
        }
    });
});

export const softdeleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await CategoryModel.findByPk(id, {
        include: [
            {
                model: CategoryModel,
                as: 'children',
            }
        ],
    });

    if (!category) {
        throw new NotFoundError(req.t('category:category_not_found'));
    }

    if ((category as any).children && (category as any).children.length > 0) {
        throw new ValidationError(req.t('category:has_children'));
    }

    await category.destroy();

    return successResponse(res, {
        message: req.t('category:category_deleted'),
        data: null,
    });
});

export const hardDeleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await CategoryModel.findByPk(id, {
        paranoid: false,
        include: [
            {
                model: CategoryModel,
                as: 'children',
                paranoid: false,
            }
        ],
    });

    if (!category) {
        throw new NotFoundError(req.t('category:category_not_found'));
    }

    if ((category as any).deleted_at === null) {
        throw new ValidationError(req.t('category:must_soft_delete_first'));
    }

    if ((category as any).children && (category as any).children.length > 0) {
        throw new ValidationError(req.t('category:has_children'));
    }

    await deleteFile((category as any).image);
    await category.destroy({ force: true });

    return successResponse(res, {
        message: req.t('category:category_hard_deleted'),
        data: null,
    });
});

export const restoreCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await CategoryModel.findByPk(id, {
        paranoid: false,
        include: [
            {
                model: CategoryModel,
                as: 'parent',
                attributes: ['id', 'name', 'slug'],
            },
            {
                model: CategoryModel,
                as: 'children',
                attributes: ['id', 'name', 'slug'],
            }
        ],
    });

    if (!category) {
        throw new NotFoundError(req.t('category:category_not_found'));
    }

    if ((category as any).deleted_at === null) {
        throw new ValidationError(req.t('category:category_not_deleted'));
    }

    await category.restore();

    await category.reload({
        include: [
            {
                model: CategoryModel,
                as: 'parent',
                attributes: ['id', 'name', 'slug'],
            },
            {
                model: CategoryModel,
                as: 'children',
                attributes: ['id', 'name', 'slug'],
            }
        ],
    });

    return successResponse(res, {
        message: req.t('category:category_restored'),
        data: {
            category: {
                ...category.toJSON(),
                image: await getFileUrl((category as any).image),
            }
        }
    });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        name,
        slug,
        parent_id,
    } = req.body;

    const category = await CategoryModel.findByPk(id);

    if (!category) {
        throw new NotFoundError(req.t('category:category_not_found'));
    }

    if (slug && slug !== (category as any).slug) {
        const existingCategory = await CategoryModel.findOne({
            where: {
                slug,
                id: { [Op.ne]: id }
            }
        });
        if (existingCategory) {
            throw new ValidationError(req.t('category:slug_exists'));
        }
    }

    if (parent_id !== undefined) {
        if (parent_id === id) {
            throw new ValidationError(req.t('category:cannot_be_self_parent'));
        }
        if (parent_id) {
            const parentCategory = await CategoryModel.findByPk(parent_id);
            if (!parentCategory) {
                throw new ValidationError(req.t('category:parent_not_found'));
            }
        }
    }

    await category.update({
        ...(name && { name }),
        ...(slug && { slug }),
        ...(parent_id !== undefined && { parent_id: parent_id || null }),
    });

    await category.reload({
        include: [
            {
                model: CategoryModel,
                as: 'parent',
                attributes: ['id', 'name', 'slug'],
            },
            {
                model: CategoryModel,
                as: 'children',
                attributes: ['id', 'name', 'slug'],
            }
        ],
    });

    return successResponse(res, {
        message: req.t('category:category_updated'),
        data: {
            category: {
                ...category.toJSON(),
                image: await getFileUrl((category as any).image),
            }
        }
    });
});
