interface TelegramSendMessageOptions {
  parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML';
  entities?: Array<{
    offset: number;
    length: number;
    type: string;
  }>;
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  protect_content?: boolean;
  reply_to_message_id?: number;
  allow_sending_without_reply?: boolean;
  reply_markup?: {
    inline_keyboard?: Array<Array<{
      text: string;
      callback_data?: string;
      url?: string;
    }>>;
    keyboard?: Array<Array<{
      text: string;
      request_contact?: boolean;
      request_location?: boolean;
    }>>;
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
    remove_keyboard?: boolean;
  };
}

interface TelegramApiResponse {
  ok: boolean;
  result?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text: string;
  };
  error_code?: number;
  description?: string;
}

export async function sendTelegramMessage(
  chatId: number, 
  text: string, 
  extra?: TelegramSendMessageOptions
): Promise<TelegramApiResponse> {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...extra,
    }),
  });

  const data: TelegramApiResponse = await response.json();

  if (!data.ok) {
    console.error('Telegram API error:', data);
  }

  return data;
}