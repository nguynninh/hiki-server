import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../exception/AppError';

export const validateCreateRole = (req: Request, res: Response, next: NextFunction) => {
    const roleSchema = Joi.object({
        name: Joi.string()
            .max(30)
            .required()
            .messages({
                'string.empty': req.t('role:name_required'),
                'string.max': req.t('role:name_max_length', { max: 30 }),
                'any.required': req.t('role:name_required'),
            }),
        description: Joi.string()
            .max(100)
            .optional()
            .messages({
                'string.max': req.t('role:description_max_length', { max: 100 }),
            }),
    });

    const { error } = roleSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errors = error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message
        }));
        return next(new ValidationError(req.t('common:validation_error'), errors));
    }

    next();
};