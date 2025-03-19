import { Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"

interface GameReviewProps {
  author: string
  avatar: string
  rating: number
  date: string
  content: string
}

export function GameReview({ author, avatar, rating, date, content }: GameReviewProps) {
  return (
    <Card className="bg-background/50 border-muted">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar} alt={author} />
            <AvatarFallback>{author.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
              <div>
                <h4 className="font-medium">{author}</h4>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">{date}</span>
            </div>

            <p className="text-sm leading-relaxed">{content}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

