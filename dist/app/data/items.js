// Items data - shared between frontend and backend
export const ITEMS = [
    {
        id: 'one',
        name: '1 Star ✨',
        description: '$0.008',
        price: 1,
        icon: '✨'
    },
    {
        id: 'twentyfive',
        name: '25 Stars 🌟',
        description: '$0.2',
        price: 25,
        icon: '🌟'
    },
    {
        id: 'fifty',
        name: '50 Stars ⭐',
        description: '$0.4',
        price: 50,
        icon: '⭐'
    },
    {
        id: 'hundred',
        name: '100 Stars ⭐',
        description: '$0.8',
        price: 100,
        icon: '⭐'
    },
    {
        id: 'fivehundred',
        name: '500 Stars ⭐',
        description: '$4',
        price: 500,
        icon: '⭐'
    },
    {
        id: 'onethousand',
        name: '1000 Stars ⭐',
        description: '$8',
        price: 1000,
        icon: '⭐'
    }
];
// Helper function to get item by ID
export function getItemById(id) {
    return ITEMS.find(item => item.id === id);
}
