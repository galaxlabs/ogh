
import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

function SearchBar({ value, onChange, onSubmit, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onSubmit) {
            e.preventDefault();
            onSubmit();
          }
        }}
        className="pl-9 text-foreground bg-background"
      />
    </div>
  );
}

export default SearchBar;
