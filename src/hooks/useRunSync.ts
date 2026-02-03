import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getDeviceId, getDeviceName } from '@/services/run'
import type { Run, RunProgress } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface ActiveDevice {
  device_id: string
  device_name: string | null
  user_id: string
  last_seen_at: string
  isCurrentDevice: boolean
}

interface UseRunSyncOptions {
  runId: string
  userId: string
  onProgressUpdate?: (progress: RunProgress) => void
  onStatusChange?: (status: Run['status']) => void
  onOtherDeviceActive?: (devices: ActiveDevice[]) => void
  enabled?: boolean
}

interface UseRunSyncReturn {
  isConnected: boolean
  isSyncing: boolean
  otherDevices: ActiveDevice[]
  syncError: string | null
  lastSyncedAt: Date | null
}

const PRESENCE_HEARTBEAT_MS = 30000 // 30 seconds

export function useRunSync({
  runId,
  userId,
  onProgressUpdate,
  onStatusChange,
  onOtherDeviceActive,
  enabled = true,
}: UseRunSyncOptions): UseRunSyncReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [isSyncing, _setIsSyncing] = useState(false)
  const [otherDevices, setOtherDevices] = useState<ActiveDevice[]>([])
  const [syncError, setSyncError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const deviceId = getDeviceId()
  const deviceName = getDeviceName()

  // Update presence (heartbeat)
  const updatePresence = useCallback(async () => {
    if (!enabled) return

    try {
      await supabase.rpc('upsert_run_presence', {
        p_run_id: runId,
        p_device_id: deviceId,
        p_device_name: deviceName,
      })
    } catch (err) {
      console.error('Error updating presence:', err)
    }
  }, [runId, deviceId, deviceName, enabled])

  // Fetch active devices
  const fetchActiveDevices = useCallback(async () => {
    if (!enabled) return

    try {
      const { data, error } = await supabase.rpc('get_run_active_devices', {
        p_run_id: runId,
      })

      if (error) throw error

      const devices: ActiveDevice[] = (data || []).map((d: {
        device_id: string
        device_name: string | null
        user_id: string
        last_seen_at: string
      }) => ({
        ...d,
        isCurrentDevice: d.device_id === deviceId,
      }))

      // Filter out current device for "other devices"
      const others = devices.filter((d) => !d.isCurrentDevice)
      setOtherDevices(others)
      onOtherDeviceActive?.(others)
    } catch (err) {
      console.error('Error fetching active devices:', err)
    }
  }, [runId, deviceId, enabled, onOtherDeviceActive])

  // Deactivate presence when leaving
  const deactivatePresence = useCallback(async () => {
    try {
      await supabase.rpc('deactivate_run_presence', {
        p_run_id: runId,
        p_device_id: deviceId,
      })
    } catch (err) {
      console.error('Error deactivating presence:', err)
    }
  }, [runId, deviceId])

  // Set up real-time subscription
  useEffect(() => {
    if (!enabled || !runId || !userId) return

    // Create channel for this run
    const channel = supabase
      .channel(`run:${runId}`)
      // Listen for run updates (progress, status changes)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'runs',
          filter: `id=eq.${runId}`,
        },
        (payload) => {
          const newRun = payload.new as Run
          const oldRun = payload.old as Run

          setLastSyncedAt(new Date())

          // Only trigger callbacks if we didn't make this change
          // (check by comparing device_id or use sync_version)
          if (newRun.device_id !== deviceId) {
            if (newRun.progress !== oldRun.progress) {
              onProgressUpdate?.(newRun.progress)
            }
            if (newRun.status !== oldRun.status) {
              onStatusChange?.(newRun.status)
            }
          }
        }
      )
      // Listen for presence changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'run_presence',
          filter: `run_id=eq.${runId}`,
        },
        () => {
          // Refresh active devices when presence changes
          fetchActiveDevices()
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setSyncError(null)

          // Initial presence update
          await updatePresence()
          await fetchActiveDevices()

          // Start heartbeat
          heartbeatRef.current = setInterval(() => {
            updatePresence()
            fetchActiveDevices()
          }, PRESENCE_HEARTBEAT_MS)
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setSyncError('Failed to connect to sync channel')
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false)
          setSyncError('Connection timed out')
        }
      })

    channelRef.current = channel

    // Cleanup
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }

      deactivatePresence()

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      setIsConnected(false)
    }
  }, [
    runId,
    userId,
    enabled,
    deviceId,
    updatePresence,
    fetchActiveDevices,
    deactivatePresence,
    onProgressUpdate,
    onStatusChange,
  ])

  // Handle page visibility changes
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, could pause heartbeat
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current)
          heartbeatRef.current = null
        }
      } else {
        // Page is visible again, resume heartbeat and sync
        updatePresence()
        fetchActiveDevices()
        heartbeatRef.current = setInterval(() => {
          updatePresence()
          fetchActiveDevices()
        }, PRESENCE_HEARTBEAT_MS)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, updatePresence, fetchActiveDevices])

  // Handle beforeunload to deactivate presence
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = () => {
      // Note: This is a best-effort attempt, may not always complete
      deactivatePresence()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled, deactivatePresence])

  return {
    isConnected,
    isSyncing,
    otherDevices,
    syncError,
    lastSyncedAt,
  }
}
