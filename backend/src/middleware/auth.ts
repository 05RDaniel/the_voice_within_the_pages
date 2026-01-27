import { Request, Response, NextFunction } from "express";

// Authentication middleware - Session-based
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = (req.session as any)?.userId;
  
  if (!userId) {
    return res.status(401).json({ error: "No autenticado" });
  }
  
  next();
};



