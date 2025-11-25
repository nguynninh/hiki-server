import { PermissionModel, RoleModel } from "../models";
import { Request, Response } from "express";
import dotenv from 'dotenv';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/responseFormatter';
import { ValidationError } from "../exception/AppError";

dotenv.config();

const createRole = asyncHandler(async (req: Request, res: Response) => {
    const {
        name,
        description,
    } = req.body;

    let role: any = await RoleModel.findOne({ where: {  name: name.toUpperCase() } });
    if (role)
        throw new ValidationError(req.t('role:role_exists'));

    role = await RoleModel.create({
        name: name.toUpperCase(),
        description,
    });

    await role.reload();

    return successResponse(res, {
        code: 201,
        message: req.t('role:role_created'),
        data: {
            role: {
                ...role.toJSON(),
            }
        }
    });
});


const getAllRoles = asyncHandler(async (req: Request, res: Response) => {
    const roles = await RoleModel.findAll();

    return successResponse(res, {
        message: req.t('role:roles_fetched'),
        data: {
            roles,
        }
    });
});

const getAllPermissions = asyncHandler(async (req: Request, res: Response) => {
    const permissions = await PermissionModel.findAll();

    return successResponse(res, {
        message: req.t('role:permissions_fetched'),
        data: {
            permissions,
        }
    });
});

export {
    createRole,
    getAllRoles,
    getAllPermissions,
};