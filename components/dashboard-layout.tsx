'use client';

import { Header } from './header';
import { Sidebar } from './sidebar';
import { Footer } from './footer';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pt-4">
          <div className="container max-w-screen-2xl px-4 pb-8">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
