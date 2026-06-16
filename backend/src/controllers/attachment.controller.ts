import type { Request, Response, NextFunction } from 'express';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

const s3 = new S3Client({ region: process.env['AWS_REGION'] ?? 'us-east-1' });
const BUCKET = process.env['AWS_S3_BUCKET'] ?? '';
const MAX_FILES = 5;

export const presignUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ticketId } = req.params as { ticketId: string };
    const { fileName, fileSize, mimeType } = req.body as { fileName: string; fileSize: number; mimeType: string };

    const count = await prisma.attachment.count({ where: { ticketId } });
    if (count >= MAX_FILES) throw new AppError(400, 'TOO_MANY_FILES', `Maximum ${MAX_FILES} attachments per ticket`);

    const ext = fileName.split('.').pop() ?? '';
    const storageKey = `attachments/${ticketId}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: storageKey,
      ContentType: mimeType,
      ContentLength: fileSize,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    res.json({ uploadUrl, storageKey, expiresIn: 300 });
  } catch (err) { next(err); }
};

export const confirmUpload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { ticketId } = req.params as { ticketId: string };
    const { storageKey, fileName, fileSize, mimeType } = req.body as { storageKey: string; fileName: string; fileSize: number; mimeType: string };

    const attachment = await prisma.attachment.create({
      data: { fileName, fileSize, mimeType, storageKey, ticketId, uploadedById: req.user!.id },
    });

    res.status(201).json(attachment);
  } catch (err) { next(err); }
};

export const deleteAttachment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const attachment = await prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new AppError(404, 'NOT_FOUND', 'Attachment not found');
    if (attachment.uploadedById !== req.user!.id && req.user!.role !== 'ADMIN') {
      throw new AppError(403, 'FORBIDDEN', 'Cannot delete this attachment');
    }

    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: attachment.storageKey }));
    await prisma.attachment.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
};
