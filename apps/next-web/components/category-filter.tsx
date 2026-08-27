import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CategoryStats } from "@/lib/data";

interface CategoryFilterProps {
  categories: CategoryStats[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  allLabel?: string;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  allLabel = "All",
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === "all" ? "default" : "outline"}
        size="sm"
        onClick={() => onCategoryChange("all")}
        className="transition-all duration-200"
      >
        {allLabel}
      </Button>
      {categories.map((category) => (
        <Button
          key={category.slug}
          variant={selectedCategory === category.slug ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category.slug)}
          className="transition-all duration-200"
        >
          {category.name}
          {category.count > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {category.count}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
}
