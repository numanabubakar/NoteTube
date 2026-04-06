'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Home,
  Menu,
  X,
  Youtube,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const sidebarItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'Process Video',
    href: '/process-video',
    icon: Youtube,
  },
  {
    label: 'Learning History',
    href: '/learning-history',
    icon: BookOpen,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Toggle */}
      <div className="fixed top-20 left-4 z-40 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -256 }}
        animate={{ x: isOpen ? 0 : -256 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:static lg:z-0 lg:block',
          isOpen ? 'block' : 'hidden lg:block'
        )}
      >
        <nav className="space-y-2 p-4">
          {sidebarItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute right-0 h-8 w-1 rounded-l-full bg-gradient-to-b from-blue-600 to-purple-600"
                      />
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </motion.aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 top-16 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
}
