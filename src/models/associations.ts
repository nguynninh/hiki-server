import UserModel from './UserModel';
import RoleModel from './RoleModel';

UserModel.belongsToMany(RoleModel, {
    through: 'user_roles',
    foreignKey: 'user_id',
    otherKey: 'role_id',
    as: 'roles',
});

RoleModel.belongsToMany(UserModel, {
    through: 'user_roles',
    foreignKey: 'role_id',
    otherKey: 'user_id',
    as: 'users',
});

export {
    UserModel,
    RoleModel,
};