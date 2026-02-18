import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { ListingCard } from '@/components/marketplace/ListingCard'
import Search01Icon from '@hugeicons/core-free-icons/Search01Icon'
import FilterHorizontalIcon from '@hugeicons/core-free-icons/FilterHorizontalIcon'
import StarIcon from '@hugeicons/core-free-icons/StarIcon'
import ShoppingBag02Icon from '@hugeicons/core-free-icons/ShoppingBag02Icon'
import Rocket01Icon from '@hugeicons/core-free-icons/Rocket01Icon'
import Settings01Icon from '@hugeicons/core-free-icons/Settings01Icon'
import Megaphone01Icon from '@hugeicons/core-free-icons/Megaphone01Icon'
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'
// Mock Data for Prototype
const FEATURED_SOPS = [
  {
    id: '1',
    title: 'Enterprise AWS Deployment',
    description: 'A complete guide to deploying secure, scalable applications on AWS using Terraform and Docker.',
    category: 'DevOps',
    installs: 1205,
    stars: 4.8,
    author: 'CloudOps Team',
    verified: true,
    tier: 'official' as const,
    agent: 'Claude 3.5',
    estimated_duration: '45m'
  },
  {
    id: '2',
    title: 'Employee Onboarding V2',
    description: 'Streamlined HR process for welcoming new hires, including IT setup and compliance checks.',
    category: 'HR',
    installs: 850,
    stars: 4.9,
    author: 'PeopleOps',
    verified: true,
    agent: 'GPT-4',
    estimated_duration: '30m'
  },
  {
    id: '3',
    title: 'Incident Response Playbook',
    description: 'Critical steps for managing SEV-1 incidents, communication templates, and post-mortem.',
    category: 'Engineering',
    installs: 2340,
    stars: 4.7,
    author: 'SRE Pro',
    verified: false,
    agent: 'Auto-Pilot',
    estimated_duration: '1h 15m'
  }
]

const CATEGORIES = [
  { name: 'Engineering', icon: Settings01Icon, count: 120 },
  { name: 'Marketing', icon: Megaphone01Icon, count: 85 },
  { name: 'Security', icon: Shield01Icon, count: 64 },
  { name: 'Productivity', icon: Rocket01Icon, count: 210 },
]

export function Marketplace() {
  const [search, setSearch] = useState('')

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b pt-20 pb-16 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Icon icon={ShoppingBag02Icon} className="h-4 w-4" />
            The Process Store
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Discover verified <span className="text-primary">Agent SOPs</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Fork and run battle-tested checklists for Engineering, Operations, and more. 
            Powered by humans, executed by AI.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center bg-card border rounded-xl shadow-lg h-14 px-4 gap-3 focus-within:ring-2 ring-primary/20 transition-all">
              <Icon icon={Search01Icon} className="h-5 w-5 text-muted-foreground" />
              <input 
                className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-muted-foreground/50"
                placeholder="Search for 'deployment', 'onboarding', 'audit'..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="hidden sm:flex gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Icon icon={FilterHorizontalIcon} className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button>Search</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl space-y-16">
        
        {/* Categories */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <button 
                key={cat.name}
                className="flex flex-col items-center justify-center p-6 bg-card hover:bg-accent/50 border rounded-xl transition-all hover:scale-105 group"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <Icon icon={cat.icon} className="h-6 w-6 text-primary" />
                </div>
                <span className="font-semibold">{cat.name}</span>
                <span className="text-xs text-muted-foreground">{cat.count} SOPs</span>
              </button>
            ))}
          </div>
        </section>

        {/* Featured */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Icon icon={StarIcon} className="h-6 w-6 text-amber-500 fill-amber-500" />
              Featured this Week
            </h2>
            <Button variant="link">View All</Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURED_SOPS.map((sop) => (
              <ListingCard key={sop.id} listing={sop} />
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary/5 border border-primary/20 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4">Publish Your Process</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Share your best SOPs with the world. Earn reputation and help others build faster.
            </p>
            <Button size="lg" className="gap-2">
              Start Publishing
              <Icon icon={Rocket01Icon} className="h-4 w-4" />
            </Button>
          </div>
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </section>

      </div>
    </div>
  )
}
