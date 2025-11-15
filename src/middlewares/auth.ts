import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../exception/AppError";
import { asyncHandler } from "../utils/asyncHandler";

export const authenticate = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    throw new UnauthorizedError(req.t('auth:token_required'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!);
    req.user = decoded;
    next();
  } catch (err) {
    throw new UnauthorizedError(req.t('auth:invalid_token'));
  }
});
