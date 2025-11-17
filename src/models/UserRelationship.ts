import sequelize from '../database/pgClient';
import { DataTypes } from 'sequelize';
import keyUserRelationshipType from '../constants/keyUserRelationshipType';

const UserRelationship = sequelize.define('user_relationships', {
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    target_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
    },
    type: {
        type: DataTypes.ENUM(
            keyUserRelationshipType.FOLLOW,
            keyUserRelationshipType.RESTRICTION,
            keyUserRelationshipType.BLOCKED,
        ),
        allowNull: false,
        primaryKey: true,
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

export default UserRelationship;