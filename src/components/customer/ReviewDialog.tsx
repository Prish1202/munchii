import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useSubmitReview } from '@/hooks/useReviews';
import { cn } from '@/lib/utils';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  restaurantId: string;
  restaurantName: string;
}

export function ReviewDialog({
  open,
  onOpenChange,
  orderId,
  restaurantId,
  restaurantName,
}: ReviewDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const submitReview = useSubmitReview();

  const handleSubmit = () => {
    if (rating === 0) return;
    submitReview.mutate(
      { orderId, restaurantId, rating, reviewText: reviewText.trim() || undefined },
      {
        onSuccess: () => {
          onOpenChange(false);
          setRating(0);
          setReviewText('');
        },
      }
    );
  };

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Rate your experience</DialogTitle>
          <DialogDescription>
            How was your order from <span className="font-semibold text-foreground">{restaurantName}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Star rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    'w-8 h-8 transition-colors',
                    star <= displayRating
                      ? 'fill-coin text-coin'
                      : 'text-muted-foreground/30'
                  )}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="text-center text-sm text-muted-foreground">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent!'}
            </p>
          )}

          {/* Review text */}
          <Textarea
            placeholder="Share your experience (optional)"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="resize-none rounded-xl"
            rows={3}
          />

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Skip
            </Button>
            <Button
              className="flex-1 rounded-xl"
              disabled={rating === 0 || submitReview.isPending}
              onClick={handleSubmit}
            >
              {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
