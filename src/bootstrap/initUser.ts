import { RoleModel } from "../models";
import sequelize from "../database/pgClient";
import roles from "../constants/appRoles";

export async function initUser() {
  try {
    await sequelize.sync();

    await RoleModel.findOrCreate({
      where: { name: roles.USER },
      defaults: {
        description: "Regular user role",
      },
    });

    console.log("SUPER USER + PERMISSIONS initialized successfully");
  } catch (err) {
    console.error("initUser Error:", err);
  }
}