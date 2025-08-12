// types/user.ts
export type UserData = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  language_code?: string; // Optional because Telegram might not send it
  is_premium: boolean;
};
