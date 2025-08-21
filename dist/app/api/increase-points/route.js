import { z } from 'zod';
// Request validation schema
const IncreasePointsSchema = z.object({
    telegramId: z.string().min(1, 'Telegram ID is required'),
});
