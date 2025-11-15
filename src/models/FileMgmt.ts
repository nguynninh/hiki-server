import sequelize from '../database/pgClient.js';
import { DataTypes } from 'sequelize';

const FileMgmtModel = sequelize.define('files', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    content_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    size: {
        type: DataTypes.BIGINT,
        allowNull: false,
    },
    md5_checksum: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    uploaded_by: {
        type: DataTypes.UUID,
        allowNull: false,
    },

}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
});

export default FileMgmtModel;