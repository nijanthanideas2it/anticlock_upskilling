import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  RegisterBody,
  VerifyEmailBody,
  LoginBody,
  ForgotPasswordBody,
  ResetPasswordBody,
  AcceptInvitationBody,
  ChangePasswordBody,
} from '../schemas/auth.schema';

const router = Router();

// Public
router.post('/register', validate({ body: RegisterBody }), authController.register);
router.post('/verify-email', validate({ body: VerifyEmailBody }), authController.verifyEmail);
router.post('/login', validate({ body: LoginBody }), authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', validate({ body: ForgotPasswordBody }), authController.forgotPassword);
router.post('/reset-password', validate({ body: ResetPasswordBody }), authController.resetPassword);
router.post('/accept-invitation', validate({ body: AcceptInvitationBody }), authController.acceptInvitation);

// Authenticated
router.post('/logout', authenticate, authController.logout);
router.patch('/me/password', authenticate, validate({ body: ChangePasswordBody }), authController.changePassword);

export default router;
