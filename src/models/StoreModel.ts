import sequelize from '../database/pgClient';
import { DataTypes } from 'sequelize';

const StoreModel = sequelize.define('stores', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    store_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    province_code: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    district_code: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    ward_code: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    tax_code: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    logo: {
        type: DataTypes.STRING, // Link URL
        allowNull: true,
    },
    cover_image: {
        type: DataTypes.STRING, // Link URL
        allowNull: true,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM('active', 'banned', 'pending'),
        defaultValue: 'pending',
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default StoreModel;
