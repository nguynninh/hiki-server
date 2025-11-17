import { UserModel, RoleModel, PermissionModel, UserRelationship } from "../models";
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
import { deleteFile, getFileUrl, uploadImage } from "../services/fileService";
import generateCode from "../utils/generateCode";
import { parseUserAgent } from "../utils/parseUserAgent";
import roles from "../constants/appRoles";
import Pagination from "../dto/Pagination";
import keyUserRelationshipType from "../constants/keyUserRelationshipType";
import { Op } from "sequelize";

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

    const avatarUrl = user.avatar ? await getFileUrl(user.avatar) : null;

    return successResponse(res, {
        code: 200,
        message: req.t('user:user_retrieved'),
        data: {
            user: {
                ...user.toJSON(),
                password: undefined,
                avatar: avatarUrl,
            }
        }
    });
});

const getUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user: any = await UserModel.findByPk(id);
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
    });

    return successResponse(res, {
        message: req.t('user:users_listed'),
        data: {
            users: users.map(user => ({
                ...user.toJSON(),
                password: undefined,
            })),
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

    const { fileRecord, publicUrl } = await uploadImage(userId, avatar);

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
                avatar: user.avatar ? await getFileUrl(user.avatar) : null,
            },
            public_url: publicUrl,
        }
    });
});

const getListFollowUsers = asyncHandler(async (req: Request, res: Response) => {
    const {
        page,
        limit,
    } = req.query;

    const userId = (req as any).user.sub;

    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const { rows: relationships, count: total } = await UserRelationship.findAndCountAll({
        where: {
            user_id: userId,
            type: keyUserRelationshipType.FOLLOW,
        },
        limit: limitNumber,
        offset,
        order: [['created_at', 'DESC']],
    });

    const followedUserIds = relationships.map((rel: any) => rel.target_id);

    const users = await UserModel.findAll({
        where: {
            id: followedUserIds,
        },
    });

    return successResponse(res, {
        message: req.t('user:followed_users_listed'),
        data: {
            users: users.map(user => ({
                ...user.toJSON(),
                password: undefined,
            })),
            paginations: Pagination(
                pageNumber,
                limitNumber,
                total,
            ),
        }
    });
});

const getListUsersFollow = asyncHandler(async (req: Request, res: Response) => {
    const {
        page,
        limit,
    } = req.query;

    const userId = (req as any).user.sub;

    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = parseInt(limit as string, 10) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const { rows: relationships, count: total } = await UserRelationship.findAndCountAll({
        where: {
            target_id: userId,
            type: keyUserRelationshipType.FOLLOW,
        },
        limit: limitNumber,
        offset,
        order: [['created_at', 'DESC']],
    });

    const followerUserIds = relationships.map((rel: any) => rel.user_id);

    const users = await UserModel.findAll({
        where: {
            id: followerUserIds,
        },
    });

    return successResponse(res, {
        message: req.t('user:follower_users_listed'),
        data: {
            users: users.map(user => ({
                ...user.toJSON(),
                password: undefined,
            })),
            paginations: Pagination(
                pageNumber,
                limitNumber,
                total,
            ),
        }
    });
});

const createNewFollow = asyncHandler(async (req: Request, res: Response) => {
    const { targetId } = req.params;
    const userId = (req as any).user.sub;

    if (userId === targetId) {
        throw new ValidationError(req.t('user:cant_follow_yourself'));
    }

    const targetUser = await UserModel.findByPk(targetId);
    if (!targetUser) {
        throw new NotFoundError(req.t('user:user_not_found'));
    }

    const existingRelationship = await UserRelationship.findOne({
        where: {
            user_id: userId,
            target_id: targetId,
        }
    });

    if (existingRelationship) {
        const relationType = (existingRelationship as any).type;
        
        if (relationType === keyUserRelationshipType.FOLLOW) {
            throw new ValidationError(req.t('user:already_following_user'));
        }

        if (relationType === keyUserRelationshipType.RESTRICTION) {
            throw new ValidationError(req.t('user:already_following_user'));
        }
        
        if (relationType === keyUserRelationshipType.BLOCKED) {
            throw new ValidationError(req.t('user:must_unblock_before_follow'));
        }
    }

    await UserRelationship.create({
        user_id: userId,
        target_id: targetId,
        type: keyUserRelationshipType.FOLLOW,
    });

    return successResponse(res, {
        code: 201,
        message: req.t('user:user_followed_successfully'),
    });
});

