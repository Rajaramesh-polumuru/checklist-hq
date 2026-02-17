import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Icon } from '@/components/ui/icon';
import { PlusSignIcon, Delete02Icon, ComputerIcon } from '@hugeicons/core-free-icons';
// Badge import removed

// Mock data
const MOCK_IPS = [
  { id: '1', ip: '192.168.1.0/24', description: 'Office VPN', created_at: '2023-10-01' },
  { id: '2', ip: '10.0.0.5', description: 'CI/CD Server', created_at: '2023-11-15' },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function IPAllowlistSettings({ organizationId: _orgId }: { organizationId: string }) {
  const [enabled, setEnabled] = useState(false);
  const [ips, setIps] = useState(MOCK_IPS);
  const [newIp, setNewIp] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleAdd = () => {
    if (!newIp) return;
    setIps([...ips, { 
      id: Math.random().toString(), 
      ip: newIp, 
      description: newDesc || 'Manual Entry', 
      created_at: new Date().toISOString() 
    }]);
    setNewIp('');
    setNewDesc('');
  };

  const handleDelete = (id: string) => {
    setIps(ips.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-base">Enforce IP Allowlist</Label>
          <p className="text-sm text-muted-foreground">
            Only allow access from specific IP addresses or CIDR ranges.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="ip" className="text-xs">IP Address / CIDR</Label>
            <Input 
              id="ip" 
              placeholder="e.g. 203.0.113.0/24" 
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label htmlFor="desc" className="text-xs">Description</Label>
            <Input 
              id="desc" 
              placeholder="e.g. HQ Office" 
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>
          <div className="pt-5">
            <Button onClick={handleAdd} disabled={!newIp}>
              <Icon icon={PlusSignIcon} className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {ips.map(ip => (
            <div key={ip.id} className="flex items-center justify-between p-3 bg-background border rounded-md">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                  <Icon icon={ComputerIcon} className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-mono text-sm font-medium">{ip.ip}</div>
                  <div className="text-xs text-muted-foreground">{ip.description}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(ip.id)} className="text-destructive hover:bg-destructive/10">
                <Icon icon={Delete02Icon} className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {ips.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No IP addresses configured.
            </div>
          )}
        </div>
      </div>
      
      {enabled && ips.length === 0 && (
        <div className="bg-amber-50 text-amber-800 p-3 rounded-md text-sm border border-amber-200">
          Warning: Enabling allowlist with no IPs will lock everyone out (except owners).
        </div>
      )}
    </div>
  );
}
