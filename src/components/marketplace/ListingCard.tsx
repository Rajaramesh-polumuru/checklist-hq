import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import StarIcon from '@hugeicons/core-free-icons/StarIcon'
import Download01Icon from '@hugeicons/core-free-icons/Download01Icon'
import CheckmarkBadge01Icon from '@hugeicons/core-free-icons/CheckmarkBadge01Icon'
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon'
import { cn } from '@/lib/utils'
import type { MarketplaceListing } from '@/types/database'

// Verification Badge Component
function VerificationBadge({ verified, tier }: { verified: boolean, tier?: string }) {
  if (!verified) return null

  if (tier === 'official') {
    return (
      <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-amber-200 gap-1 pl-1">
        <Icon icon={Shield01Icon} className="h-3 w-3" />
        Official
      </Badge>
    )
  }

  return (
    <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 border-green-200 gap-1 pl-1">
      <Icon icon={CheckmarkBadge01Icon} className="h-3 w-3" />
      Verified
    </Badge>
  )
}

interface ListingCardProps {
  listing: Partial<MarketplaceListing> & {
    author?: string
    agent?: string
    verified?: boolean
    tier?: 'community' | 'verified' | 'official'
    stars?: number
    installs?: number
  }
}

export function ListingCard({ listing }: ListingCardProps) {
  // Generate a consistent accent color based on title length
  const getAccentColor = (title: string = '') => {
    const colors = [
      { bg: 'bg-primary/10', text: 'text-primary', gradient: 'from-primary to-orange-400' },
      { bg: 'bg-emerald-500/10', text: 'text-emerald-500', gradient: 'from-emerald-500 to-teal-400' },
      { bg: 'bg-sky-500/10', text: 'text-sky-500', gradient: 'from-sky-500 to-cyan-400' },
      { bg: 'bg-violet-500/10', text: 'text-violet-500', gradient: 'from-violet-500 to-purple-400' },
      { bg: 'bg-pink-500/10', text: 'text-pink-500', gradient: 'from-pink-500 to-rose-400' },
    ]
    return colors[title.length % colors.length]
  }

  const accent = getAccentColor(listing.title)

  return (
    <div className="h-full">
      <Link to={`/marketplace/${listing.id}`} className="block h-full">
        <Card
          className={cn(
            "group h-full flex flex-col relative overflow-hidden",
            "transition-all duration-300",
            "hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5"
          )}
        >
          {/* Gradient accent bar */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-300",
            accent.gradient,
            "group-hover:h-1.5"
          )} />

          <CardHeader className="pb-3 pt-6">
            <div className="flex justify-between items-start gap-2 mb-2">
              <Badge variant="outline" className="text-xs font-normal">
                {listing.category}
              </Badge>
              <VerificationBadge verified={!!listing.verified} tier={listing.tier} />
            </div>
            
            <CardTitle className="leading-tight group-hover:text-primary transition-colors text-lg">
              {listing.title}
            </CardTitle>
            
            <CardDescription className="line-clamp-2 text-sm mt-2">
              {listing.description || listing.short_description}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1">
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
              <span className="font-medium text-foreground flex items-center gap-1">
                {listing.author}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Icon icon={StarIcon} className="h-3 w-3 text-amber-500 fill-amber-500" />
                {listing.rating_avg || listing.stars || '0.0'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Icon icon={Download01Icon} className="h-3 w-3" />
                {(listing.install_count || listing.installs || 0).toLocaleString()}
              </span>
            </div>

            {/* Agent Compatibility Badge */}
            {listing.agent && (
              <div className="text-xs flex items-center gap-1.5 bg-muted/50 p-2 rounded text-muted-foreground border border-transparent group-hover:border-border transition-colors">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                Optimized for <strong className="text-foreground">{listing.agent}</strong>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-0 border-t bg-muted/5 p-3">
            <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Icon icon={Clock01Icon} className="h-3 w-3" />
                {listing.estimated_duration || '15m'}
              </span>
              <span className="group-hover:translate-x-1 transition-transform text-primary font-medium flex items-center gap-1">
                View Details
                <Icon icon={Download01Icon} className="h-3 w-3 rotate-[-90deg]" />
              </span>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </div>
  )
}
