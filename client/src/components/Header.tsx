import { Search } from 'lucide-react';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  return (
    <header className="header-sticky">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Title */}
          <div className="flex-1">
            <h1 className="header-title">Army Video Blog</h1>
            <p className="text-sm text-muted-foreground mt-1">Curated Content Platform</p>
          </div>

          {/* Search Bar */}
          <div className="relative hidden sm:block w-64">
            <input
              type="text"
              placeholder="Search content..."
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-border rounded-lg bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>
    </header>
  );
}
