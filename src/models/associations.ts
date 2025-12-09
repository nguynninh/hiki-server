import UserModel from './UserModel';
import RoleModel from './RoleModel';
import PermissionModel from './PermissionModel';
import FileMgmtModel from './FileMgmt';
import UserRelationship from './UserRelationship';
import CategoryModel from './CategoryModel';
import AttributeModel from './AttributeModel';
import AttributeValueModel from './AttributeValueModel';
import ProductModel from './ProductModel';
import ProductVariantModel from './ProductVariantModel';
import ProductVariantAttributeModel from './ProductVariantAttributeModel';
import AvatarDefaultModel from './AvatarDefault';
import BannerModel from './BannerModel';
import AddressModel from './AddressModel';

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

CategoryModel.hasMany(ProductModel, {
    foreignKey: 'category_id',
    as: 'products',
});

ProductModel.belongsTo(CategoryModel, {
    foreignKey: 'category_id',
    as: 'category',
});

UserModel.hasMany(ProductModel, {
    foreignKey: 'seller_id',
    as: 'products',
});

ProductModel.belongsTo(UserModel, {
    foreignKey: 'seller_id',
    as: 'seller',
});

AttributeModel.hasMany(AttributeValueModel, {
    foreignKey: 'attribute_id',
    as: 'values',
});

AttributeValueModel.belongsTo(AttributeModel, {
    foreignKey: 'attribute_id',
    as: 'attribute',
});

ProductModel.hasMany(ProductVariantModel, {
    foreignKey: 'product_id',
    as: 'variants',
});

ProductVariantModel.belongsTo(ProductModel, {
    foreignKey: 'product_id',
    as: 'product',
});

ProductVariantModel.hasMany(ProductVariantAttributeModel, {
    foreignKey: 'variant_id',
    as: 'variantAttributes',
});

ProductVariantAttributeModel.belongsTo(ProductVariantModel, {
    foreignKey: 'variant_id',
    as: 'variant',
});

ProductVariantAttributeModel.belongsTo(AttributeModel, {
    foreignKey: 'attribute_id',
    as: 'attribute',
});

ProductVariantAttributeModel.belongsTo(AttributeValueModel, {
    foreignKey: 'attribute_value_id',
    as: 'value',
});

AttributeModel.belongsToMany(ProductVariantModel, {
    through: ProductVariantAttributeModel,
    foreignKey: 'attribute_id',
    otherKey: 'variant_id',
    as: 'variants',
});

ProductVariantModel.belongsToMany(AttributeModel, {
    through: ProductVariantAttributeModel,
    foreignKey: 'variant_id',
    otherKey: 'attribute_id',
    as: 'attributes',
});

AttributeValueModel.belongsToMany(ProductVariantModel, {
    through: ProductVariantAttributeModel,
    foreignKey: 'attribute_value_id',
    otherKey: 'variant_id',
    as: 'variants',
});

ProductVariantModel.belongsToMany(AttributeValueModel, {
    through: ProductVariantAttributeModel,
    foreignKey: 'variant_id',
    otherKey: 'attribute_value_id',
    as: 'values',
});

export {
    UserModel,
    RoleModel,
    PermissionModel,
    FileMgmtModel,
    UserRelationship,
    CategoryModel,
    AttributeModel,
    AttributeValueModel,
    ProductModel,
    ProductVariantModel,
    ProductVariantAttributeModel,
    AvatarDefaultModel,
    BannerModel,
    AddressModel,
};

AvatarDefaultModel.belongsTo(FileMgmtModel, {
    foreignKey: 'file_id',
    as: 'file',
});

AvatarDefaultModel.belongsTo(UserModel, {
    foreignKey: 'created_by',
    as: 'creator',
});

UserModel.hasMany(AddressModel, {
    foreignKey: 'user_id',
    as: 'addresses',
});

AddressModel.belongsTo(UserModel, {
    foreignKey: 'user_id',
    as: 'user',
});