import { NextRequest, NextResponse } from 'next/server';

const ADMIN_ID = process.env.NEXT_PUBLIC_NEXT_ADMIN;

export async function authenticateAdmin(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Check if admin ID is configured
    if (!ADMIN_ID) {
      console.error('Admin middleware: NEXT_PUBLIC_NEXT_ADMIN environment variable is not set!');
      return NextResponse.json(
        { error: 'Admin authentication not configured' },
        { status: 500 }
      );
    }

    // Try to parse request body for admin authentication
    const body = await request.json().catch(() => ({}));
    const telegramId = body.telegramId;

    if (!telegramId) {
      return NextResponse.json(
        { error: 'Missing Telegram ID' },
        { status: 401 }
      );
    }

    if (telegramId.toString() !== ADMIN_ID) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    return null; // No error, authentication passed
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Helper function to check if user is admin
export function isAdmin(telegramId: string): boolean {
  return telegramId?.toString() === ADMIN_ID;
}
