import { UserModel, RoleModel, PermissionModel, AvatarDefaultModel, FileMgmtModel } from "../models";
import { Request, Response } from "express";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/responseFormatter';
import { NotFoundError, ValidationError, UnauthorizedError } from "../exception/AppError";
import redisClient from "../database/redisClient";
import redisKey from "../constants/keyRedis";
import { sendMail } from "../services/mailService";
import { deleteFile, getFileUrl, uploadImage } from "../services/fileService";
import generateCode from "../utils/generateCode";
import { parseUserAgent } from "../utils/parseUserAgent";
import roles from "../constants/appRoles";
import Pagination from "../dto/Pagination";

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
            },
        }
    });
});

const verifyUser = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const user = await UserModel.findOne({ where: { email } });
    if (user)
        throw new ValidationError(req.t('user:email_already_in_use'));

    const rd_verify_user = redisKey.OTP_CREATE_ACCOUNT(email);

    const existingOTP = await redisClient.get(rd_verify_user);
    if (existingOTP) {
        throw new ValidationError(req.t("user:otp_already_sent"));
    }

    const code = generateCode(6);

    const hashedCode = await bcrypt.hash(code, 10);

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

    const user: any = await UserModel.findOne({
        where: { id: userId },
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
                avatar: await getFileUrl(user.avatar),
            }
        }
    });
});

const getUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user: any = await UserModel.findByPk(id, {
        include: [{
            model: RoleModel,
            as: 'roles',
            attributes: ['id', 'name'],
            through: { attributes: [] },
        }],
    });
    if (!user)
        throw new NotFoundError(req.t('user:user_not_found'));

    const avatarUrl = user.avatar ? await getFileUrl(user.avatar) : null;

    return successResponse(res, {
        message: req.t('user:user_getted'),
        data: {
            user: {
                ...user.toJSON(),
                password: undefined,
                avatar: avatarUrl,
                roles: user.roles || [],
            }
        }
    });
});

const getListUsers = asyncHandler(async (req: Request, res: Response) => {
    const {
        page,
        limit,
        is_deleted,
        q,
        roles,
        seller_request_status,
    } = req.query;

    const whereClause: any = {};

    let paranoid = true;
    if (is_deleted === 'all') {
        paranoid = false;
    } else if (is_deleted === 'true') {
        paranoid = false;
        whereClause.deleted_at = { [Op.not]: null };
    }

    if (seller_request_status) {
        whereClause.seller_request_status = seller_request_status;
    }

    if (q) {
        whereClause[Op.or] = [
            { firstname: { [Op.iLike]: `%${q}%` } },
            { lastname: { [Op.iLike]: `%${q}%` } },
            { email: { [Op.iLike]: `%${q}%` } }
        ];
    }

    const roleWhereClause: any = {};
    if (roles && roles !== 'all') {
        roleWhereClause.name = { [Op.iLike]: roles };
    }

    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const { rows: users, count: total } = await UserModel.findAndCountAll({
        where: whereClause,
        limit: limitNumber,
        offset,
        paranoid,
        order: [['created_at', 'DESC']],
        include: [{
            model: RoleModel,
            as: 'roles',
            attributes: ['id', 'name'],
            through: { attributes: [] },
            where: roleWhereClause,
        }],
    });

    return successResponse(res, {
        message: req.t('user:users_listed'),
        data: {
            users: await Promise.all(users.map(async (user) => ({
                ...user.toJSON(),
                password: undefined,
                avatar: await getFileUrl((user as any).avatar),
            }))),
            paginations: Pagination(
                pageNumber,
                limitNumber,
                total,
            ),
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

    const { fileRecord } = await uploadImage(userId, avatar);

    if (user.avatar)
        await deleteFile(user.avatar);

    await user.update({ avatar: fileRecord.id });

    return successResponse(res, {
        code: 200,
        message: req.t('user:avatar_uploaded'),
        data: {
            user: {
                ...user.toJSON(),
                password: undefined,
                avatar: await getFileUrl(user.avatar),
            },
        }
    });
});

const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        firstname,
        lastname,
        email,
        password,
        roles,
    } = req.body;

    const user: any = await UserModel.findByPk(id);

    if (!user) {
        throw new NotFoundError(req.t('user:user_not_found'));
    }

    if (email && email !== user.email) {
        const existingUser = await UserModel.findOne({ where: { email } });
        if (existingUser) {
            throw new ValidationError(req.t('user:email_exists'));
        }
        user.email = email;
    }

    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (password) {
        user.password = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS) || 10);
    }

    await user.save();

    if (roles && Array.isArray(roles)) {
        const roleRecords = await RoleModel.findAll({
            where: {
                name: roles,
            },
        });
        await (user as any).setRoles(roleRecords);
    }

    await user.reload({
        include: [{
            model: RoleModel,
            as: 'roles',
            attributes: ['id', 'name'],
            through: { attributes: [] },
        }]
    });

    return successResponse(res, {
        code: 200,
        message: req.t('user:user_updated_successfully'),
        data: {
            user: {
                ...user.toJSON(),
                password: undefined,
            },
        }
    });
});

