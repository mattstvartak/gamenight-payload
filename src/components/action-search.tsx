"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Send, Dice5, CalendarDays, Plus, Users, Heart, BookOpen, Clock, Settings } from "lucide-react"
import { Input } from "@/components/ui/input"
import useDebounce from "@/hooks/use-debounce"
import { useRouter } from "next/navigation"

interface Action {
  id: string
  label: string
  icon: React.ReactNode
  description?: string
  short?: string
  end?: string
  action?: () => void
  href?: string
}

interface SearchResult {
  actions: Action[]
}

const allActions = [
  {
    id: "1",
    label: "Add Game to Collection",
    icon: <Plus className="h-4 w-4 text-indigo-500" />,
    description: "Add a new game",
    short: "⌘A",
    end: "Action",
    href: "#add-game",
  },
  {
    id: "2",
    label: "Schedule Game Night",
    icon: <CalendarDays className="h-4 w-4 text-purple-500" />,
    description: "Create event",
    short: "⌘E",
    end: "Action",
    href: "#schedule",
  },
  {
    id: "3",
    label: "Browse Collection",
    icon: <Dice5 className="h-4 w-4 text-indigo-500" />,
    description: "View your games",
    short: "⌘C",
    end: "Navigation",
    href: "/",
  },
  {
    id: "4",
    label: "Discover Games",
    icon: <Search className="h-4 w-4 text-purple-500" />,
    description: "Find new games",
    short: "⌘D",
    end: "Navigation",
    href: "/search",
  },
  {
    id: "5",
    label: "View Game Nights",
    icon: <CalendarDays className="h-4 w-4 text-indigo-500" />,
    description: "Upcoming events",
    short: "⌘N",
    end: "Navigation",
    href: "/events",
  },
  {
    id: "6",
    label: "Friends",
    icon: <Users className="h-4 w-4 text-purple-500" />,
    description: "Manage friends",
    short: "⌘F",
    end: "Navigation",
    href: "/friends",
  },
  {
    id: "7",
    label: "Wishlist",
    icon: <Heart className="h-4 w-4 text-pink-500" />,
    description: "Games you want",
    short: "⌘W",
    end: "Navigation",
    href: "/wishlist",
  },
  {
    id: "8",
    label: "Game Rules",
    icon: <BookOpen className="h-4 w-4 text-blue-500" />,
    description: "Browse rules",
    short: "⌘R",
    end: "Navigation",
    href: "/rules",
  },
  {
    id: "9",
    label: "Play History",
    icon: <Clock className="h-4 w-4 text-green-500" />,
    description: "Past games",
    short: "⌘H",
    end: "Navigation",
    href: "/history",
  },
  {
    id: "10",
    label: "Settings",
    icon: <Settings className="h-4 w-4 text-gray-500" />,
    description: "App preferences",
    short: "⌘S",
    end: "Navigation",
    href: "/settings",
  },
]

function ActionSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<SearchResult | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedAction, setSelectedAction] = useState<Action | null>(null)
  const debouncedQuery = useDebounce(query, 200)

  useEffect(() => {
    if (!isFocused) {
      setResult(null)
      return
    }

    if (!debouncedQuery) {
      setResult({ actions: allActions })
      return
    }

    const normalizedQuery = debouncedQuery.toLowerCase().trim()
    const filteredActions = allActions.filter((action) => {
      const searchableText = `${action.label.toLowerCase()} ${action.description?.toLowerCase() || ""}`
      return searchableText.includes(normalizedQuery)
    })

    setResult({ actions: filteredActions })
  }, [debouncedQuery, isFocused])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setIsTyping(true)
  }

  const handleActionSelect = (action: Action) => {
    setSelectedAction(action)
    setIsFocused(false)

    if (action.href) {
      if (action.href.startsWith("#")) {
        // Handle in-page actions
        if (action.href === "#add-game") {
          // Trigger add game dialog
          const addGameButton = document.querySelector("[data-add-game-trigger]") as HTMLButtonElement
          if (addGameButton) addGameButton.click()
        } else if (action.href === "#schedule") {
          // Trigger schedule dialog
          const scheduleButton = document.querySelector("[data-schedule-trigger]") as HTMLButtonElement
          if (scheduleButton) scheduleButton.click()
        }
      } else {
        // Navigate to the specified route
        router.push(action.href)
      }
    }

    if (action.action) {
      action.action()
    }

    // Reset the search
    setTimeout(() => {
      setQuery("")
      setSelectedAction(null)
    }, 300)
  }

  const container = {
    hidden: { opacity: 0, y: -4 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        staggerChildren: 0.03,
      },
    },
    exit: {
      opacity: 0,
      y: -4,
      transition: {
        duration: 0.15,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 4 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.15,
      },
    },
  }

  // Reset selectedAction when focusing the input
  const handleFocus = () => {
    setSelectedAction(null)
    setIsFocused(true)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open command palette with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        const searchInput = document.getElementById("action-search")
        if (searchInput) {
          ;(searchInput as HTMLInputElement).focus()
        }
      }

      // Close with Escape
      if (e.key === "Escape" && isFocused) {
        setIsFocused(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isFocused])

  return (
    <div className="w-full relative">
      <div className="relative flex flex-col justify-start items-center">
        <div className="w-full bg-background z-[100]">
          <label className="sr-only" htmlFor="action-search">
            Search Commands
          </label>
          <div className="relative">
            <Input
              id="action-search"
              type="text"
              placeholder="What's up?"
              value={query}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="w-full pl-3 pr-9 py-1.5 h-10 text-base rounded-lg focus-visible:ring-offset-0 bg-background border-input shadow-sm transition-colors"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4">
              <AnimatePresence mode="wait">
                {query.length > 0 ? (
                  <motion.div
                    key="send"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Send className="w-4 h-4 text-muted-foreground/50" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Search className="w-4 h-4 text-muted-foreground/50" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="w-full fixed left-0 right-0 top-[60px] flex justify-center z-[100]">
          <div className="w-full max-w-[440px]">
            <AnimatePresence>
              {isFocused && result && !selectedAction && (
                <motion.div
                  className="w-full rounded-lg border shadow-lg overflow-hidden border-border/50 bg-background/95 backdrop-blur-sm z-[100]"
                  variants={container}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                >
                  <motion.ul className="max-h-[300px] overflow-y-auto">
                    {result.actions.map((action) => (
                      <motion.li
                        key={action.id}
                        className="px-3 py-2.5 flex items-center justify-between hover:bg-muted/50 cursor-pointer"
                        variants={item}
                        layout
                        onClick={() => handleActionSelect(action)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-5 h-5">{action.icon}</span>
                          <span className="text-sm font-medium">{action.label}</span>
                          <span className="text-xs text-muted-foreground/70">{action.description}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground/70">{action.short}</span>
                          <span className="text-xs text-muted-foreground/70 min-w-[60px] text-right">{action.end}</span>
                        </div>
                      </motion.li>
                    ))}
                  </motion.ul>
                  <div className="mt-1 px-3 py-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                      <span>Press ⌘K to open commands</span>
                      <span>ESC to cancel</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActionSearch

