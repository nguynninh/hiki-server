import { RoleModel } from "../models";
import sequelize from "../database/pgClient";
import roles from "../constants/appRoles";

export async function initSeller() {
  try {
    await sequelize.sync();

    await RoleModel.findOrCreate({
      where: { name: roles.SELLER },
      defaults: {
        description: "Regular user role",
      },
    });

    console.log("SUPER SELLER + PERMISSIONS initialized successfully");
  } catch (err) {
    console.error("initSeller Error:", err);
  }
}