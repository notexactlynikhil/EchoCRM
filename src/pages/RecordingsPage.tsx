import React, { useEffect, useState } from 'react'
import { supabase } from '../supabase/client'
import { MeetingRecording, Customer } from '../types'
import { fetchMeetingRecordings, assignRecordingToCustomer } from '../services/db'
import { useRealtimeSync } from '../contexts/RealtimeSyncContext'
import { Mic, Link as LinkIcon, Calendar, Clock, RefreshCw } from 'lucide-react'

export const RecordingsPage: React.FC = () => {
  const [recordings, setRecordings] = useState<MeetingRecording[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const recs = await fetchMeetingRecordings()
      setRecordings(recs || [])
      
      const { data: custs } = await supabase.from('customers').select('*').order('name')
      setCustomers(custs || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const { subscribe } = useRealtimeSync()

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (event.table === 'meeting_recordings') {
        if (event.eventType === 'INSERT') {
          setRecordings(prev => [event.newRecord, ...prev].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()))
        } else if (event.eventType === 'UPDATE') {
          setRecordings(prev => prev.map(r => r.id === event.newRecord.id ? { ...r, ...event.newRecord } : r).sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()))
        } else if (event.eventType === 'DELETE') {
          setRecordings(prev => prev.filter(r => r.id !== event.oldRecord.id))
        }
      }
    })
    return () => unsubscribe()
  }, [subscribe])

  const handleAssign = async (recordingId: string, customerId: string) => {
    setAssigningId(recordingId)
    try {
      const updated = await assignRecordingToCustomer(recordingId, customerId || null)
      setRecordings(prev => prev.map(r => r.id === recordingId ? { ...r, ...updated } : r))
    } catch (e) {
      console.error('Failed to assign:', e)
    } finally {
      setAssigningId(null)
    }
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  if (loading) {
    return <div className="text-slate-400 p-8">Loading recordings...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Recordings</h1>
          <p className="text-sm text-slate-400 mt-1">Manage and assign synced meeting recordings</p>
        </div>
        <button onClick={loadData} className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {recordings.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500">
            No recordings found.
          </div>
        ) : (
          recordings.map(rec => (
            <div key={rec.id} className="glass-card p-5 rounded-xl border border-slate-800/60 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center hover:border-slate-700/60 transition">
              
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200">
                      {rec.platform === 'google_meet' ? 'Google Meet' : rec.platform === 'ms_teams' ? 'Microsoft Teams' : rec.platform === 'zoom' ? 'Zoom' : 'Meeting'}
                    </h3>
                    <p className="text-xs text-slate-400 truncate max-w-sm">{rec.meeting_url || 'No URL'}</p>
                  </div>
                </div>
                
                <div className="flex gap-4 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(rec.started_at).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDuration(rec.duration_seconds)}</span>
                  </div>
                </div>

                <div className="w-full max-w-md pt-2">
                  <audio controls className="w-full h-8" src={`https://qrstkwlakctszamkvsgh.supabase.co/storage/v1/object/public/meeting-recordings/${rec.storage_path}`} />
                </div>
              </div>

              <div className="w-full sm:w-64 shrink-0 flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" /> Assign to Customer
                </label>
                <select
                  value={rec.customer_id || ''}
                  onChange={(e) => handleAssign(rec.id, e.target.value)}
                  disabled={assigningId === rec.id}
                  className="w-full bg-slate-900 border border-slate-800 text-sm text-slate-200 rounded-lg p-2.5 focus:border-brand-500 outline-none transition"
                >
                  <option value="">-- Unassigned --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {assigningId === rec.id && <span className="text-[10px] text-brand-400 animate-pulse">Assigning...</span>}
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  )
}
