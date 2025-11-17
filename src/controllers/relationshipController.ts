import { UserModel, UserRelationship } from "../models";
import { Request, Response } from "express";
import dotenv from 'dotenv';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/responseFormatter';
import { NotFoundError, ValidationError } from "../exception/AppError";
import { getFileUrl } from "../services/fileService";
import Pagination from "../dto/Pagination";
import keyUserRelationshipType from "../constants/keyUserRelationshipType";
import { Op } from "sequelize";

dotenv.config();

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
            type: keyUserRelationshipType.FOLLOW || keyUserRelationshipType.RESTRICTION,
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
            type: keyUserRelationshipType.FOLLOW || keyUserRelationshipType.RESTRICTION,
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
                || rel.type === keyUserRelationshipType.BLOCKED)
                result.follow.i_follow = true;
            if (rel.type === keyUserRelationshipType.RESTRICTION)
                result.restriction.i_restrict = true;
            else if (rel.type === keyUserRelationshipType.BLOCKED)
                result.block.i_blocked = true;
        } else if (rel.user_id === targetId && rel.target_id === userId) {
            if (rel.type === keyUserRelationshipType.FOLLOW 
                || rel.type === keyUserRelationshipType.RESTRICTION
                || rel.type === keyUserRelationshipType.BLOCKED)
                result.follow.follow_me = true;
            if (rel.type === keyUserRelationshipType.RESTRICTION)
                result.restriction.restrict_me = true;
            else if (rel.type === keyUserRelationshipType.BLOCKED)
                result.block.blocked_me = true;
        }
    });

    result.follow.areFriends = result.follow.i_follow && result.follow.follow_me;

    return successResponse(res, {
        code: 200,
        message: req.t('user:user_relationship_retrieved'),
        data: result,
    });
});

const createNewBlock = asyncHandler(async (req: Request, res: Response) => {
    const { targetId } = req.params;
    const userId = (req as any).user.sub;

    if (userId === targetId) {
        throw new ValidationError(req.t('user:cant_block_yourself'));
    }

    const targetUser = await UserModel.findByPk(targetId);
    if (!targetUser) {
        throw new NotFoundError(req.t('user:user_not_found'));
    }

    const reverseRelationship = await UserRelationship.findOne({
        where: {
            user_id: targetId,
            target_id: userId,
            type: keyUserRelationshipType.BLOCKED,
        }
    });

    if (reverseRelationship) {
        throw new ValidationError(req.t('user:must_unblock_before_block'));
    }

    const existingRelationship = await UserRelationship.findOne({
        where: {
            user_id: userId,
            target_id: targetId,
        }
    });

    if (existingRelationship) {
        const relationType = (existingRelationship as any).type;
        
        if (relationType === keyUserRelationshipType.BLOCKED) {
            throw new ValidationError(req.t('user:already_blocked_user'));
        }
    }

    await UserRelationship.create({
        user_id: userId,
        target_id: targetId,
        type: keyUserRelationshipType.BLOCKED,
    });

    return successResponse(res, {
        code: 201,
        message: req.t('user:user_blocked_successfully'),
    });
});

export {
    getListFollowUsers,
    getListUsersFollow,
    createNewFollow,
    handleUnfollow,
    getUserRelationship,
    createNewBlock,
};