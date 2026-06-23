import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BarChart3,
  BookOpen,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Shield,
  Upload,
} from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  public?: boolean;
};

export const mainNavItems: NavItem[] = [
  { id: 'home', label: 'Home', path: '/', icon: HeartPulse, public: true },
  { id: 'predict', label: 'Predict', path: '/predict', icon: Activity },
  { id: 'batch', label: 'Batch', path: '/batch', icon: Upload },
  { id: 'models', label: 'Models', path: '/models', icon: BarChart3 },
  { id: 'research', label: 'Research', path: '/research', icon: FileText, public: true },
  { id: 'references', label: 'References', path: '/references', icon: BookOpen, public: true },
  { id: 'governance', label: 'Governance', path: '/governance', icon: Shield, public: true },
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
];

export const footerLinks = [
  { label: 'GitHub', href: 'https://github.com' },
  { label: 'Thesis PDF', href: '#' },
  { label: 'Journal PDF', href: '#' },
];
