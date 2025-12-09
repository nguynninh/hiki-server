import { Request, Response } from "express";
import { AttributeModel, AttributeValueModel } from "../models";
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/responseFormatter';
import { ValidationError, NotFoundError } from "../exception/AppError";
import { Op } from 'sequelize';
import Pagination from "../dto/Pagination";

export const createAttribute = asyncHandler(async (req: Request, res: Response) => {
    const { name, values } = req.body; // values can be an array of strings
    console.log('createAttribute payload:', { name, values });

    if (!name) throw new ValidationError(req.t('attribute:name_required'));

    let attribute = await AttributeModel.findOne({ where: { name } });
    if (!attribute) {
        attribute = await AttributeModel.create({ name });
    }

    if (values && Array.isArray(values) && values.length > 0) {
        const uniqueValues = [...new Set(values)].filter(v => v);

        for (const val of uniqueValues) {
            const existingValue = await AttributeValueModel.findOne({
                where: { attribute_id: (attribute as any).id, value: val }
            });
            if (!existingValue) {
                await AttributeValueModel.create({
                    attribute_id: (attribute as any).id,
                    value: val
                });
            }
        }
    }

    const result = await AttributeModel.findByPk((attribute as any).id, {
        include: [{ model: AttributeValueModel, as: 'values' }]
    });

    return successResponse(res, {
        code: 200,
        message: req.t('attribute:created'),
        data: result
    });
});

export const getListAttributes = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
        where.name = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await AttributeModel.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
        include: [{ model: AttributeValueModel, as: 'values' }]
    });

    return successResponse(res, {
        message: req.t('attribute:list_fetched'),
        data: {
            attributes: rows,
            paginations: Pagination(Number(page), Number(limit), count)
        }
    });
});

export const getAttribute = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const attribute = await AttributeModel.findByPk(id, {
        include: [{ model: AttributeValueModel, as: 'values' }]
    });

    if (!attribute) throw new NotFoundError(req.t('attribute:not_found'));

    return successResponse(res, {
        message: req.t('attribute:fetched'),
        data: attribute
    });
});

export const updateAttribute = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, values } = req.body;

    const attribute = await AttributeModel.findByPk(id);
    if (!attribute) throw new NotFoundError(req.t('attribute:not_found'));

    if (name) {
        await attribute.update({ name });
    }

    if (values && Array.isArray(values)) {
        await AttributeValueModel.destroy({ where: { attribute_id: id } });
        const valueRecords = values.map((val: string) => ({
            value: val,
            attribute_id: id,
        }));
        await AttributeValueModel.bulkCreate(valueRecords);
    }

    const updated = await AttributeModel.findByPk(id, {
        include: [{ model: AttributeValueModel, as: 'values' }]
    });

    return successResponse(res, {
        message: req.t('attribute:updated'),
        data: updated
    });
});

export const deleteAttribute = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const attribute = await AttributeModel.findByPk(id);
    if (!attribute) throw new NotFoundError(req.t('attribute:not_found'));

    await attribute.destroy();
    return successResponse(res, {
        message: req.t('attribute:deleted')
    });
});