const handleUnfollow = asyncHandler(async (req: Request, res: Response) => {
    const { targetId } = req.params;
    const userId = (req as any).user.sub;

    const existingRelationship = await UserRelationship.findOne({
        where: {
            user_id: userId,
            target_id: targetId,
            type: keyUserRelationshipType.FOLLOW,
        }
    });

    if (!existingRelationship) {
        throw new NotFoundError(req.t('user:not_following_user'));
    }

    await existingRelationship.destroy();

    return successResponse(res, {
        code: 200,
        message: req.t('user:user_unfollowed_successfully'),
    });
});

const getUserRelationship = asyncHandler(async (req: Request, res: Response) => {
    const { targetId } = req.params;
    const userId = (req as any).user.sub;

    const user: any = await UserModel.findByPk(userId);
    if (!user) {
        throw new NotFoundError(req.t('auth:user_not_found'));
    }

    const targetUser: any = await UserModel.findByPk(targetId);
    if (!targetUser) {
        throw new NotFoundError(req.t('user:user_not_found'));
    }

    const relationships = await UserRelationship.findAll({
        where: {
            [Op.or]: [
                { user_id: userId, target_id: targetId },
                { user_id: targetId, target_id: userId },
            ]
        }
    });
    
    const avatarUrlUser = user.avatar ? await getFileUrl(user.avatar) : null;
    const avatarUrlTarget = targetUser.avatar ? await getFileUrl(targetUser.avatar) : null;

    const result = {
        userId: userId,
        user: {
            ...user.toJSON(),
            password: undefined,
            avatar: avatarUrlUser,
        },
        targetId: targetId,
        target: {
            ...targetUser.toJSON(),
            password: undefined,
            avatar: avatarUrlTarget,
        },
        follow: {
            i_follow: false,
            follow_me: false,
            areFriends: false,
        },
        restriction: {
            i_restrict: false,
            restrict_me: false,
        },
        block: {
            i_blocked: false,
            blocked_me: false,
        }
    };

    relationships.forEach((rel: any) => {
        if (rel.user_id === userId && rel.target_id === targetId) {
            if (rel.type === keyUserRelationshipType.FOLLOW 
                || rel.type === keyUserRelationshipType.RESTRICTION
                || rel.type === keyUserRelationshipType.BLOCKED) {
                result.follow.i_follow = true;
            } else if (rel.type === keyUserRelationshipType.RESTRICTION) {
                result.restriction.i_restrict = true;
            } else if (rel.type === keyUserRelationshipType.BLOCKED) {
                result.block.i_blocked = true;
            }
        } else if (rel.user_id === targetId && rel.target_id === userId) {
            if (rel.type === keyUserRelationshipType.FOLLOW 
                || rel.type === keyUserRelationshipType.RESTRICTION
                || rel.type === keyUserRelationshipType.BLOCKED) {
                result.follow.follow_me = true;
            } else if (rel.type === keyUserRelationshipType.RESTRICTION) {
                result.restriction.restrict_me = true;
            } else if (rel.type === keyUserRelationshipType.BLOCKED) {
                result.block.blocked_me = true;
            }
        }
    });

    result.follow.areFriends = result.follow.i_follow && result.follow.follow_me;

    return successResponse(res, {
        code: 200,
        message: req.t('user:user_relationship_retrieved'),
        data: result,
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
    getListFollowUsers,
    getListUsersFollow,
    createNewFollow,
    handleUnfollow,
    getUserRelationship,
};