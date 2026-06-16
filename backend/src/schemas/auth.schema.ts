import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one digit')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character');

export const RegisterBody = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password,
});

export const VerifyEmailBody = z.object({
  token: z.string().uuid('Invalid verification token'),
});

export const LoginBody = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordBody = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordBody = z.object({
  token: z.string().uuid('Invalid reset token'),
  password,
});

export const AcceptInvitationBody = z.object({
  token: z.string().uuid('Invalid invitation token'),
  password,
});

export const ChangePasswordBody = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: password,
});

export type RegisterBodyType = z.infer<typeof RegisterBody>;
export type LoginBodyType = z.infer<typeof LoginBody>;
export type ResetPasswordBodyType = z.infer<typeof ResetPasswordBody>;
export type ChangePasswordBodyType = z.infer<typeof ChangePasswordBody>;
