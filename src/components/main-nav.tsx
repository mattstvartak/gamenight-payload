import Link from "next/link";
import { Dice5, CalendarDays, Search, Users } from "lucide-react";

export function MainNav() {
  return (
    <div className="flex items-center gap-4 md:gap-6">
      <Link href="/" className="flex items-center gap-2">
        <Dice5 className="h-6 w-6 text-primary bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md p-1" />
        <span className="font-bold hidden md:inline-block">BoardGameHub</span>
      </Link>
      <nav className="flex items-center gap-4 md:gap-6">
        <Link
          href="/"
          className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
        >
          <Dice5 className="h-4 w-4 md:hidden" />
          <span className="hidden md:inline-block">Collection</span>
        </Link>
        <Link
          href="/search"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center gap-1"
        >
          <Search className="h-4 w-4 md:hidden" />
          <span className="hidden md:inline-block">Discover</span>
        </Link>
        <Link
          href="/events"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center gap-1"
        >
          <CalendarDays className="h-4 w-4 md:hidden" />
          <span className="hidden md:inline-block">Events</span>
        </Link>
        <Link
          href="/friends"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary flex items-center gap-1"
        >
          <Users className="h-4 w-4 md:hidden" />
          <span className="hidden md:inline-block">Friends</span>
        </Link>
      </nav>
    </div>
  );
}
