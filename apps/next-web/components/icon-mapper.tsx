import { createElement } from "react";
import {
  Atom,
  BookOpen,
  Bot,
  Brain,
  BrainCircuit,
  Cloud,
  Code2,
  Cpu,
  Database,
  FlaskConical,
  Github,
  Globe,
  GitBranch,
  GitCompare,
  GitPullRequest,
  GraduationCap,
  HeartHandshake,
  Info,
  Laptop,
  Languages,
  Lightbulb,
  ListChecks,
  Network,
  Newspaper,
  Package,
  Rocket,
  Shield,
  Smartphone,
  Star,
  TestTube,
  Wand2,
  Wifi,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Atom,
  BookOpen,
  Bot,
  Brain,
  BrainCircuit,
  Cloud,
  Code2,
  Cpu,
  Database,
  FlaskConical,
  Github,
  Globe,
  GitBranch,
  GitCompare,
  GitPullRequest,
  GraduationCap,
  HeartHandshake,
  Info,
  Laptop,
  Languages,
  Lightbulb,
  ListChecks,
  Network,
  Newspaper,
  Package,
  Rocket,
  Shield,
  Smartphone,
  Star,
  TestTube,
  Wand2,
  Wifi,
  Wrench,
  Zap,
};

export function getCategoryIcon(name: string): LucideIcon {
  return ICON_MAP[name] || Code2;
}

export function getIconByName(name: string): LucideIcon {
  return getCategoryIcon(name);
}

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return createElement(getCategoryIcon(name), { className });
}
