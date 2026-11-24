import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { FikrinceLogo } from './FikrinceLogo.tsx';

export type AppView = 'home' | 'explore' | 'categories' | 'detail';

interface HeaderProps {
  activeView: AppView;
  onNavigate: (view: 'home' | 'explore' | 'categories') => void;
  onOpenCreate: () => void;
}

export function Header({ activeView, onNavigate, onOpenCreate }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: 'home' | 'explore' | 'categories'; label: string }[] = [
    { id: 'home', label: 'Ana Sayfa' },
    { id: 'explore', label: 'Keşfet' },
    { id: 'categories', label: 'Kategoriler' },
  ];

  const handleNavClick = (id: 'home' | 'explore' | 'categories') => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E3E1D7] bg-[#F5F4EE]/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center whitespace-nowrap shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111210] cursor-pointer"
          aria-label="FİKRİNCE Ana Sayfa"
        >
          <FikrinceLogo tone="dark" size="sm" />
        </button>

        {/* Zone 2: Clean single-line text nav links */}
        <nav
          aria-label="Ana gezinme"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A4B44]"
        >
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`relative py-1 whitespace-nowrap shrink-0 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111210] ${
                  isActive
                    ? 'text-[#111210] font-semibold'
                    : 'text-[#55564E] hover:text-[#111210]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 bg-[#111210]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single primary CTA + Mobile menu toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenCreate();
            }}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#D4FF00] px-4 text-sm font-semibold text-[#111210] transition-colors duration-150 hover:bg-[#C6F000] active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111210]"
          >
            Fikir Paylaş
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex md:hidden h-11 w-11 items-center justify-center rounded-lg text-[#111210] hover:bg-[#E9E7DE] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#111210]"
            aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobil gezinme"
          className="md:hidden border-t border-[#E3E1D7] bg-[#F5F4EE] px-4 py-3"
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 text-left text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#111210] text-[#D4FF00]'
                      : 'text-[#111210] hover:bg-[#E9E7DE]'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
