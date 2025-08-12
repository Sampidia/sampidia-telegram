export {};

declare global {
  interface TelegramWebAppUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    allows_write_to_pm?: boolean;
    photo_url?: string;
  }

  interface TelegramWebApp {
    initData?: string;
    initDataUnsafe?: {
      user?: TelegramWebAppUser;
    };
    version?: string;
    platform?: string;
    isExpanded?: boolean;
    close: () => void;
    expand: () => void;
  }

  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}
