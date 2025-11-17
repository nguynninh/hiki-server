import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../exception/AppError';

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

export const validateGetUserRelationship = (req: Request, res: Response, next: NextFunction) => {
  const relationshipSchema = Joi.object({
    targetId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': req.t('user:target_id_required'),
        'string.guid': req.t('user:target_id_invalid'),
        'any.required': req.t('user:target_id_required'),
      }),
  });

  const { error } = relationshipSchema.validate(req.params, { abortEarly: false }); 

  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message
    }));
    return next(new ValidationError(req.t('common:validation_error'), errors));
  }

  next();
};

export const validateCreateBlock = (req: Request, res: Response, next: NextFunction) => {
  const blockSchema = Joi.object({
    targetId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': req.t('user:target_id_required'),
        'string.guid': req.t('user:target_id_invalid'),
        'any.required': req.t('user:target_id_required'),
      }),
  });

  const { error } = blockSchema.validate(req.params, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message
    }));
    return next(new ValidationError(req.t('common:validation_error'), errors));
  }

  next();
};

export const validateUnBlock = (req: Request, res: Response, next: NextFunction) => {
  const blockSchema = Joi.object({
    targetId: Joi.string()
      .uuid()
      .required()
      .messages({
        'string.empty': req.t('user:target_id_required'),
        'string.guid': req.t('user:target_id_invalid'),
        'any.required': req.t('user:target_id_required'),
      }),
  });

  const { error } = blockSchema.validate(req.params, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message
    }));
    return next(new ValidationError(req.t('common:validation_error'), errors));
  }

  next();
};