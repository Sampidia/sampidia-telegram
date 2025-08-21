// This file is only used on the server side and contains sensitive information
// that should not be exposed to the client
// Map of item IDs to their secret codes
export const ITEM_SECRETS = {
    'one': '1stars2025',
    'twentyfive': '25stars2025',
    'fifty': '50stars2025',
    'hundred': '100stars2025',
    'fivehundred': '500stars2025',
    'onethousand': '1000stars2025'
};
// Function to get a secret code for an item
export function getSecretForItem(itemId) {
    return ITEM_SECRETS[itemId];
}
