import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CopyIcon, CheckIcon, TerminalSquareIcon } from 'lucide-react';
import { toast } from 'sonner';

interface McpConnectionGuideProps {
  apiKey?: string;
}

export function McpConnectionGuide({ apiKey }: McpConnectionGuideProps) {
  const [activeTab, setActiveTab] = useState('claude');
  const [copied, setCopied] = useState(false);

  const getConfig = (platform: string) => {
    const key = apiKey || 'YOUR_API_KEY_HERE';
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
    
    // Default to npx execution for simplest setup
    const command = "npx";
    const args = ["-y", "checklist-hq-mcp"]; // Assuming published or local linkage
    const env = {
      "CHQ_API_KEY": key,
      "CHQ_SUPABASE_URL": supabaseUrl,
      "CHQ_SUPABASE_ANON_KEY": supabaseAnonKey
    };

    if (platform === 'claude') {
      return JSON.stringify({
        mcpServers: {
          "checklist-hq": { command, args, env }
        }
      }, null, 2);
    }
    
    // For Cursor/Windsurf/Generic MCP clients
    return JSON.stringify({
      "checklist-hq": { command, args, env }
    }, null, 2);
  };

  const handleCopy = () => {
    const text = getConfig(activeTab);
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Configuration copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TerminalSquareIcon className="h-5 w-5 text-purple-500" />
          Connect to AI Assistants
        </CardTitle>
        <CardDescription>
          Use Checklist HQ directly inside Claude Desktop, Cursor, or Windsurf via MCP.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="claude" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="claude">Claude Desktop</TabsTrigger>
            <TabsTrigger value="cursor">Cursor</TabsTrigger>
            <TabsTrigger value="windsurf">Windsurf</TabsTrigger>
          </TabsList>
          
          <div className="relative rounded-md bg-muted p-4 font-mono text-xs overflow-x-auto border border-border">
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-2 top-2 h-8 w-8 bg-background/50 hover:bg-background"
              onClick={handleCopy}
            >
              {copied ? <CheckIcon className="h-4 w-4 text-green-500" /> : <CopyIcon className="h-4 w-4" />}
            </Button>
            
            <TabsContent value="claude" className="mt-0">
              <pre>{getConfig('claude')}</pre>
              <p className="mt-4 text-muted-foreground font-sans">
                Paste this into: <code className="bg-background px-1 rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code>
              </p>
            </TabsContent>
            
            <TabsContent value="cursor" className="mt-0">
              <pre>{getConfig('cursor')}</pre>
              <p className="mt-4 text-muted-foreground font-sans">
                Go to <strong>Settings &gt; Features &gt; MCP</strong> and add a new server with these details.
              </p>
            </TabsContent>
            
            <TabsContent value="windsurf" className="mt-0">
              <pre>{getConfig('windsurf')}</pre>
              <p className="mt-4 text-muted-foreground font-sans">
                Go to <strong>Settings &gt; AI &gt; MCP Servers</strong> and add this configuration.
              </p>
            </TabsContent>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-sm text-yellow-600 dark:text-yellow-400">
            <strong>Note:</strong> You need an API Key to connect. Generate one below if you haven't already.
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
