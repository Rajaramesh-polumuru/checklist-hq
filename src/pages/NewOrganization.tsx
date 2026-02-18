import { useState, useCallback, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { createOrganization, isSlugAvailable } from '@/services/organization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ErrorBanner, SuccessBanner } from '@/components/ErrorBanner'
import { useDebounce } from '@/hooks/useDebounce'
import Building02Icon from '@hugeicons/core-free-icons/Building02Icon'
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon'
import Tick01Icon from '@hugeicons/core-free-icons/Tick01Icon'
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon'
import Loading02Icon from '@hugeicons/core-free-icons/Loading02Icon'
import InformationCircleIcon from '@hugeicons/core-free-icons/InformationCircleIcon'
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon'
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon'
import SparklesIcon from '@hugeicons/core-free-icons/SparklesIcon'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

// Slug validation regex: lowercase letters, numbers, and hyphens
// Must start and end with alphanumeric, at least 3 characters
const SLUG_REGEX = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/
const MIN_SLUG_LENGTH = 3
const MAX_SLUG_LENGTH = 50
const MAX_NAME_LENGTH = 100
const MAX_DESCRIPTION_LENGTH = 500

interface FormErrors {
  name?: string
  slug?: string
  description?: string
}

/**
 * Converts a name to a URL-friendly slug
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, MAX_SLUG_LENGTH)
}

/**
 * Validates a slug format
 */
function validateSlugFormat(slug: string): string | null {
  if (!slug) {
    return 'Slug is required'
  }
  if (slug.length < MIN_SLUG_LENGTH) {
    return `Slug must be at least ${MIN_SLUG_LENGTH} characters`
  }
  if (slug.length > MAX_SLUG_LENGTH) {
    return `Slug must be at most ${MAX_SLUG_LENGTH} characters`
  }
  if (!SLUG_REGEX.test(slug) && slug.length >= MIN_SLUG_LENGTH) {
    return 'Use only lowercase letters, numbers, and hyphens. Must start and end with a letter or number.'
  }
  return null
}

export function NewOrganization() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

  // Validation state
  const [errors, setErrors] = useState<FormErrors>({})
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  // Debounced slug for availability check
  const debouncedSlug = useDebounce(slug, 500)

  // Auto-generate slug from name if not manually edited
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      setSlug(generateSlug(name))
    }
  }, [name, slugManuallyEdited])

  // Check slug availability when debounced slug changes
  useEffect(() => {
    async function checkSlug() {
      const formatError = validateSlugFormat(debouncedSlug)
      if (formatError) {
        setSlugAvailable(null)
        return
      }

      setCheckingSlug(true)
      try {
        const available = await isSlugAvailable(debouncedSlug)
        setSlugAvailable(available)
        if (!available) {
          setErrors((prev) => ({ ...prev, slug: 'This slug is already taken' }))
        } else {
          setErrors((prev) => ({ ...prev, slug: undefined }))
        }
      } catch {
        // Silently fail - will catch on submit
        setSlugAvailable(null)
      } finally {
        setCheckingSlug(false)
      }
    }

    if (debouncedSlug && debouncedSlug.length >= MIN_SLUG_LENGTH) {
      checkSlug()
    } else {
      setSlugAvailable(null)
    }
  }, [debouncedSlug])

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Organization name is required'
    } else if (name.length > MAX_NAME_LENGTH) {
      newErrors.name = `Name must be at most ${MAX_NAME_LENGTH} characters`
    }

    // Slug validation
    const slugError = validateSlugFormat(slug)
    if (slugError) {
      newErrors.slug = slugError
    } else if (slugAvailable === false) {
      newErrors.slug = 'This slug is already taken'
    }

    // Description validation (optional but has max length)
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.description = `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [name, slug, description, slugAvailable])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!user) {
      setSubmitError('You must be logged in to create an organization')
      return
    }

    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    try {
      const orgId = await createOrganization({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
      })

      setSubmitSuccess('Organization created successfully! Redirecting...')

      // Redirect to the new organization's dashboard after a brief delay
      setTimeout(() => {
        navigate(`/app/orgs/${orgId}`)
      }, 1500)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create organization'
      setSubmitError(message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle slug input change
  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true)
    // Only allow valid slug characters
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(sanitized)
  }

  // Render slug status indicator
  const renderSlugStatus = () => {
    if (!slug || slug.length < MIN_SLUG_LENGTH) return null

    if (checkingSlug) {
      return (
        <span className="flex items-center gap-1 text-muted-foreground">
          <Icon icon={Loading02Icon} className="h-4 w-4 animate-spin" />
          <span className="text-xs">Checking...</span>
        </span>
      )
    }

    if (slugAvailable === true) {
      return (
        <span className="flex items-center gap-1 text-emerald-600">
          <Icon icon={Tick01Icon} className="h-4 w-4" />
          <span className="text-xs">Available</span>
        </span>
      )
    }

    if (slugAvailable === false) {
      return (
        <span className="flex items-center gap-1 text-destructive">
          <Icon icon={Cancel01Icon} className="h-4 w-4" />
          <span className="text-xs">Taken</span>
        </span>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/5">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app">
                <Icon icon={ArrowLeft01Icon} className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Error/Success Banners */}
      <ErrorBanner error={submitError} onDismiss={() => setSubmitError(null)} priority="assertive" />
      <SuccessBanner message={submitSuccess} onDismiss={() => setSubmitSuccess(null)} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-violet-500 mb-4">
            <Icon icon={Building02Icon} className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Create Organization</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Organizations let you collaborate with team members on shared checklists and processes.
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon icon={UserGroupIcon} className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Team Collaboration</h3>
              <p className="text-xs text-muted-foreground">Invite members with role-based access</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border">
            <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <Icon icon={Shield01Icon} className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Access Control</h3>
              <p className="text-xs text-muted-foreground">Owner, Admin, Member, Viewer roles</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-card border">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Icon icon={SparklesIcon} className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Shared Workspaces</h3>
              <p className="text-xs text-muted-foreground">Organize checklists by teams</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>
              Fill in the details below to create your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Organization Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Organization Name <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Acme Corporation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={MAX_NAME_LENGTH}
                  aria-describedby="name-error name-hint"
                  aria-invalid={!!errors.name}
                  className={cn(errors.name && 'border-destructive focus-visible:ring-destructive')}
                  disabled={submitting}
                />
                <div className="flex justify-between text-xs">
                  <span id="name-hint" className="text-muted-foreground">
                    The display name for your organization
                  </span>
                  <span className="text-muted-foreground">
                    {name.length}/{MAX_NAME_LENGTH}
                  </span>
                </div>
                {errors.name && (
                  <p id="name-error" className="text-sm text-destructive">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Organization Slug */}
              <div className="space-y-2">
                <label htmlFor="slug" className="text-sm font-medium">
                  Organization URL <span className="text-destructive">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-sm text-muted-foreground">checklist-hq.com/org/</span>
                    </div>
                    <Input
                      id="slug"
                      type="text"
                      placeholder="acme-corp"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      maxLength={MAX_SLUG_LENGTH}
                      aria-describedby="slug-error slug-hint"
                      aria-invalid={!!errors.slug}
                      className={cn(
                        'pl-[165px]',
                        errors.slug && 'border-destructive focus-visible:ring-destructive',
                        slugAvailable === true && 'border-emerald-500 focus-visible:ring-emerald-500'
                      )}
                      disabled={submitting}
                    />
                  </div>
                  {renderSlugStatus()}
                </div>
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Icon icon={InformationCircleIcon} className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span id="slug-hint">
                    Use lowercase letters, numbers, and hyphens. Must be at least {MIN_SLUG_LENGTH} characters.
                  </span>
                </div>
                {errors.slug && (
                  <p id="slug-error" className="text-sm text-destructive">
                    {errors.slug}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description <span className="text-muted-foreground">(optional)</span>
                </label>
                <Textarea
                  id="description"
                  placeholder="A brief description of your organization..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  rows={3}
                  aria-describedby="description-error description-hint"
                  aria-invalid={!!errors.description}
                  className={cn(errors.description && 'border-destructive focus-visible:ring-destructive')}
                  disabled={submitting}
                />
                <div className="flex justify-between text-xs">
                  <span id="description-hint" className="text-muted-foreground">
                    Help team members understand what this organization is for
                  </span>
                  <span className="text-muted-foreground">
                    {description.length}/{MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
                {errors.description && (
                  <p id="description-error" className="text-sm text-destructive">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || checkingSlug || !name.trim() || !slug.trim() || slugAvailable === false}
                  loading={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Organization'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-dashed">
          <div className="flex items-start gap-3">
            <Icon icon={InformationCircleIcon} className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">What happens next?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>You'll be the owner of the organization with full access</li>
                <li>You can invite team members after creation</li>
                <li>Create teams to organize your members and repositories</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NewOrganization
