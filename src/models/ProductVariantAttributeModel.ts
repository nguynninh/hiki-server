import sequelize from '../database/pgClient';
import { DataTypes } from 'sequelize';

const ProductVariantAttributeModel = sequelize.define('product_variant_attributes', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    variant_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    attribute_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    attribute_value_id: {
        type: DataTypes.UUID,
        allowNull: false,
    },
});

export default ProductVariantAttributeModel;