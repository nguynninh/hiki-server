import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../exception/AppError";

export const authorize = (...requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      console.log("User in authorize middleware:", user);

      if (!user || !user.scope)
        throw new UnauthorizedError("Invalid token");

      const userRoles = user.scope.split(" ").map((role: string) => 
        role.replace(/^ROLE_/, "")
      );

      const hasPermission = requiredRoles.some(role =>
        userRoles.includes(role)
      );

      if (!hasPermission)
        throw new ForbiddenError("Access denied");

      next();
    } catch (err) {
      throw new UnauthorizedError("Token verification failed");
    }
  };
};
