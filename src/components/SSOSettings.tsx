import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Icon } from '@/components/ui/icon';
import { Link01Icon, Copy01Icon } from '@hugeicons/core-free-icons';
import { toast } from 'sonner';

export function SSOSettings({ organizationId }: { organizationId: string }) {
  const [metadataUrl, setMetadataUrl] = useState('');
  const [domain, setDomain] = useState('');

  const acsUrl = `https://checklist-hq.com/auth/v1/sso/saml/acs/${organizationId}`;
  const entityId = `https://checklist-hq.com/auth/v1/sso/saml/metadata/${organizationId}`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-8">
      <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
        <h4 className="font-medium text-sm">Service Provider Configuration</h4>
        <p className="text-sm text-muted-foreground">
          Use these values to configure your Identity Provider (Okta, Google, Azure AD).
        </p>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">ACS URL (Reply URL)</Label>
            <div className="flex gap-2">
              <Input readOnly value={acsUrl} className="font-mono text-xs bg-background" />
              <Button variant="ghost" size="icon" onClick={() => handleCopy(acsUrl)}>
                <Icon icon={Copy01Icon} className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Entity ID (Audience URI)</Label>
            <div className="flex gap-2">
              <Input readOnly value={entityId} className="font-mono text-xs bg-background" />
              <Button variant="ghost" size="icon" onClick={() => handleCopy(entityId)}>
                <Icon icon={Copy01Icon} className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-sm">Identity Provider Details</h4>
        
        <div className="space-y-2">
          <Label>Allowed Domain</Label>
          <Input 
            placeholder="e.g. acme.com" 
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Users with email addresses at this domain will be redirected to SSO.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Metadata XML</Label>
          <Textarea 
            placeholder="Paste your IdP metadata XML here..." 
            className="font-mono text-xs min-h-[150px]"
          />
        </div>

        <div className="space-y-2">
          <Label>Metadata URL (Optional)</Label>
          <Input 
            placeholder="https://..." 
            value={metadataUrl}
            onChange={(e) => setMetadataUrl(e.target.value)}
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button disabled={!domain}>
            <Icon icon={Link01Icon} className="mr-2 h-4 w-4" />
            Enable SSO
          </Button>
        </div>
      </div>
    </div>
  );
}
