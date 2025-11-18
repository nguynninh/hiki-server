import UserModel from './UserModel';
import RoleModel from './RoleModel';
import PermissionModel from './PermissionModel';
import FileMgmtModel from './FileMgmt';
import UserRelationship from './UserRelationship';
import CategoryModel from './CategoryModel';

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

RoleModel.belongsToMany(PermissionModel, {
    through: 'role_permissions',
    foreignKey: 'role_id',
    otherKey: 'permission_id',
    as: 'permissions',
});

PermissionModel.belongsToMany(RoleModel, {
    through: 'role_permissions',
    foreignKey: 'permission_id',
    otherKey: 'role_id',
    as: 'roles',
});

FileMgmtModel.belongsTo(UserModel, {
    foreignKey: 'uploaded_by',
    as: 'uploader',
});

UserModel.hasMany(FileMgmtModel, {
    foreignKey: 'uploaded_by',
    as: 'uploadedFiles',
});

UserModel.belongsTo(FileMgmtModel, {
    foreignKey: 'avatar',
    as: 'avatarFile',
});

UserModel.hasMany(UserRelationship, {
    foreignKey: 'user_id',
    as: 'relationships',
});

UserModel.hasMany(UserRelationship, {
    foreignKey: 'target_id',
    as: 'reverseRelationships',
});

UserRelationship.belongsTo(UserModel, {
    foreignKey: 'user_id',
    as: 'user',
});

UserRelationship.belongsTo(UserModel, {
    foreignKey: 'target_id',
    as: 'target',
});

CategoryModel.belongsTo(CategoryModel, {
    foreignKey: 'parent_id',
    as: 'parent',
});

CategoryModel.hasMany(CategoryModel, {
    foreignKey: 'parent_id',
    as: 'children',
});

export {
    UserModel,
    RoleModel,
    PermissionModel,
    FileMgmtModel,
    UserRelationship,
    CategoryModel,
};