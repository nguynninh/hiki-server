import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import AddressModel from '../models/AddressModel';
import { Op } from 'sequelize';

// Load address data from JSON file
const addressDataPath = path.join(__dirname, '../assets/address.json');
let addressData: any[] = [];

try {
    const rawData = fs.readFileSync(addressDataPath, 'utf8');
    addressData = JSON.parse(rawData);
} catch (error) {
    console.error('Error reading address.json:', error);
}

const getProvinces = async (req: Request, res: Response) => {
    try {
        const provinces = addressData.map((province: any) => ({
            code: province.code,
            name: province.name
        }));

        res.status(200).json({
            code: 200,
            message: 'Success',
            data: provinces
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal Server Error',
            error: error
        });
    }
};

const getWards = async (req: Request, res: Response) => {
    try {
        const { province_code } = req.query;

        if (!province_code) {
            res.status(400).json({
                code: 400,
                message: 'province_code is required',
                data: []
            });
            return;
        }

        const province = addressData.find((p: any) => p.code === province_code);

        let wards = [];
        if (province && province.wards) {
            wards = province.wards;
        }

        res.status(200).json({
            code: 200,
            message: 'Success',
            data: wards
        });
    } catch (error) {
        res.status(500).json({
            code: 500,
            message: 'Internal Server Error',
            error: error
        });
    }
};

const addNewAddress = async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const { sub: id } = req.user as any;

        if (body.is_default) {
            await AddressModel.update({ is_default: false }, {
                where: { user_id: id }
            });
        }

        const newAddress = await AddressModel.create({
            ...body,
            user_id: id
        });

        res.status(200).json({
            code: 200,
            message: 'Address added successfully',
            data: newAddress
        });
    } catch (error: any) {
        res.status(500).json({
            code: 500,
            message: error.message,
        });
    }
};

const getAllAddresses = async (req: Request, res: Response) => {
    try {
        const { sub: id } = req.user as any;
        const addresses = await AddressModel.findAll({
            where: { user_id: id },
            order: [['is_default', 'DESC'], ['created_at', 'DESC']]
        });

        res.status(200).json({
            code: 200,
            message: 'Success',
            data: addresses
        });
    } catch (error: any) {
        res.status(500).json({
            code: 500,
            message: error.message
        });
    }
};

const updateAddress = async (req: Request, res: Response) => {
    try {
        const { id } = req.query;
        const body = req.body;
        const userId = (req.user as any).sub;

        if (body.is_default) {
            await AddressModel.update({ is_default: false }, {
                where: { user_id: userId }
            });
        }

        await AddressModel.update(body, {
            where: { id: id }
        });

        const updatedAddress = await AddressModel.findByPk(id as string);

        res.status(200).json({
            code: 200,
            message: 'Address updated successfully',
            data: updatedAddress
        });

    } catch (error: any) {
        res.status(500).json({
            code: 500,
            message: error.message
        });
    }
};

const deleteAddress = async (req: Request, res: Response) => {
    try {
        const { id } = req.query;

        await AddressModel.destroy({
            where: { id: id }
        });

        res.status(200).json({
            code: 200,
            message: 'Address deleted successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            code: 500,
            message: error.message
        });
    }
};

export default {
    getProvinces,
    getWards,
    addNewAddress,
    getAllAddresses,
    updateAddress,
    deleteAddress
};
