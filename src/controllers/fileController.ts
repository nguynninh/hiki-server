import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadImage, deleteFile, getFileUrl } from '../services/fileService';
import { BadRequestError, NotFoundError } from '../exception/AppError';
import { successResponse } from '../utils/responseFormatter';

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new BadRequestError(req.t('common:file_required'));
    }

    const userId = req.user?.sub;
    const result = await uploadImage(userId, req.file);

    return successResponse(res, {
        code: 201,
        message: req.t('common:file_uploaded'),
        data: result,
    });
});

export const removeFile = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new BadRequestError(req.t('common:invalid_id'));

    await deleteFile(id);

    return successResponse(res, {
        message: req.t('common:file_deleted'),
    });
});

export const getFile = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) throw new BadRequestError(req.t('common:invalid_id'));

    const url = await getFileUrl(id);

    if (!url) {
        throw new NotFoundError(req.t('common:file_not_found'));
    }

    return successResponse(res, {
        message: req.t('common:success'),
        data: { url },
    });
});
