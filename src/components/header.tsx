import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import ActionSearch from "@/components/action-search";

interface HeaderProps {
  showSearch?: boolean;
}

export function Header({ showSearch = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between py-4">
        <MainNav />
        {showSearch && (
          <div className="flex-1 mx-4">
            <ActionSearch />
          </div>
        )}
        <div className="flex items-center gap-2">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
