import { UserModel, RoleModel, PermissionModel } from "../models";
import { Request, Response } from "express"
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { getAccesstoken } from '../utils/getAccesstoken';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../exception/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from "../utils/responseFormatter";
import redisClient from "../database/redisClient";
import redisKey from "../constants/keyRedis";
import { sendMail } from "../services/mailService";
import { parseUserAgent } from "../utils/parseUserAgent";

dotenv.config();

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 300;

const login = asyncHandler(async (req: Request, res: Response) => {
    const { 
        email, 
        password,
        remember_me,
    } = req.body;

    const user = await UserModel.findOne({
        where: { email },
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
        throw new NotFoundError(req.t('auth:user_not_found'));

    const isMatchPassword = await bcrypt.compare(password, (user as any).password);
    if (!isMatchPassword)
        throw new UnauthorizedError(req.t('auth:invalid_credentials'));

    const userRoles = (user as any).roles || [];
    const roleNames = userRoles.map((role: any) => role.name);

    const allPermissions = new Set<string>();
    userRoles.forEach((role: any) => {
        if (role.permissions && role.permissions.length > 0) {
            role.permissions.forEach((permission: any) => {
                allPermissions.add(permission.name);
            });
        }
    });
    const permissionNames = Array.from(allPermissions);

    return successResponse(res, {
        code: 200,
        message: req.t('auth:login_successful'),
        data: {
            user: {
                ...user.toJSON(),
                password: undefined,
            },
            auth: {
                access_token: await getAccesstoken((user as any).id, roleNames, permissionNames, false),
                refresh_token: await getAccesstoken((user as any).id, roleNames, permissionNames, true),
                expires_in: 600,
            }
        }
    });
});

const loginSocial = asyncHandler(async (req: Request, res: Response) => {
    const provider = req.params.provider;
    const { firstname, lastname, email, photoUrl } = req.body;

    let user = await UserModel.findOne({
        where: { email },
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

    if (!user) {
        user = await UserModel.create({
            email,
            firstname: firstname,
            lastname: lastname,
            photoUrl: photoUrl,
            password: null
        });

        user = await UserModel.findOne({
            where: { id: (user as any).id },
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
    }

    if (!user) {
        throw new NotFoundError(req.t('auth:user_not_found'));
    }

    const userRoles = (user as any).roles || [];
    const roleNames = userRoles.map((role: any) => role.name);

    const allPermissions = new Set<string>();
    userRoles.forEach((role: any) => {
        if (role.permissions && role.permissions.length > 0) {
            role.permissions.forEach((permission: any) => {
                allPermissions.add(permission.name);
            });
        }
    });
    const permissionNames = Array.from(allPermissions);

    return successResponse(res, {
        code: 201,
        message: req.t('auth:login_successful'),
        data: {
            user: {
                ...user.toJSON(),
                password: undefined,
            },
            auth: {
                access_token: await getAccesstoken((user as any).id, roleNames, permissionNames, false),
                refresh_token: await getAccesstoken((user as any).id, roleNames, permissionNames, true),
                expires_in: 600,
            }
        }
    });
});

const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refresh_token } = req.body;

    let decoded: any;
    try {
        decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET as string) as any;
    } catch (err) {
        throw new UnauthorizedError(req.t('auth:invalid_refresh_token'));
    }

    const userId = decoded.sub;
    const user = await UserModel.findByPk(userId, {
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

    if (!user) {
        throw new NotFoundError(req.t('auth:user_not_found'));
    }

    const userRoles = (user as any).roles || [];
    const roleNames = userRoles.map((role: any) => role.name);

    const allPermissions = new Set<string>();
    userRoles.forEach((role: any) => {
        if (role.permissions && role.permissions.length > 0) {
            role.permissions.forEach((permission: any) => {
                allPermissions.add(permission.name);
            });
        }
    });
    const permissionNames = Array.from(allPermissions);

    return successResponse(res, {
        code: 200,
        message: req.t('auth:token_refreshed'),
        data: {
            user: {
                ...user.toJSON(),
                password: undefined,
            },
            auth: {
                access_token: await getAccesstoken((user as any).id, roleNames, permissionNames, false),
                refresh_token: await getAccesstoken((user as any).id, roleNames, permissionNames, true),
                expires_in: 600,
            }
        }
    });
});

const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user: any = await UserModel.findOne({ where: { email } });

    if (!user) {
        throw new NotFoundError(req.t('auth:user_not_found'));
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOTP = await bcrypt.hash(otp, 10);

    const resetPassword = redisKey.RESET_PASSWORD(user.id);
    await redisClient.setEx(
        resetPassword,
        WINDOW_SECONDS,
        hashedOTP
    );

    const templatePath = path.join(__dirname, '../forms/mail_reset_password.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8');
    const { operatingSystem, browserName } = parseUserAgent(req.headers['user-agent'] || '');
    htmlTemplate = htmlTemplate
        .replace('{{name}}', user.firstname || 'User')
        .replace('{{reset_code}}', otp)
        .replace('{{time}}', String(WINDOW_SECONDS / 60))
        .replace('{{operating_system}}', operatingSystem)
        .replace('{{browser_name}}', browserName)
        .replace('{{support_url}}', process.env.SUPPORT_URL || 'mailto:');

    await sendMail({
        fromName: req.t('common:hiki_support'),
        to: email,
        subject: req.t('auth:reset_password_email_subject'),
        html: htmlTemplate,
    });

    return successResponse(res, {
        code: 200,
        message: req.t('auth:reset_link_sent'),
        data: {
            email,
            ...(process.env.NODE_ENV === 'development' ? { otp } : {}),
            max_attempts: MAX_ATTEMPTS,
            expires_in: WINDOW_SECONDS,
        },
    });
});

const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp, password } = req.body;

    const user: any = await UserModel.findOne({ where: { email } });

    if (!user)
        throw new NotFoundError(req.t("auth:user_not_found"));

    const resetPassword = redisKey.RESET_PASSWORD(user.id);
    const attemptsKey = redisKey.OTP_ATTEMPTS_RESET_PASSWORD(user.id);

    const attempts = Number(await redisClient.get(attemptsKey)) || 0;

    if (attempts >= MAX_ATTEMPTS) {
        throw new UnauthorizedError(req.t("auth:too_many_requests"));
    }

    const hashedToken = await redisClient.get(resetPassword);
    if (!hashedToken)
        throw new UnauthorizedError(req.t("auth:otp_expired_or_invalid"));

    const isMatch = await bcrypt.compare(otp, hashedToken);

    if (!isMatch) {
        const newAttempts = await redisClient.incr(attemptsKey);

        if (newAttempts === 1)
            await redisClient.expire(attemptsKey, WINDOW_SECONDS);

        if (newAttempts >= MAX_ATTEMPTS)
            throw new UnauthorizedError(req.t("auth:too_many_attempts", { max: MAX_ATTEMPTS, window: WINDOW_SECONDS / 60 }));

        throw new UnauthorizedError(req.t("auth:otp_invalid"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ password: hashedPassword });

    await redisClient.del(resetPassword);
    await redisClient.del(attemptsKey);

    return successResponse(res, {
        code: 200,
        message: req.t('auth:password_reset_successful'),
    });
});

export {
    login,
    loginSocial,
    refreshToken,
    forgotPassword,
    resetPassword,
};