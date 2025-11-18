import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../exception/AppError';

export const validateCreateCategory = (req: Request, res: Response, next: NextFunction) => {
    const categorySchema = Joi.object({
        name: Joi.string()
            .max(100)
            .required()
            .messages({
                'string.empty': req.t('category:name_required'),
                'string.max': req.t('category:name_max_length', { max: 100 }),
                'any.required': req.t('category:name_required'),
            }),
        slug: Joi.string()
            .max(100)
            .required()
            .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
            .messages({
                'string.empty': req.t('category:slug_required'),
                'string.max': req.t('category:slug_max_length', { max: 100 }),
                'string.pattern.base': req.t('category:slug_invalid_format'),
                'any.required': req.t('category:slug_required'),
            }),
        parent_id: Joi.string()
            .uuid()
            .optional()
            .allow(null)
            .messages({
                'string.guid': req.t('category:parent_id_invalid'),
            })
    });

    const { error } = categorySchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errors = error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message
        }));
        return next(new ValidationError(req.t('common:validation_error'), errors));
    }

    next();
};

export const validateDeleteCategories = (req: Request, res: Response, next: NextFunction) => {
    const bodySchema = Joi.object({
        ids: Joi.array()
            .items(Joi.string().uuid())
            .min(1)
            .required()
            .messages({
                'array.base': req.t('category:ids_must_be_array'),
                'array.min': req.t('category:ids_min_length'),
                'string.guid': req.t('category:id_invalid'),
                'any.required': req.t('category:ids_required'),
            }),
    });

    const { error } = bodySchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errors = error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message
        }));
        return next(new ValidationError(req.t('common:validation_error'), errors));
    }

    next();
};

export const validateGetCategory = (req: Request, res: Response, next: NextFunction) => {
    const paramsSchema = Joi.object({
        id: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': req.t('category:id_invalid'),
                'any.required': req.t('category:id_required'),
            }),
    });

    const { error } = paramsSchema.validate(req.params, { abortEarly: false });

    if (error) {
        const errors = error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message
        }));
        return next(new ValidationError(req.t('common:validation_error'), errors));
    }

    next();
};

export const validateSoftDeleteCategory = (req: Request, res: Response, next: NextFunction) => {
    const paramsSchema = Joi.object({
        id: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': req.t('category:id_invalid'),
                'any.required': req.t('category:id_required'),
            }),
    });

    const { error } = paramsSchema.validate(req.params, { abortEarly: false });

    if (error) {
        const errors = error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message
        }));
        return next(new ValidationError(req.t('common:validation_error'), errors));
    }

    next();
};

export const validateHardDeleteCategory = (req: Request, res: Response, next: NextFunction) => {
    const paramsSchema = Joi.object({
        id: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': req.t('category:id_invalid'),
                'any.required': req.t('category:id_required'),
            }),
    });

    const { error } = paramsSchema.validate(req.params, { abortEarly: false });

    if (error) {
        const errors = error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message
        }));
        return next(new ValidationError(req.t('common:validation_error'), errors));
    }

    next();
};

export const validateRestoreCategory = (req: Request, res: Response, next: NextFunction) => {
    const paramsSchema = Joi.object({
        id: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': req.t('category:id_invalid'),
                'any.required': req.t('category:id_required'),
            }),
    });

    const { error } = paramsSchema.validate(req.params, { abortEarly: false });

    if (error) {
        const errors = error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message
        }));
        return next(new ValidationError(req.t('common:validation_error'), errors));
    }

    next();
};

export const validateUpdateCategory = (req: Request, res: Response, next: NextFunction) => {
    const categorySchema = Joi.object({
        name: Joi.string()
            .max(100)
            .optional()
            .messages({
                'string.empty': req.t('category:name_required'),
                'string.max': req.t('category:name_max_length', { max: 100 }),
            }),
        slug: Joi.string()
            .max(100)
            .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
            .optional()
            .messages({
                'string.max': req.t('category:slug_max_length', { max: 100 }),
                'string.pattern.base': req.t('category:slug_invalid_format'),
            }),
        parent_id: Joi.string()
            .uuid()
            .optional()
            .allow(null)
            .messages({
                'string.guid': req.t('category:parent_id_invalid'),
            }),
    });

    const { error } = categorySchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errors = error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message
        }));
        return next(new ValidationError(req.t('common:validation_error'), errors));
    }

    next();
};
