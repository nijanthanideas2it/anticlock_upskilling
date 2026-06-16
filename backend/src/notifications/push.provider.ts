import admin from 'firebase-admin';

let initialized = false;

function getApp(): admin.app.App {
  if (!initialized) {
    const projectId = process.env['FIREBASE_PROJECT_ID'];
    if (projectId) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail: process.env['FIREBASE_CLIENT_EMAIL'],
          privateKey: process.env['FIREBASE_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
        }),
      });
      initialized = true;
    }
  }
  return admin.app();
}

export async function sendPush(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  if (!process.env['FIREBASE_PROJECT_ID']) return;

  try {
    await getApp().messaging().send({
      token: fcmToken,
      notification: { title, body },
      data,
    });
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code === 'messaging/registration-token-not-registered') return;
    console.error('[push.provider] Failed to send push:', err);
  }
}
