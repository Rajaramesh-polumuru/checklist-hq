import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Cloud, CloudOff, Smartphone, Monitor, Tablet, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/lib/date-utils'

interface ActiveDevice {
  device_id: string
  device_name: string | null
  user_id: string
  last_seen_at: string
  isCurrentDevice: boolean
}

interface SyncIndicatorProps {
  isConnected: boolean
  isSyncing?: boolean
  otherDevices: ActiveDevice[]
  lastSyncedAt: Date | null
  syncError: string | null
  className?: string
  compact?: boolean
}

// Get icon for device type
function getDeviceIcon(deviceName: string | null) {
  const name = (deviceName || '').toLowerCase()
  if (name.includes('iphone') || name.includes('android')) {
    return Smartphone
  }
  if (name.includes('ipad') || name.includes('tablet')) {
    return Tablet
  }
  return Monitor
}

export function SyncIndicator({
  isConnected,
  isSyncing = false,
  otherDevices,
  lastSyncedAt,
  syncError,
  className,
  compact = false,
}: SyncIndicatorProps) {
  // Determine status
  const status: 'connected' | 'syncing' | 'error' | 'offline' = syncError
    ? 'error'
    : !isConnected
      ? 'offline'
      : isSyncing
        ? 'syncing'
        : 'connected'

  const statusConfig = {
    connected: {
      color: 'bg-success',
      icon: Cloud,
      label: 'Synced',
      description: 'All changes saved',
    },
    syncing: {
      color: 'bg-warning',
      icon: Loader2,
      label: 'Syncing',
      description: 'Saving changes...',
    },
    error: {
      color: 'bg-destructive',
      icon: CloudOff,
      label: 'Sync Error',
      description: syncError || 'Unable to sync',
    },
    offline: {
      color: 'bg-muted-foreground',
      icon: CloudOff,
      label: 'Offline',
      description: 'Not connected',
    },
  }

  const config = statusConfig[status]
  const Icon = config.icon

  // Compact mode - just show dot
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1.5', className)}>
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  config.color,
                  status === 'syncing' && 'animate-pulse'
                )}
              />
              {otherDevices.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  +{otherDevices.length}
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', status === 'syncing' && 'animate-spin')} />
                <span className="font-medium">{config.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{config.description}</p>
              {lastSyncedAt && (
                <p className="text-xs text-muted-foreground">
                  Last synced {formatRelativeTime(lastSyncedAt.toISOString())}
                </p>
              )}
              {otherDevices.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs font-medium mb-1">Also viewing on:</p>
                  <div className="space-y-1">
                    {otherDevices.map((device) => {
                      const DeviceIcon = getDeviceIcon(device.device_name)
                      return (
                        <div key={device.device_id} className="flex items-center gap-2 text-xs">
                          <DeviceIcon className="h-3 w-3" />
                          <span>{device.device_name || 'Unknown device'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Full mode
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Sync status indicator */}
      <div className="flex items-center gap-1.5">
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            config.color,
            status === 'syncing' && 'animate-pulse'
          )}
        />
        <span className="text-xs text-muted-foreground">{config.label}</span>
      </div>

      {/* Other devices badge */}
      {otherDevices.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="text-xs gap-1 cursor-default">
                {otherDevices.length === 1 ? (
                  <>
                    {(() => {
                      const DeviceIcon = getDeviceIcon(otherDevices[0].device_name)
                      return <DeviceIcon className="h-3 w-3" />
                    })()}
                    <span>{otherDevices[0].device_name || 'Other device'}</span>
                  </>
                ) : (
                  <>
                    <Monitor className="h-3 w-3" />
                    <span>{otherDevices.length} devices</span>
                  </>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="space-y-1">
                <p className="font-medium text-xs">Also viewing on:</p>
                {otherDevices.map((device) => {
                  const DeviceIcon = getDeviceIcon(device.device_name)
                  return (
                    <div key={device.device_id} className="flex items-center gap-2 text-xs">
                      <DeviceIcon className="h-3 w-3" />
                      <span>{device.device_name || 'Unknown device'}</span>
                      <span className="text-muted-foreground">
                        ({formatRelativeTime(device.last_seen_at)})
                      </span>
                    </div>
                  )
                })}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}
