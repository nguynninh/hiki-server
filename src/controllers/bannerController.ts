import { BannerModel, FileMgmtModel } from "../models";
import { Request, Response } from "express";
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/responseFormatter';
import { NotFoundError, ValidationError } from "../exception/AppError";
import { deleteFile, getFileUrl, uploadImage } from "../services/fileService";
import Pagination from "../dto/Pagination";
import { Op } from "sequelize";

const getListBanners = asyncHandler(async (req: Request, res: Response) => {
    const {
        page = 1,
        limit = 10,
        is_active,
        q
    } = req.query;

    const whereClause: any = {};

    if (is_active !== undefined && is_active !== 'all') {
        whereClause.is_active = is_active === 'true';
    }

    if (q) {
        whereClause.title = { [Op.iLike]: `%${q}%` };
    }

    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const offset = (pageNumber - 1) * limitNumber;

    const { rows: banners, count: total } = await BannerModel.findAndCountAll({
        where: whereClause,
        limit: limitNumber,
        offset,
        order: [['priority', 'ASC'], ['created_at', 'DESC']],
    });

    return successResponse(res, {
        message: req.t('banner:banners_listed') || 'Banners listed successfully',
        data: {
            banners: await Promise.all(banners.map(async (banner: any) => ({
                ...banner.toJSON(),
                image_url: await getFileUrl(banner.image), // Assuming 'image' stores file ID
            }))),
            pagination: Pagination(
                pageNumber,
                limitNumber,
                total,
            ),
        }
    });
});

const getBannerDetail = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const banner: any = await BannerModel.findByPk(id);

    if (!banner) {
        throw new NotFoundError(req.t('banner:banner_not_found') || 'Banner not found');
    }

    return successResponse(res, {
        message: req.t('banner:banner_detail') || 'Banner detail',
        data: {
            banner: {
                ...banner.toJSON(),
                image_url: await getFileUrl(banner.image),
            }
        }
    });
});

const createBanner = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.sub;
    const image = req.file;
    const { title, link, priority, is_active } = req.body;

    if (!image) {
        throw new ValidationError(req.t('banner:image_required') || 'Image is required');
    }

    if (!title) {
        throw new ValidationError(req.t('banner:title_required') || 'Title is required');
    }

    const { fileRecord } = await uploadImage(userId!, image);

    const banner = await BannerModel.create({
        title,
        image: fileRecord.id,
        link,
        priority: priority ? Number(priority) : 0,
        is_active: is_active === 'true' || is_active === true,
    });

    return successResponse(res, {
        code: 201,
        message: req.t('banner:banner_created') || 'Banner created successfully',
        data: {
            banner: {
                ...banner.toJSON(),
                image_url: await getFileUrl(fileRecord.id),
            }
        }
    });
});

const updateBanner = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.sub;
    const image = req.file;
    const { title, link, priority, is_active } = req.body;

    const banner: any = await BannerModel.findByPk(id);

    if (!banner) {
        throw new NotFoundError(req.t('banner:banner_not_found') || 'Banner not found');
    }

    if (title) banner.title = title;
    if (link !== undefined) banner.link = link;
    if (priority !== undefined) banner.priority = Number(priority);
    if (is_active !== undefined) banner.is_active = is_active === 'true' || is_active === true;

    if (image) {
        // Upload new image
        const { fileRecord } = await uploadImage(userId!, image);

        // Delete old image if verified it's safe (optional, but good practice)
        // For now, assuming we keep file or soft delete logic handles it elsewhere, 
        // but explicit cleanup is better.
        if (banner.image) {
            // Potentially delete old file from storage, but strictly we just update the reference here.
            // If we want to delete from storage:
            await deleteFile(banner.image);
        }

        banner.image = fileRecord.id;
    }

    await banner.save();

    return successResponse(res, {
        message: req.t('banner:banner_updated') || 'Banner updated successfully',
        data: {
            banner: {
                ...banner.toJSON(),
                image_url: await getFileUrl(banner.image),
            }
        }
    });
});

const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const banner: any = await BannerModel.findByPk(id);

    if (!banner) {
        throw new NotFoundError(req.t('banner:banner_not_found') || 'Banner not found');
    }

    // Optional: Delete the image file associated with the banner?
    // If soft delete, maybe we don't want to delete file yet.
    // If hard delete, we should.
    // BannerModel has paranoid: true, so destroy() is soft delete.

    await banner.destroy();

    return successResponse(res, {
        message: req.t('banner:banner_deleted') || 'Banner deleted successfully',
    });
});

export {
    getListBanners,
    getBannerDetail,
    createBanner,
    updateBanner,
    deleteBanner
};
