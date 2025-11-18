import { CategoryModel } from "../models";
import { Request, Response } from "express";
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/responseFormatter';
import { ValidationError, NotFoundError } from "../exception/AppError";
import { Op } from 'sequelize';
import Pagination from "../dto/Pagination";

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
            category: category.toJSON(),
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
            categories,
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
