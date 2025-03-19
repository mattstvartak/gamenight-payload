import { Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

interface GameCardProps {
  title: string
  image: string
  players: string
  time: string
  complexity: "Low" | "Medium" | "High"
}

export function GameCard({ title, image, players, time, complexity }: GameCardProps) {
  // Convert title to slug for the URL
  const slug = title.toLowerCase().replace(/\s+/g, "-")

  return (
    <Card className="overflow-hidden bg-background/50 border-muted transition-all hover:shadow-md">
      <CardHeader className="p-0">
        <div className="relative h-48 w-full">
          <Image src={image || "/placeholder.svg"} alt={title} fill className="object-cover" />
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              {complexity}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>{players} players</span>
          <span>{time}</span>
        </div>
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${star <= 4 ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
            />
          ))}
          <span className="ml-2 text-sm text-muted-foreground">4.0</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/games/${slug}`}>Details</Link>
        </Button>
        <Button
          size="sm"
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
        >
          Play
        </Button>
      </CardFooter>
    </Card>
  )
}

