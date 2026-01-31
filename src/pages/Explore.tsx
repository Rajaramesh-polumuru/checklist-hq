import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GitFork, Search, TrendingUp, Clock, Star } from 'lucide-react'

// Placeholder data - will be fetched from Supabase
const FEATURED_TEMPLATES = [
  {
    id: '1',
    title: 'React App Deployment Checklist',
    description: 'Comprehensive checklist for deploying React applications to production',
    forkCount: 1247,
    owner: 'devops-team',
  },
  {
    id: '2',
    title: 'Code Review Guidelines',
    description: 'Best practices for conducting thorough code reviews',
    forkCount: 892,
    owner: 'engineering',
  },
  {
    id: '3',
    title: 'New Employee Onboarding',
    description: 'Complete onboarding checklist for new team members',
    forkCount: 654,
    owner: 'hr-team',
  },
  {
    id: '4',
    title: 'Security Audit Checklist',
    description: 'Comprehensive security audit for web applications',
    forkCount: 521,
    owner: 'security',
  },
  {
    id: '5',
    title: 'Product Launch Checklist',
    description: 'Everything you need before launching a new product',
    forkCount: 478,
    owner: 'product-team',
  },
  {
    id: '6',
    title: 'Sprint Planning Meeting',
    description: 'Structured checklist for effective sprint planning',
    forkCount: 412,
    owner: 'agile-coaches',
  },
]

export function Explore() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'trending' | 'recent' | 'starred'>('trending')

  const filteredTemplates = FEATURED_TEMPLATES.filter(
    (template) =>
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Explore Templates</h1>
        <p className="text-muted-foreground mb-6">
          Discover proven checklists from the community. Fork, customize, and make them yours.
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-8">
        <Button
          variant={activeTab === 'trending' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('trending')}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          Trending
        </Button>
        <Button
          variant={activeTab === 'recent' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('recent')}
        >
          <Clock className="mr-2 h-4 w-4" />
          Recent
        </Button>
        <Button
          variant={activeTab === 'starred' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('starred')}
        >
          <Star className="mr-2 h-4 w-4" />
          Most Forked
        </Button>
      </div>

      {/* Template Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">by {template.owner}</p>
                </div>
              </div>
              <CardDescription className="mt-2">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <GitFork className="h-4 w-4" />
                  <span>{template.forkCount.toLocaleString()} forks</span>
                </div>
                <Button size="sm" asChild>
                  <Link to={`/repo/${template.id}`}>
                    <GitFork className="mr-2 h-4 w-4" />
                    Fork
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No templates found matching "{searchQuery}"</p>
        </div>
      )}
    </div>
  )
}
