
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  Mountain,
  Microscope,
  Leaf,
  Brain,
  Cpu,
  Code,
  Package,
  GitBranch,
  Shield,
  Database,
  Cloud,
  Globe,
  Smartphone,
  Laptop,
  Bot,
  Zap,
  Wifi,
  BookOpen,
  ListChecks,
  Star,
  GitPullRequest,
  Info,
  GitCompare,
  GraduationCap,
  Newspaper,
  Languages,
} from 'lucide-react';
import { motion } from 'framer-motion';

const iconMap = {
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  Mountain,
  Microscope,
  Leaf,
  Brain,
  Cpu,
  Code,
  Package,
  GitBranch,
  Shield,
  Database,
  Cloud,
  Globe,
  Smartphone,
  Laptop,
  Bot,
  Zap,
  Wifi,
  BookOpen,
  ListChecks,
  Star,
  GitPullRequest,
  Info,
  GitCompare,
  GraduationCap,
  Newspaper,
  Languages,
};

function CategoryCard({ category, index = 0 }) {
  const IconComponent = iconMap[category.icon] || Code;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <Link to={`/categories#${category.slug}`}>
        <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-full group">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <IconComponent className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2 gap-3">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  {category.count > 0 && (
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      {category.count}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {category.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default CategoryCard;
