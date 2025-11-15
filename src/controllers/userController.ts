import { UserModel } from "../models";
import { Request, Response } from "express";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/responseFormatter';
import { NotFoundError, ValidationError, UnauthorizedError } from "../exception/AppError";

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
        password: await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS) || 10),
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

const changePassword = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;

    const { oldPassword, newPassword } = req.body;

    const user: any = await UserModel.findByPk(userId);

    if (!user) {
        throw new NotFoundError(req.t('auth:user_not_found'));
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
        throw new UnauthorizedError(req.t('auth:incorrect_old_password'));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({ password: hashedPassword });

    return successResponse(res, {
        code: 200,
        message: req.t('auth:password_change_successful'),
    });
});

export {
    createUser,
    getUser,
    changePassword,
};