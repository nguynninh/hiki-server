import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../exception/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const authorize = (...requiredRoles: string[]) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user || !user.scope)
        throw new UnauthorizedError(req.t('auth:invalid_token'));

      const userRoles = user.scope.split(" ").map((role: string) => 
        role.replace(/^ROLE_/, "")
      );

      const hasPermission = requiredRoles.some(role =>
        userRoles.includes(role)
      );

      if (!hasPermission)
        throw new ForbiddenError(req.t('auth:access_denied'));

      next();
    } catch (err) {
      throw new UnauthorizedError(req.t('auth:token_verification_failed'));
    }
  });
};
