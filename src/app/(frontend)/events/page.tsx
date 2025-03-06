import { CalendarDays, MapPin, Plus, Users } from "lucide-react";

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
import { Header } from "@/components/header";

export default function EventsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background to-background/95">
      <Header />
      <main className="flex-1 container py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Game Nights</h1>
            <p className="text-muted-foreground">
              Schedule and manage your board game events.
            </p>
          </div>
          <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList className="bg-background/50 border">
            <TabsTrigger
              value="upcoming"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Upcoming
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Past
            </TabsTrigger>
            <TabsTrigger
              value="invites"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Invites
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-background/50 border-muted">
                <CardHeader>
                  <CardTitle>Friday Game Night</CardTitle>
                  <CardDescription>March 10, 2025 • 7:00 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Your Place</p>
                        <p className="text-sm text-muted-foreground">
                          123 Main Street, Apt 4B
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">4 Attendees</p>
                        <p className="text-sm text-muted-foreground">
                          You, Alex, Sarah, Michael
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Games</p>
                        <p className="text-sm text-muted-foreground">
                          Gloomhaven, Spirit Island
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    Details
                  </Button>
                </CardFooter>
              </Card>

              <Card className="bg-background/50 border-muted">
                <CardHeader>
                  <CardTitle>Weekend Board Game Marathon</CardTitle>
                  <CardDescription>March 15, 2025 • 2:00 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Game Store</p>
                        <p className="text-sm text-muted-foreground">
                          456 Boardgame Avenue
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">8 Attendees</p>
                        <p className="text-sm text-muted-foreground">
                          You, Alex, Sarah, Michael, and 4 others
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Games</p>
                        <p className="text-sm text-muted-foreground">
                          Various - Bring your favorites
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    Details
                  </Button>
                </CardFooter>
              </Card>

              <Card className="bg-background/50 border-muted">
                <CardHeader>
                  <CardTitle>Strategy Game Night</CardTitle>
                  <CardDescription>March 22, 2025 • 6:30 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Sarah's House</p>
                        <p className="text-sm text-muted-foreground">
                          789 Strategy Street
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">5 Attendees</p>
                        <p className="text-sm text-muted-foreground">
                          You, Sarah, David, Emma, James
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Games</p>
                        <p className="text-sm text-muted-foreground">
                          Scythe, Terraforming Mars, Root
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    Details
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-background/50 border-muted opacity-70">
                <CardHeader>
                  <CardTitle>Monthly Game Club</CardTitle>
                  <CardDescription>February 20, 2025 • 7:00 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Community Center</p>
                        <p className="text-sm text-muted-foreground">
                          100 Community Lane
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">12 Attendees</p>
                        <p className="text-sm text-muted-foreground">
                          You and 11 others
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </CardFooter>
              </Card>

              <Card className="bg-background/50 border-muted opacity-70">
                <CardHeader>
                  <CardTitle>Casual Game Night</CardTitle>
                  <CardDescription>February 10, 2025 • 6:00 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Your Place</p>
                        <p className="text-sm text-muted-foreground">
                          123 Main Street, Apt 4B
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">3 Attendees</p>
                        <p className="text-sm text-muted-foreground">
                          You, Alex, Sarah
                        </p>
                      </div>
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

          <TabsContent value="invites" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-background/50 border-muted">
                <CardHeader>
                  <CardTitle>Board Game Tournament</CardTitle>
                  <CardDescription>April 5, 2025 • 12:00 PM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Game Cafe</p>
                        <p className="text-sm text-muted-foreground">
                          555 Gamer Boulevard
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">15+ Attendees</p>
                        <p className="text-sm text-muted-foreground">
                          Organized by Michael
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Games</p>
                        <p className="text-sm text-muted-foreground">
                          Tournament style - multiple games
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Decline
                  </Button>
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    Accept
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
