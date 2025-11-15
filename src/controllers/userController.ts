import { UserModel, RoleModel, PermissionModel } from "../models";
import { Request, Response } from "express";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/responseFormatter';
import { NotFoundError, ValidationError, UnauthorizedError } from "../exception/AppError";
import redisClient from "../database/redisClient";
import redisKey from "../constants/keyRedis";
import { sendMail } from "../services/mailService";
import { uploadImage } from "../services/fileService";
import generateCode from "../utils/generateCode";
import { parseUserAgent } from "../utils/parseUserAgent";
import roles from "../constants/appRoles";

dotenv.config();

const VERIFY_CREATE_MAX_ATTEMPTS = 5;
const VERIFY_CREATE_WINDOW_SECONDS = 300;

const createUser = asyncHandler(async (req: Request, res: Response) => {
    const {
        email,
        code,
        password,
        firstname,
        lastname,
    } = req.body;

    let user: any = await UserModel.findOne({ where: { email } });
    if (user)
        throw new ValidationError(req.t('user:email_exists'));

    const rd_verify_user = redisKey.OTP_CREATE_ACCOUNT(email);
    const attemptsKey = redisKey.OTP_ATTEMPTS_CREATE_ACCOUNT(email);

    const attempts = Number(await redisClient.get(attemptsKey)) || 0;

    if (attempts >= VERIFY_CREATE_MAX_ATTEMPTS) {
        throw new UnauthorizedError(req.t("auth:too_many_requests"));
    }

    const hashedCode = await redisClient.get(rd_verify_user);
    if (!hashedCode)
        throw new UnauthorizedError(req.t("auth:otp_expired_or_invalid"));

    const isMatch = await bcrypt.compare(code, hashedCode);

    if (!isMatch) {
        const newAttempts = await redisClient.incr(attemptsKey);

        if (newAttempts === 1)
            await redisClient.expire(attemptsKey, VERIFY_CREATE_WINDOW_SECONDS);

        if (newAttempts >= VERIFY_CREATE_MAX_ATTEMPTS)
            throw new UnauthorizedError(req.t("auth:too_many_attempts", { max: VERIFY_CREATE_MAX_ATTEMPTS, window: VERIFY_CREATE_WINDOW_SECONDS / 60 }));

        throw new UnauthorizedError(req.t("auth:otp_invalid"));
    }

    user = await UserModel.create({
        email,
        password: await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS) || 10),
        firstname,
        lastname,
    });

    const userRole = await RoleModel.findOne({ where: { name: roles.USER } });
    if (userRole) {
        await (user as any).addRole(userRole);
    }

    await user.reload({
        include: [{
            model: RoleModel,
            as: 'roles',
            attributes: ['id', 'name'],
            through: { attributes: [] },
            include: [{
                model: PermissionModel,
                as: 'permissions',
                attributes: ['id', 'name'],
                through: { attributes: [] }
            }]
        }]
    });

    await redisClient.del(rd_verify_user);
    await redisClient.del(attemptsKey);

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

const verifyUser = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await UserModel.findOne({ where: { email } });
    if (user)
        throw new ValidationError(req.t('user:email_already_in_use'));

    const code = generateCode(6);

    const hashedCode = await bcrypt.hash(code, 10);

    const rd_verify_user = redisKey.OTP_CREATE_ACCOUNT(email);
    await redisClient.setEx(
        rd_verify_user,
        VERIFY_CREATE_WINDOW_SECONDS,
        hashedCode
    );

    const templatePath = path.join(__dirname, '../forms/mail_create_account.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
    const { operatingSystem, browserName } = parseUserAgent(req.headers['user-agent'] || '');
    htmlTemplate = htmlTemplate
        .replace(/{{name}}/g, email.split('@')[0])
        .replace(/{{verification_code}}/g, code)
        .replace(/{{expiry_time}}/g, String(VERIFY_CREATE_WINDOW_SECONDS / 60))
        .replace(/{{operating_system}}/g, operatingSystem)
        .replace(/{{browser_name}}/g, browserName);

    await sendMail({
        fromName: req.t('common:hiki_support'),
        to: email,
        subject: req.t('user:verification_code_subject'),
        html: htmlTemplate,
    });

    return successResponse(res, {
        message: req.t('user:verification_code_sent'),
        data: {
            email,
            ...(process.env.NODE_ENV === 'development' ? { code } : {}),
            max_attempts: VERIFY_CREATE_MAX_ATTEMPTS,
            expires_in: VERIFY_CREATE_WINDOW_SECONDS,
        }
    });
});

const getMe = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.sub;

    const user = await UserModel.findOne({
        where: { id: userId },
        include: [{
            model: RoleModel,
            as: 'roles',
            attributes: ['id', 'name'],
            through: { attributes: [] },
            include: [{
                model: PermissionModel,
                as: 'permissions',
                attributes: ['id', 'name'],
                through: { attributes: [] }
            }]
        }]
    });

    if (!user)
        throw new NotFoundError(req.t('user:user_not_found'));

    return successResponse(res, {
        code: 200,
        message: req.t('user:user_retrieved'),
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

const getListUsers = asyncHandler(async (req: Request, res: Response) => {
    const {
        page,
        limit,
        is_deleted,
    } = req.query;
    
    const whereClause: any = {};
    if (is_deleted !== undefined) {
        whereClause.is_deleted = is_deleted === 'true';
    }

    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const { rows: users, count: total } = await UserModel.findAndCountAll({
        where: whereClause,
        limit: limitNumber,
        offset,
        order: [['created_at', 'DESC']],
        include: [{
            model: RoleModel,
            as: 'roles',
            attributes: ['id', 'name'],
            through: { attributes: [] },
            where: {
                name: {
                    [require('sequelize').Op.ne]: roles.SUPER_ADMIN
                }
            },
            required: false
        }]
    });

    const filteredUsers = users.filter(user => {
        const userRoles = (user as any).roles || [];
        return !userRoles.some((role: any) => role.name === roles.SUPER_ADMIN);
    });

    const filteredTotal = total - (users.length - filteredUsers.length);

    return successResponse(res, {
        message: req.t('user:users_listed'),
        data: {
            users: filteredUsers.map(user => ({
                ...user.toJSON(),
                password: undefined,
            })),
            pagination: {
                total: filteredTotal,
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(filteredTotal / limitNumber),
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

const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    const avatar = req.file;

    if (!avatar) {
        throw new ValidationError(req.t('user:avatar_required'));
    }

    const user: any = await UserModel.findByPk(userId);

    if (!user) {
        throw new NotFoundError(req.t('auth:user_not_found'));
    }

    const { fileRecord, publicUrl } = await uploadImage(userId, avatar);

    return successResponse(res, {
        code: 200,
        message: req.t('user:avatar_uploaded_successfully'),
        data: {
            avatar_url: publicUrl,
            fileRecord: fileRecord,
        }
    });
});

export {
    verifyUser,
    createUser,
    getUser,
    changePassword,
    getListUsers,
    uploadAvatar,
    getMe,
};