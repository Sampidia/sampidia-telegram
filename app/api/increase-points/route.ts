import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Request validation schema
const IncreasePointsSchema = z.object({
  telegramId: z.string().min(1, 'Telegram ID is required'),
});

// Response types for better type safety
interface IncreasePointsSuccessResponse {
  success: true;
  balance: number;
  message?: string;
}

interface IncreasePointsErrorResponse {
  error: string;
  code?: string;
}

type IncreasePointsResponse = IncreasePointsSuccessResponse | IncreasePointsErrorResponse;

