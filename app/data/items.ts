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
    description: '₦1',
    price: 1,
    icon: '✨'
  },
  {
    id: 'twentyfive',
    name: '25 Stars 🌟',
    description: '₦450',
    price: 25,
    icon: '🌟'
  },
  {
    id: 'fifty',
    name: '50 Stars ⭐',
    description: '₦910',
    price: 50,
    icon: '⭐'
  }
];

// Helper function to get item by ID
export function getItemById(id: string): Item | undefined {
  return ITEMS.find(item => item.id === id);
} 