'use client';

import { Item } from '@/app/data/items';
import ItemCard from './ItemCard';

interface ItemsListProps {
  items: Item[];
  onPurchase: (item: Item) => void;
}

export default function ItemsList({ items, onPurchase }: ItemsListProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Available Items</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <ItemCard 
            key={item.id}
            item={item}
            onPurchase={onPurchase}
          />
        ))}
      </div>
    </div>
  );
} 