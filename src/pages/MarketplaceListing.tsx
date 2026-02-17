import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { 
  ArrowLeft01Icon, 
  StarIcon, 
  Download01Icon, 
  GitForkIcon, 
  Shield01Icon,
  Clock01Icon,
  Share08Icon
} from '@hugeicons/core-free-icons'
import { ListingCard } from '@/components/marketplace/ListingCard'
import { Reviews } from '@/components/marketplace/Reviews'

// Mock Data (in real app, fetch from DB)
const MOCK_LISTING = {
  id: '1',
  title: 'Enterprise AWS Deployment',
  description: 'A complete, production-ready guide to deploying secure, scalable applications on AWS using Terraform and Docker. Includes steps for VPC setup, RDS configuration, ECS cluster management, and CI/CD pipeline integration via GitHub Actions.',
  category: 'DevOps',
  installs: 1205,
  stars: 4.8,
  rating_count: 42,
  author: 'CloudOps Team',
  verified: true,
  tier: 'official' as const,
  agent: 'Claude 3.5',
  estimated_duration: '45m',
  updated_at: '2 days ago',
  version: '2.1.0',
  tags: ['AWS', 'Terraform', 'Docker', 'CI/CD']
}

const RELATED_LISTINGS = [
  {
    id: '2',
    title: 'AWS Security Audit',
    category: 'Security',
    installs: 850,
    stars: 4.9,
    author: 'SecOps Pro',
    verified: true,
    agent: 'GPT-4'
  },
  {
    id: '3',
    title: 'Terraform Best Practices',
    category: 'DevOps',
    installs: 2340,
    stars: 4.7,
    author: 'HashiFan',
    verified: false,
    agent: 'Auto-Pilot'
  }
]

export function MarketplaceListing() {
  const { listingId } = useParams()
  const [listing] = useState(MOCK_LISTING) // In real app, fetch by listingId
  const [activeTab, setActiveTab] = useState<'details' | 'reviews'>('details')

  // Simulate loading
  useEffect(() => {
    // fetchListing(listingId)
  }, [listingId])

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/marketplace" className="hover:text-foreground flex items-center gap-1">
              <Icon icon={ArrowLeft01Icon} className="h-4 w-4" />
              Back to Marketplace
            </Link>
            <span>/</span>
            <span>{listing.category}</span>
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Icon */}
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
              <span className="text-4xl">🚀</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">{listing.title}</h1>
                {listing.verified && (
                  <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 gap-1 pl-1">
                    <Icon icon={Shield01Icon} className="h-3.5 w-3.5" />
                    Official
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                    {listing.author[0]}
                  </div>
                  <span className="text-foreground font-medium">{listing.author}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon icon={StarIcon} className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="text-foreground font-medium">{listing.stars}</span>
                  <span>({listing.rating_count} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon icon={Download01Icon} className="h-4 w-4" />
                  <span>{listing.installs.toLocaleString()} installs</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon icon={Clock01Icon} className="h-4 w-4" />
                  <span>Updated {listing.updated_at}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="gap-2">
                  <Icon icon={GitForkIcon} className="h-4 w-4" />
                  Fork to Account
                </Button>
                <Button variant="outline" size="lg" className="gap-2">
                  <Icon icon={Share08Icon} className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="container mx-auto px-4">
          <div className="flex gap-6 -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'details' 
                  ? 'border-primary text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'reviews' 
                  ? 'border-primary text-foreground' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Reviews ({listing.rating_count})
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'details' && (
              <>
                <section>
                  <h2 className="text-xl font-semibold mb-4">About this SOP</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {listing.description}
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="px-3 py-1">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Reviews Section - Visible on both tabs or just reviews? Typically specific tab. */}
            {activeTab === 'reviews' && (
              <section className="pt-0">
                <Reviews listingId={listing.id} />
              </section>
            )}
            
            {/* Show reviews on details page too? Maybe simplified. For now keeping it simple. */}
            {activeTab === 'details' && (
               <section className="pt-8 border-t">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Reviews</h2>
                  <Button variant="link" onClick={() => setActiveTab('reviews')}>View All</Button>
                </div>
                <Reviews listingId={listing.id} />
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Est. Duration</span>
                  <span className="font-medium">{listing.estimated_duration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Difficulty</span>
                  <span className="font-medium capitalize">Intermediate</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <span className="font-medium">{listing.version}</span>
                </div>
              </CardContent>
            </Card>

            <div className="pt-6">
              <h3 className="font-semibold mb-4">Related SOPs</h3>
              <div className="space-y-4">
                {RELATED_LISTINGS.map(related => (
                  <ListingCard key={related.id} listing={related} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
