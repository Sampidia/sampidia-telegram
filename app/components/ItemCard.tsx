'use client';

import { Item } from '@/app/data/items';

interface ItemCardProps {
  item: Item;
  onPurchase: (item: Item) => void;
}

export default function ItemCard({ item, onPurchase }: ItemCardProps) {
  return (
    <div 
      className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center tg-card cursor-pointer hover:shadow-md transition-all"
      onClick={() => onPurchase(item)}
    >
      <div className="text-3xl mr-4">{item.icon}</div>
      <div className="flex-1">
        <h3 className="font-medium">{item.name}</h3>
        <p className="text-sm tg-hint">{item.description}</p>
      </div>
      <div
        className="px-3 py-1 rounded-full text-sm tg-button"
      >
        {item.price} ⭐
      </div>
    </div>
  );
} 