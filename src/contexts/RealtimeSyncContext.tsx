import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase/client'

export type SyncStatus = 'connected' | 'connecting' | 'disconnected';

export interface RealtimeEvent {
  table: 'customers' | 'tasks' | 'deals' | 'calls';
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  newRecord: any;
  oldRecord: any;
}

export type RealtimeListener = (event: RealtimeEvent) => void;

interface RealtimeSyncContextType {
  status: SyncStatus;
  subscribe: (listener: RealtimeListener) => () => void;
}

const RealtimeSyncContext = createContext<RealtimeSyncContextType | undefined>(undefined);

export const RealtimeSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<SyncStatus>('connecting')
  const listenersRef = useRef<Set<RealtimeListener>>(new Set())

  // Register listener callbacks
  const subscribe = React.useCallback((listener: RealtimeListener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  // Broadcast event to all active hook listeners
  const broadcastEvent = (payload: any) => {
    const event: RealtimeEvent = {
      table: payload.table as any,
      eventType: payload.eventType,
      newRecord: payload.new,
      oldRecord: payload.old
    };
    listenersRef.current.forEach((listener) => {
      try {
        listener(event)
      } catch (err) {
        console.error('Error in realtime listener callback:', err)
      }
    })
  }

  useEffect(() => {
    console.log('Establishing Realtime Sync channel...');
    setStatus('connecting')

    const channel = supabase.channel('public-db-sync')

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          broadcastEvent(payload)
        }
      )
      .subscribe((subscribeStatus) => {
        console.log(`Realtime channel status update: ${subscribeStatus}`)
        if (subscribeStatus === 'SUBSCRIBED') {
          setStatus('connected')
        } else if (subscribeStatus === 'CLOSED') {
          setStatus('disconnected')
        } else if (subscribeStatus === 'CHANNEL_ERROR' || subscribeStatus === 'TIMED_OUT') {
          setStatus('disconnected')
        } else {
          setStatus('connecting')
        }
      })

    return () => {
      console.log('Cleaning up Realtime Sync channel...');
      // Remove channel from client
      supabase.removeChannel(channel)
    };
  }, [])

  return (
    <RealtimeSyncContext.Provider value={{ status, subscribe }}>
      {children}
    </RealtimeSyncContext.Provider>
  )
}

export const useRealtimeSync = () => {
  const context = useContext(RealtimeSyncContext)
  if (!context) {
    throw new Error('useRealtimeSync must be used within a RealtimeSyncProvider')
  }
  return context
}
