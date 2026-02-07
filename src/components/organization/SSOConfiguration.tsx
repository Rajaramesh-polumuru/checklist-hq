import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Icon } from '@/components/ui/icon'
import {
  LockKeyIcon,
  Copy01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons'

interface SSOConfigurationProps {
  organizationId: string
}

export function SSOConfiguration({ organizationId }: SSOConfigurationProps) {
  const [jitProvisioning, setJitProvisioning] = useState(false)
  const [copied, setCopied] = useState(false)

  const acsUrl = `https://app.checklist.io/auth/saml/acs/${organizationId}`
  const entityId = `https://app.checklist.io/auth/saml/metadata/${organizationId}`

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Icon icon={LockKeyIcon} className="h-6 w-6" />
          Single Sign-On (SSO)
        </h2>
        <p className="text-muted-foreground mt-1">
          Configure SAML or OIDC authentication for your organization
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🔐</div>
            <div>
              <h3 className="font-semibold text-sm mb-1">Enterprise Authentication</h3>
              <p className="text-xs text-muted-foreground">
                Integrate with your existing identity provider (Okta, Azure AD, Google Workspace,
                OneLogin) to enable seamless single sign-on for your organization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Provider Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service Provider Information</CardTitle>
          <CardDescription>
            Use these values when configuring your identity provider
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>ACS (Assertion Consumer Service) URL</Label>
            <div className="flex gap-2">
              <Input value={acsUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(acsUrl)}
                className="shrink-0 active:scale-95 transition-transform"
              >
                <Icon icon={copied ? CheckmarkCircle01Icon : Copy01Icon} className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Entity ID / Audience URI</Label>
            <div className="flex gap-2">
              <Input value={entityId} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(entityId)}
                className="shrink-0 active:scale-95 transition-transform"
              >
                <Icon icon={copied ? CheckmarkCircle01Icon : Copy01Icon} className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Identity Provider Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="saml">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="saml">SAML 2.0</TabsTrigger>
              <TabsTrigger value="oidc">OIDC</TabsTrigger>
            </TabsList>

            <TabsContent value="saml" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="saml-entity-id">IdP Entity ID</Label>
                <Input
                  id="saml-entity-id"
                  placeholder="https://idp.example.com/metadata"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saml-sso-url">SSO URL</Label>
                <Input
                  id="saml-sso-url"
                  placeholder="https://idp.example.com/sso"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="saml-cert">X.509 Certificate</Label>
                <Textarea
                  id="saml-cert"
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>

              <Button className="active:scale-95 transition-transform">
                Save SAML Configuration
              </Button>
            </TabsContent>

            <TabsContent value="oidc" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="oidc-client-id">Client ID</Label>
                <Input
                  id="oidc-client-id"
                  placeholder="your-client-id"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oidc-client-secret">Client Secret</Label>
                <Input
                  id="oidc-client-secret"
                  type="password"
                  placeholder="your-client-secret"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="oidc-discovery-url">Discovery URL</Label>
                <Input
                  id="oidc-discovery-url"
                  placeholder="https://idp.example.com/.well-known/openid-configuration"
                />
              </div>

              <Button className="active:scale-95 transition-transform">
                Save OIDC Configuration
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="jit-provisioning">Just-in-Time Provisioning</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically create user accounts on first login
              </p>
            </div>
            <Switch
              id="jit-provisioning"
              checked={jitProvisioning}
              onCheckedChange={setJitProvisioning}
            />
          </div>

          <div className="space-y-2">
            <Label>Role Mapping</Label>
            <p className="text-xs text-muted-foreground">
              Map IdP groups to organization roles
            </p>
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2">
                <Input placeholder="IdP Group" className="flex-1" />
                <span className="text-muted-foreground">→</span>
                <Input placeholder="Org Role" className="flex-1" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="bg-warning/5 border-warning/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Icon icon={AlertCircleIcon} className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm mb-1">Testing Required</h3>
              <p className="text-xs text-muted-foreground">
                After configuring SSO, test the integration thoroughly before enforcing it for all
                users. Keep a backup admin account with password login for emergency access.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
