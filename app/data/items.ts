// Shared item definitions without secrets
export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
}

// Items data - shared between frontend and backend
export const ITEMS: Item[] = [
  {
    id: 'one',
    name: '1 Star ✨',
    description: '$0.009',
    price: 1,
    icon: '✨'
  },
  {
    id: 'twentyfive',
    name: '25 Stars 🌟',
    description: '$0.225',
    price: 25,
    icon: '🌟'
  },
  {
    id: 'fifty',
    name: '50 Stars ⭐',
    description: '$0.45',
    price: 50,
    icon: '⭐'
  },
  {
    id: 'hundred',
    name: '100 Stars ⭐',
    description: '$0.9',
    price: 100,
    icon: '⭐'
  },
  {
    id: 'fivehundred',
    name: '500 Stars ⭐',
    description: '$4.5',
    price: 500,
    icon: '⭐'
  },
  {
    id: 'onethousand',
    name: '1000 Stars ⭐',
    description: '$9',
    price: 1000,
    icon: '⭐'
  }
];

// Helper function to get item by ID
export function getItemById(id: string): Item | undefined {
  return ITEMS.find(item => item.id === id);
} 