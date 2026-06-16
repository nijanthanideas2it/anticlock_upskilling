import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env['NODE_ENV'] === 'production',
};

function userDTO(u: { id: string; name: string; email: string; role: string; isActive: boolean; isAvailable: boolean; lastLoginAt: Date | null; createdAt: Date }) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, isActive: u.isActive, isAvailable: u.isAvailable, lastLoginAt: u.lastLoginAt, createdAt: u.createdAt };
}

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password } = req.body as { name: string; email: string; password: string };
    await authService.register(name, email, password);
    res.status(201).json({ message: 'Registration successful. You can now log in.' });
  } catch (err) { next(err); }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.verifyEmail((req.body as { token: string }).token);
    res.json({ message: 'Email verified. You can now log in.' });
  } catch (err) { next(err); }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const { user, access, refresh } = await authService.login(email, password);

    res.cookie('accessToken', access, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refresh, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ user: userDTO(user) });
  } catch (err) { next(err); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = (req.cookies as Record<string, string>)?.refreshToken;
    const { access, refresh } = await authService.refresh(refreshToken);
    res.cookie('accessToken', access, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refresh, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ message: 'Token refreshed.' });
  } catch (err) { next(err); }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const refreshToken = (req.cookies as Record<string, string>)?.refreshToken;
    await authService.logout(refreshToken);
    res.clearCookie('accessToken', COOKIE_OPTS);
    res.clearCookie('refreshToken', COOKIE_OPTS);
    res.json({ message: 'Logged out.' });
  } catch (err) { next(err); }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await authService.forgotPassword((req.body as { email: string }).email);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) { next(err); }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body as { token: string; password: string };
    await authService.resetPassword(token, password);
    res.json({ message: 'Password reset successful. Please log in.' });
  } catch (err) { next(err); }
};

export const acceptInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body as { token: string; password: string };
    await authService.acceptInvitation(token, password);
    res.json({ message: 'Account activated. Please log in.' });
  } catch (err) { next(err); }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    res.json({ message: 'Password updated.' });
  } catch (err) { next(err); }
};
