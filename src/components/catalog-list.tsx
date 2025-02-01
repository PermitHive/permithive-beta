import React from 'react'
import { CatalogItem } from '@/components/catalog-item'

interface CatalogListProps {
  items: any[];
  onSelectItem: (id: number) => void;
}

export const CatalogList: React.FC<CatalogListProps> = ({ items, onSelectItem }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <CatalogItem key={item.id} item={item} onSelect={onSelectItem} />
      ))}
    </div>
  )
}

