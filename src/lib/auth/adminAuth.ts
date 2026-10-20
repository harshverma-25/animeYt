import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'animeyt-admin-dev-key';

export function isAuthorizedAdmin(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const secretHeader = req.headers.get('x-admin-secret');
  const cookieSecret = req.cookies.get('admin_secret')?.value;

  const providedKey =
    secretHeader ||
    (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null) ||
    cookieSecret;

  if (!providedKey) return false;
  return providedKey === ADMIN_SECRET_KEY;
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'Unauthorized: Invalid or missing administrator credentials.',
      message: 'Please provide valid admin secret via X-Admin-Secret header or login.',
    },
    { status: 401 }
  );
}
