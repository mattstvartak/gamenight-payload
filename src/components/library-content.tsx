import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getPayload } from "payload";
import config from "@payload-config";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Loader2, Users, Clock } from "lucide-react";
import { Button } from "./ui/button";

const payload = await getPayload({ config });

interface LibraryContentProps {
  libraryId: string;
}

export async function LibraryContent({ libraryId }: LibraryContentProps) {
  const library = await payload.findByID({
    collection: "library", // required
    id: libraryId, // required
    depth: 2,
  });

  console.log(library);

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink href="/libraries">Library</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{library.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <h1 className="text-2xl font-bold">{library.name}</h1>
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {library.games?.map((gameEntry) => {
            const game =
              typeof gameEntry.game === "object" ? gameEntry.game : null;
            if (!game) return null;

            return (
              <Card
                key={game.id}
                className="overflow-hidden relative aspect-square"
              >
                {game.images?.[0]?.image &&
                typeof game.images[0].image === "object" &&
                game.images[0].image.url ? (
                  <Image
                    src={game.images[0].image.url}
                    alt={game.name || "Game image"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">No image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20 p-4 flex flex-col justify-end">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid gap-1">
                      <CardTitle className="line-clamp-1 text-white">
                        <Link
                          href={`/games/${game.bggId}`}
                          className="hover:underline"
                        >
                          {game.name}
                        </Link>
                      </CardTitle>
                      <div className="flex gap-4 text-sm text-white/80">
                        {(game.minPlayers || game.maxPlayers) && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>
                              {game.minPlayers === game.maxPlayers
                                ? `${game.minPlayers}`
                                : `${game.minPlayers}-${game.maxPlayers}`}
                            </span>
                          </div>
                        )}
                        {(game.minPlaytime || game.maxPlaytime) && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {game.minPlaytime === game.maxPlaytime
                                ? `${game.minPlaytime}`
                                : `${game.minPlaytime}-${game.maxPlaytime}`}
                              {" min"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
