import sequelize from '../database/pgClient';
import { DataTypes } from 'sequelize';

const AvatarDefaultModel = sequelize.define('avatar_defaults', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    file_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    created_by: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at',
});

export default AvatarDefaultModel;
