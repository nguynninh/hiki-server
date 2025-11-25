import bcrypt from "bcrypt";
import { UserModel, RoleModel, PermissionModel } from "../models";
import sequelize from "../database/pgClient";
import permissionsList from "../constants/appPermissions";
import roles from "../constants/appRoles";

export async function initSuperAdmin() {
  try {
    await sequelize.sync();

    const [superAdminRole] = await RoleModel.findOrCreate({
      where: { name: roles.SUPER_ADMIN },
      defaults: {
        description: "Full system access",
      },
    });

    const permissionRecords = [];
    for (const p of permissionsList) {
      const [perm] = await PermissionModel.findOrCreate({
        where: { name: p },
      });
      permissionRecords.push(perm);
    }

    await PermissionModel.destroy({
      where: {
        name: {
          [require('sequelize').Op.notIn]: permissionsList,
        },
      },
    });

    console.log(`Synced ${permissionRecords.length} permissions, removed obsolete ones.`);

    await (superAdminRole as any).setPermissions(permissionRecords);

    const email = process.env.ADMIN_EMAIL!;
    const password = process.env.ADMIN_PASSWORD!;
    const firstname = process.env.ADMIN_FIRST_NAME!;
    const lastname = process.env.ADMIN_LAST_NAME!;

    if (!email || !password) {
      console.log("ADMIN ENV variables missing, skip admin creation.");
      return;
    }

    let adminUser = await UserModel.findOne({ where: { email } });

    if (!adminUser) {
      adminUser = await UserModel.create({
        email,
        password: await bcrypt.hash(password, 10),
        firstname,
        lastname,
      });

      console.log("Super admin account created:", (adminUser as any).email);
    } else {
      console.log("Super admin already exists:", (adminUser as any).email);
    }

    await (adminUser as any).setRoles([superAdminRole]);

    console.log("SUPER ADMIN + PERMISSIONS initialized successfully");
  } catch (err) {
    console.error("initSuperAdmin Error:", err);
  }
}