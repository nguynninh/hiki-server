import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../exception/AppError";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    throw new UnauthorizedError("Token required");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (err) {
    throw new UnauthorizedError("Invalid token");
  }
};
