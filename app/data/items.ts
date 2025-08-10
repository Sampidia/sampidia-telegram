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
    id: '1',
    name: '1 Star ✨',
    description: '₦1',
    price: 1,
    icon: '✨'
  },
  {
    id: '25',
    name: '25 Stars 🌟',
    description: '₦450',
    price: 25,
    icon: '🌟'
  },
  {
    id: '50',
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