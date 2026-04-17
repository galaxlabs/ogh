
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function CategoryFilter({ categories, selectedCategory, onCategoryChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onCategoryChange('all')}
        className="transition-all duration-200"
      >
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category.slug}
          variant={selectedCategory === category.slug ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange(category.slug)}
          className="transition-all duration-200"
        >
          {category.name}
          <Badge variant="secondary" className="ml-2 text-xs">
            {category.count}
          </Badge>
        </Button>
      ))}
    </div>
  );
}

export default CategoryFilter;
