import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import StarIcon from '@hugeicons/core-free-icons/StarIcon'
import ThumbsUpIcon from '@hugeicons/core-free-icons/ThumbsUpIcon'
import PencilEdit02Icon from '@hugeicons/core-free-icons/PencilEdit02Icon'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// Mock Data
const MOCK_REVIEWS = [
  { id: 1, user: 'Sarah K.', rating: 5, date: '2 days ago', text: 'This saved our team hours of setup time. Highly recommended!', helpful: 12 },
  { id: 2, user: 'DevOps Dave', rating: 4, date: '1 week ago', text: 'Great structure, but step 4 needs an update for AWS CLI v2.', helpful: 8 },
  { id: 3, user: 'Alex M.', rating: 5, date: '2 weeks ago', text: 'Perfect template for beginners.', helpful: 3 },
]

export function Reviews({ listingId: _listingId }: { listingId: string }) {
  const [reviews, setReviews] = useState(MOCK_REVIEWS)
  const [showWriteModal, setShowWriteModal] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, text: '' })

  const handleSubmitReview = () => {
    // In a real app, send to API
    setReviews([
      {
        id: Date.now(),
        user: 'You',
        rating: newReview.rating,
        date: 'Just now',
        text: newReview.text,
        helpful: 0
      },
      ...reviews
    ])
    setShowWriteModal(false)
    setNewReview({ rating: 5, text: '' })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Rating Breakdown */}
        <div className="w-full md:w-1/3 space-y-4">
          <div className="text-center md:text-left">
            <div className="text-5xl font-bold text-foreground">4.8</div>
            <div className="flex items-center justify-center md:justify-start gap-1 my-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Icon key={i} icon={StarIcon} className={cn("h-5 w-5", i <= 4 ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30")} />
              ))}
            </div>
            <p className="text-muted-foreground text-sm">{reviews.length} reviews</p>
          </div>

          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-3">{rating}</span>
                <Icon icon={StarIcon} className="h-3 w-3 text-muted-foreground" />
                <Progress value={rating === 5 ? 70 : rating === 4 ? 20 : 5} className="h-2" />
                <span className="w-8 text-right text-muted-foreground">{rating === 5 ? '70%' : rating === 4 ? '20%' : '5%'}</span>
              </div>
            ))}
          </div>

          <Button className="w-full" onClick={() => setShowWriteModal(true)}>
            <Icon icon={PencilEdit02Icon} className="mr-2 h-4 w-4" />
            Write a Review
          </Button>
        </div>

        {/* Review List */}
        <div className="flex-1 space-y-4 w-full">
          {reviews.map((review) => (
            <Card key={review.id} className="bg-muted/10">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                      {review.user[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{review.user}</p>
                      <p className="text-xs text-muted-foreground">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon key={i} icon={StarIcon} className={cn("h-3 w-3", i < review.rating ? "fill-amber-500" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-4">{review.text}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <Icon icon={ThumbsUpIcon} className="h-3 w-3" />
                    Helpful ({review.helpful})
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Write Review Modal */}
      <Dialog open={showWriteModal} onOpenChange={setShowWriteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setNewReview({ ...newReview, rating })}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Icon 
                    icon={StarIcon} 
                    className={cn(
                      "h-8 w-8", 
                      rating <= newReview.rating ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"
                    )} 
                  />
                </button>
              ))}
            </div>
            <Textarea 
              placeholder="Share your experience with this SOP..." 
              value={newReview.text}
              onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWriteModal(false)}>Cancel</Button>
            <Button onClick={handleSubmitReview} disabled={!newReview.text}>Submit Review</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
