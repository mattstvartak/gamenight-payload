import { Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GameCard } from "@/components/game-card";
import { Header } from "@/components/header";

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background to-background/95">
      <Header />
      <main className="flex-1 container py-6">
        <div className="flex flex-col gap-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Discover Games</h1>
          <p className="text-muted-foreground">
            Search for new board games to add to your collection.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for board games..."
                className="pl-9 bg-background border-muted h-10"
              />
            </div>
            <Button variant="outline" className="h-10">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        <Tabs defaultValue="popular" className="space-y-4">
          <TabsList className="bg-background/50 border">
            <TabsTrigger
              value="popular"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Popular
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              New Releases
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Trending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="popular" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <GameCard
                title="Terraforming Mars"
                image="/placeholder.svg?height=300&width=200"
                players="1-5"
                time="120 min"
                complexity="High"
              />
              <GameCard
                title="7 Wonders"
                image="/placeholder.svg?height=300&width=200"
                players="2-7"
                time="30 min"
                complexity="Medium"
              />
              <GameCard
                title="Wingspan"
                image="/placeholder.svg?height=300&width=200"
                players="1-5"
                time="40-70 min"
                complexity="Medium"
              />
              <GameCard
                title="Scythe"
                image="/placeholder.svg?height=300&width=200"
                players="1-5"
                time="90-115 min"
                complexity="High"
              />
              <GameCard
                title="Brass: Birmingham"
                image="/placeholder.svg?height=300&width=200"
                players="2-4"
                time="60-120 min"
                complexity="High"
              />
              <GameCard
                title="Everdell"
                image="/placeholder.svg?height=300&width=200"
                players="1-4"
                time="40-80 min"
                complexity="Medium"
              />
              <GameCard
                title="Root"
                image="/placeholder.svg?height=300&width=200"
                players="2-4"
                time="60-90 min"
                complexity="High"
              />
              <GameCard
                title="Codenames"
                image="/placeholder.svg?height=300&width=200"
                players="2-8+"
                time="15 min"
                complexity="Low"
              />
            </div>
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <GameCard
                title="Frosthaven"
                image="/placeholder.svg?height=300&width=200"
                players="1-4"
                time="60-120 min"
                complexity="High"
              />
              <GameCard
                title="Ark Nova"
                image="/placeholder.svg?height=300&width=200"
                players="1-4"
                time="90-150 min"
                complexity="High"
              />
              <GameCard
                title="Dune: Imperium"
                image="/placeholder.svg?height=300&width=200"
                players="1-4"
                time="60-120 min"
                complexity="Medium"
              />
              <GameCard
                title="Lost Ruins of Arnak"
                image="/placeholder.svg?height=300&width=200"
                players="1-4"
                time="30-120 min"
                complexity="Medium"
              />
            </div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <GameCard
                title="Oath"
                image="/placeholder.svg?height=300&width=200"
                players="1-6"
                time="45-120 min"
                complexity="High"
              />
              <GameCard
                title="Cascadia"
                image="/placeholder.svg?height=300&width=200"
                players="1-4"
                time="30-45 min"
                complexity="Medium"
              />
              <GameCard
                title="Sleeping Gods"
                image="/placeholder.svg?height=300&width=200"
                players="1-4"
                time="60-120 min"
                complexity="High"
              />
              <GameCard
                title="The Crew"
                image="/placeholder.svg?height=300&width=200"
                players="3-5"
                time="20 min"
                complexity="Medium"
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
