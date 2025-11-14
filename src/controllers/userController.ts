import { UserModel } from "../models";
import { Request, Response } from "express";
import dotenv from 'dotenv';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/responseFormatter';
import { NotFoundError, ValidationError } from "../exception/AppError";

dotenv.config();

const createUser = asyncHandler(async (req: Request, res: Response) => {
    const {
        email,
        password,
        firstname,
        lastname,
    } = req.body;

    let user: any = await UserModel.findOne({ where: { email } });
    if (user)
        throw new ValidationError(req.t('user:email_exists'));

    user = await UserModel.create({
        email,
        password,
        firstname,
        lastname,
    });

    await user.reload();

    return successResponse(res, {
        code: 201,
        message: req.t('user:user_created'),
        data: {
            user: {
                ...user.toJSON(),
                password: undefined,
            }
        }
    });
});

const getUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await UserModel.findByPk(id);
    if (!user)
        throw new NotFoundError(req.t('user:user_not_found'));

    return successResponse(res, {
        message: req.t('user:user_getted'),
        data: {
            user: {
                ...user.toJSON(),
                password: undefined,
            }
        }
    });
});

export {
    createUser,
    getUser,
};