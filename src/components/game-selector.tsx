"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Mock data - in a real app this would come from your database
const games = [
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
]

interface GameSelectorProps {
  selectedGames: string[]
  onGamesChange: (games: string[]) => void
}

export function GameSelector({ selectedGames, onGamesChange }: GameSelectorProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (value: string) => {
    if (selectedGames.includes(value)) {
      onGamesChange(selectedGames.filter((game) => game !== value))
    } else {
      onGamesChange([...selectedGames, value])
    }
  }

  const handleRemove = (value: string) => {
    onGamesChange(selectedGames.filter((game) => game !== value))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            <span className="truncate">
              {selectedGames.length > 0
                ? `${selectedGames.length} game${selectedGames.length > 1 ? "s" : ""} selected`
                : "Select games..."}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search games..." className="h-9" />
            <CommandList>
              <CommandEmpty>No games found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {games.map((game) => (
                  <CommandItem key={game.value} value={game.value} onSelect={() => handleSelect(game.value)}>
                    <Check
                      className={cn("mr-2 h-4 w-4", selectedGames.includes(game.value) ? "opacity-100" : "opacity-0")}
                    />
                    {game.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedGames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedGames.map((value) => {
            const game = games.find((g) => g.value === value)
            return (
              <Badge key={value} variant="secondary" className="px-2 py-1">
                {game?.label}
                <button
                  type="button"
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={() => handleRemove(value)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {game?.label}</span>
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

