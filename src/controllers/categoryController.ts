import { CategoryModel } from "../models";
import { Request, Response } from "express";
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/responseFormatter';
import { ValidationError } from "../exception/AppError";

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