const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user: any = await UserModel.findByPk(id);

    if (!user || user.deleted_at) {
        throw new NotFoundError(req.t('user:user_not_found'));
    }

    await user.destroy();

    return successResponse(res, {
        code: 200,
        message: req.t('user:user_deleted_successfully'),
    });
});

const restoreUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user: any = await UserModel.findByPk(id, { paranoid: false });

    if (!user || !user.deleted_at) {
        throw new NotFoundError(req.t('user:user_not_found'));
    }

    await user.restore();

    return successResponse(res, {
        code: 200,
        message: req.t('user:user_restored_successfully'),
    });
});

const createAvatarDefault = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    const file = req.file;
    const { name } = req.body;

    if (!file) {
        throw new ValidationError(req.t('user:avatar_required'));
    }

    const { fileRecord } = await uploadImage(userId!, file);

    const avatarDefault = await AvatarDefaultModel.create({
        file_id: fileRecord.id,
        created_by: userId,
        name: name || file.originalname,
    });

    return successResponse(res, {
        code: 201,
        message: req.t('user:avatar_default_created'),
        data: {
            avatar: {
                id: avatarDefault.getDataValue('id'),
                url: await getFileUrl(fileRecord.id),
                name: avatarDefault.getDataValue('name'),
            }
        }
    });
});

const getListAvatarDefault = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    const {
        q = '',
        page = 1,
        limit = 10,
    } = req.query;

    const avatarDefaults = await AvatarDefaultModel.findAll({
        where: {
            created_by: userId,
            ...(q ? { name: { [Op.iLike]: `%${q}%` } } : {}),
        },
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
    });

    return successResponse(res, {
        code: 200,
        message: req.t('user:avatar_defaults_listed'),
        data: {
            avatar_defaults: await Promise.all(avatarDefaults.map(async (avatarDefault: any) => ({
                ...avatarDefault.toJSON(),
                url: await getFileUrl(avatarDefault.file_id),
            }))),
            pagination: Pagination(
                Number(page),
                Number(limit),
                avatarDefaults.length,
            ),
        }
    });
});

const deleteAvatarDefault = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const avatarDefault: any = await AvatarDefaultModel.findOne({ where: { id } });
    if (!avatarDefault)
        throw new NotFoundError(req.t('user:avatar_default_not_found'));

    await deleteFile(avatarDefault.file_id);
    await avatarDefault.destroy();

    return successResponse(res, {
        code: 200,
        message: req.t('user:avatar_default_deleted'),
    });
});

export {
    verifyUser,
    createUser,
    updateUser,
    deleteUser,
    restoreUser,
    getUser,
    changePassword,
    getListUsers,
    uploadAvatar,
    getMe,
    createAvatarDefault,
    getListAvatarDefault,
    deleteAvatarDefault,
    requestSeller,
    approveSeller,
    rejectSeller
};

const requestSeller = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    const user: any = await UserModel.findByPk(userId);

    if (!user) throw new NotFoundError(req.t('user:user_not_found'));

    if (user.seller_request_status === 'pending') {
        throw new ValidationError(req.t('user:seller_request_already_pending'));
    }

    if (user.seller_request_status === 'approved') {
        throw new ValidationError(req.t('user:already_seller'));
    }

    user.seller_request_status = 'pending';
    await user.save();

    return successResponse(res, {
        message: req.t('user:seller_request_submitted'),
    });
});

const approveSeller = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user: any = await UserModel.findByPk(id);

    if (!user) throw new NotFoundError(req.t('user:user_not_found'));

    user.seller_request_status = 'approved';
    await user.save();

    // Assign SELLER role
    const sellerRole = await RoleModel.findOne({ where: { name: roles.SELLER } });
    if (sellerRole) {
        await (user as any).addRole(sellerRole);
        // Ensure USER role is kept or logic depending on requirements. 
        // Typically sellers are also users.
    }

    return successResponse(res, {
        message: req.t('user:seller_approved'),
    });
});

const rejectSeller = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user: any = await UserModel.findByPk(id);

    if (!user) throw new NotFoundError(req.t('user:user_not_found'));

    user.seller_request_status = 'rejected';
    await user.save();

    return successResponse(res, {
        message: req.t('user:seller_rejected'),
    });
});