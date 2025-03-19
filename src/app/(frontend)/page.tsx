import { CalendarDays, Grid3X3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameCard } from "@/components/game-card";
import { CreateEventDialog } from "@/components/create-event-dialog";
import { AddToLibraryDialog } from "@/components/add-to-library-dialog";
import { Header } from "@/components/header";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background to-background/95">
      <Header showSearch={true} />
      <main className="flex-1 container py-6 mx-auto max-w-screen-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your board game collection and game nights.
            </p>
          </div>
          <div className="flex gap-2">
            <AddToLibraryDialog />
            <CreateEventDialog />
          </div>
        </div>

        <Tabs defaultValue="collection" className="space-y-4">
          <TabsList className="bg-background/50 border">
            <TabsTrigger
              value="collection"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <Grid3X3 className="mr-2 h-4 w-4" />
              My Collection
            </TabsTrigger>
            <TabsTrigger
              value="upcoming"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              Upcoming Game Nights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="collection" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <GameCard
                title="Gloomhaven"
                image="/placeholder.svg?height=300&width=200"
                players="1-4"
                time="60-120 min"
                complexity="High"
              />
              <GameCard
                title="Pandemic"
                image="/placeholder.svg?height=300&width=200"
                players="2-4"
                time="45 min"
                complexity="Medium"
              />
              <GameCard
                title="Catan"
                image="/placeholder.svg?height=300&width=200"
                players="3-4"
                time="60 min"
                complexity="Medium"
              />
              <GameCard
                title="Ticket to Ride"
                image="/placeholder.svg?height=300&width=200"
                players="2-5"
                time="30-60 min"
                complexity="Low"
              />
              <GameCard
                title="Azul"
                image="/placeholder.svg?height=300&width=200"
                players="2-4"
                time="30-45 min"
                complexity="Low"
              />
              <GameCard
                title="Spirit Island"
                image="/placeholder.svg?height=300&width=200"
                players="1-4"
                time="90-120 min"
                complexity="High"
              />
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-background/50 border-muted">
                <CardHeader>
                  <CardTitle>Friday Game Night</CardTitle>
                  <CardDescription>March 10, 2025 • 7:00 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Location:</span>
                      <span className="text-sm text-muted-foreground">
                        Your Place
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Games:</span>
                      <span className="text-sm text-muted-foreground">
                        Gloomhaven, Spirit Island
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Attendees:</span>
                      <span className="text-sm text-muted-foreground">
                        4 confirmed
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </CardFooter>
              </Card>

              <Card className="bg-background/50 border-muted">
                <CardHeader>
                  <CardTitle>Weekend Board Game Marathon</CardTitle>
                  <CardDescription>March 15, 2025 • 2:00 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Location:</span>
                      <span className="text-sm text-muted-foreground">
                        Game Store
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Games:</span>
                      <span className="text-sm text-muted-foreground">
                        Various - Bring your favorites
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Attendees:</span>
                      <span className="text-sm text-muted-foreground">
                        8 confirmed
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
