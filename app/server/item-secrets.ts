// This file is only used on the server side and contains sensitive information
// that should not be exposed to the client

// Map of item IDs to their secret codes
export const ITEM_SECRETS: Record<string, string> = {
  'one': '1stars20255',
  '25': '25stars2025',
  '50': '50stars2025'
};

// Function to get a secret code for an item
export function getSecretForItem(itemId: string): string | undefined {
  return ITEM_SECRETS[itemId];
} 