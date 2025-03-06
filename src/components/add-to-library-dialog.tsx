"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus, Search, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";

// Mock data - in a real app this would come from an API
const boardGames = [
  { value: "gloomhaven", label: "Gloomhaven" },
  { value: "pandemic", label: "Pandemic" },
  { value: "catan", label: "Catan" },
  { value: "ticket-to-ride", label: "Ticket to Ride" },
  { value: "azul", label: "Azul" },
  { value: "spirit-island", label: "Spirit Island" },
  { value: "terraforming-mars", label: "Terraforming Mars" },
  { value: "wingspan", label: "Wingspan" },
  { value: "scythe", label: "Scythe" },
  { value: "7-wonders", label: "7 Wonders" },
  { value: "brass-birmingham", label: "Brass: Birmingham" },
  { value: "everdell", label: "Everdell" },
  { value: "root", label: "Root" },
  { value: "codenames", label: "Codenames" },
  { value: "arkham-horror", label: "Arkham Horror" },
];

// Define a TypeScript interface instead of Zod schema
interface FormValues {
  game: string;
  status: string;
  rating?: string;
  playCount?: string;
  notes?: string;
}

export function AddToLibraryDialog() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      status: "owned",
      rating: "0",
      playCount: "0",
      notes: "",
    },
  });

  function onSubmit(values: FormValues) {
    console.log(values);
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-add-game-trigger>
          <Plus className="mr-2 h-4 w-4" />
          Add Game
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Game to Library</DialogTitle>
          <DialogDescription>
            Add a new board game to your collection.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="game"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Game</FormLabel>
                  <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <div className="flex items-center">
                            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                            {field.value
                              ? boardGames.find(
                                  (game) => game.value === field.value
                                )?.label
                              : "Search for a game..."}
                          </div>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search games..." />
                        <CommandList>
                          <CommandEmpty>No game found.</CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {boardGames.map((game) => (
                              <CommandItem
                                key={game.value}
                                value={game.value}
                                onSelect={() => {
                                  form.setValue("game", game.value);
                                  setSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    game.value === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {game.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="owned">Owned</SelectItem>
                      <SelectItem value="wishlist">Wishlist</SelectItem>
                      <SelectItem value="previously-owned">
                        Previously Owned
                      </SelectItem>
                      <SelectItem value="want-to-play">Want to Play</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Rating</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <div className="flex items-center">
                            <Star className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Rate" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Not Rated</SelectItem>
                        <SelectItem value="1">1 - Poor</SelectItem>
                        <SelectItem value="2">2 - Below Average</SelectItem>
                        <SelectItem value="3">3 - Average</SelectItem>
                        <SelectItem value="4">4 - Good</SelectItem>
                        <SelectItem value="5">5 - Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="playCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Play Count</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this game..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
              >
                Add to Library
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
