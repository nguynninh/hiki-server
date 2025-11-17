import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../exception/AppError';

const PASSWORD_MIN_LENGTH = 8;
const CODE_LENGTH = 6;

export const validateCreateUser = (req: Request, res: Response, next: NextFunction) => {
    const userSchema = Joi.object({
        email: Joi.string()
            .email({ tlds: { allow: false } })
            .required()
            .messages({
                'string.empty': req.t('user:email_required'),
                'string.email': req.t('user:email_invalid'),
                'any.required': req.t('user:email_required'),
            }),
        password: Joi.string()
            .min(PASSWORD_MIN_LENGTH)
            .required()
            .messages({
                'string.empty': req.t('user:password_required'),
                'string.min': req.t('user:password_min_length', { min: PASSWORD_MIN_LENGTH }),
                'any.required': req.t('user:password_required'),
            }),
        firstname: Joi.string()
            .max(30)
            .required()
            .messages({
                'string.empty': req.t('user:first_name_required'),
                'string.max': req.t('user:first_name_max_length', { max: 30 }),
                'any.required': req.t('user:first_name_required'),
            }),
        lastname: Joi.string()
            .max(30)
            .required()
            .messages({
                'string.empty': req.t('user:last_name_required'),
                'string.max': req.t('user:last_name_max_length', { max: 30 }),
                'any.required': req.t('user:last_name_required'),
            }),
        code: Joi.string()
            .length(CODE_LENGTH)
            .required()
            .messages({
                'string.empty': req.t('user:code_required'),
                'string.length': req.t('user:code_length', { length: CODE_LENGTH }),
                'any.required': req.t('user:code_required'),
            }),
    });

    const { error } = userSchema.validate(req.body, { abortEarly: false });

    if (error) {
        const errors = error.details.map((d) => ({
            field: d.path.join('.'),
            message: d.message
        }));
        return next(new ValidationError(req.t('common:validation_error'), errors));
    }

    next();
};

export const validateGetUser = (req: Request, res: Response, next: NextFunction) => {
  const idSchema = Joi.object({
    id: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': req.t('user:id_required'),
        'string.guid': req.t('user:id_invalid'),
        'any.required': req.t('user:id_required'),
      }),
  });

  const { error } = idSchema.validate(req.body, { abortEarly: false }); 

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message
    }));
    return next(new ValidationError(req.t('common:validation_error'), errors));
  }

  next();
};

export const validateChangePassword = (req: Request, res: Response, next: NextFunction) => {
  const userSchema = Joi.object({
    oldPassword: Joi.string()
      .min(PASSWORD_MIN_LENGTH)
      .required()
      .messages({
        'string.empty': req.t('user:old_password_required'),
        'string.min': req.t('user:old_password_min_length', { min: PASSWORD_MIN_LENGTH }),
        'any.required': req.t('user:old_password_required'),
      }),
    newPassword: Joi.string()
      .min(PASSWORD_MIN_LENGTH)
      .required()
      .messages({
        'string.empty': req.t('user:new_password_required'),
        'string.min': req.t('user:new_password_min_length', { min: PASSWORD_MIN_LENGTH }),
        'any.required': req.t('user:new_password_required'),
      }),
  });

  const { error } = userSchema.validate(req.body, { abortEarly: false }); 

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message
    }));
    return next(new ValidationError(req.t('common:validation_error'), errors));
  }

  next();
};

export const validateVerifyUser = (req: Request, res: Response, next: NextFunction) => {
  const userSchema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        'string.empty': req.t('user:email_required'),
        'string.email': req.t('user:email_invalid'),
        'any.required': req.t('user:email_required'),
      }),
  });

  const { error } = userSchema.validate(req.body, { abortEarly: false }); 

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message
    }));
    return next(new ValidationError(req.t('common:validation_error'), errors));
  }

  next();
};

export const validateAvatar = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next(new ValidationError(req.t('user:avatar_required')));
  }

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024;

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return next(new ValidationError(req.t('user:avatar_invalid_type')));
  }

  if (req.file.size > maxSize) {
    return next(new ValidationError(req.t('user:avatar_too_large', { max: `${maxSize / (1024 * 1024)}MB` })));
  }

  next();
};

export const validateCreateFollow = (req: Request, res: Response, next: NextFunction) => {
  const followSchema = Joi.object({
    targetId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': req.t('user:target_id_required'),
        'string.guid': req.t('user:target_id_invalid'),
        'any.required': req.t('user:target_id_required'),
      }),
  });

  const { error } = followSchema.validate(req.params, { abortEarly: false }); 

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message
    }));
    return next(new ValidationError(req.t('common:validation_error'), errors));
  }

  next();
};

export const validateUnfollow = (req: Request, res: Response, next: NextFunction) => {
  const followSchema = Joi.object({
    targetId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': req.t('user:target_id_required'),
        'string.guid': req.t('user:target_id_invalid'),
        'any.required': req.t('user:target_id_required'),
      }),
  });

  const { error } = followSchema.validate(req.params, { abortEarly: false }); 

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message
    }));
    return next(new ValidationError(req.t('common:validation_error'), errors));
  }

  next();
};