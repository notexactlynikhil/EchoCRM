import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../supabase/client'
import { getNotificationsEnabled, setNotificationsEnabled } from '../hooks/useTaskNotifications'
import { UserCircle, Mail, Lock, Bell, CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [notificationsOn, setNotificationsOn] = useState(getNotificationsEnabled())

  useEffect(() => {
    if (!user) return
    setEmail(user.email || '')
    setName((user.user_metadata?.name as string) || '')
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setProfileSaving(true)
    setProfileMessage(null)
    try {
      const trimmedName = name.trim()
      const trimmedEmail = email.trim()

      const { error: authError } = await supabase.auth.updateUser({
        data: { name: trimmedName },
        ...(trimmedEmail !== user.email ? { email: trimmedEmail } : {})
      })
      if (authError) throw authError

      const { error: dbError } = await supabase
        .from('users')
        .update({ name: trimmedName, email: trimmedEmail })
        .eq('id', user.id)
      if (dbError) throw dbError

      const emailChanged = trimmedEmail !== user.email
      setProfileMessage({
        type: 'success',
        text: emailChanged
          ? 'Profile saved. Check your inbox to confirm the new email address.'
          : 'Profile updated successfully.'
      })
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err?.message || 'Failed to update profile.' })
    } finally {
      setProfileSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    setPasswordSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage({ type: 'success', text: 'Password changed successfully.' })
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err?.message || 'Failed to change password.' })
    } finally {
      setPasswordSaving(false)
    }
  }

  const toggleNotifications = () => {
    const next = !notificationsOn
    setNotificationsOn(next)
    setNotificationsEnabled(next)
  }

  const alertBox = (message: { type: 'success' | 'error'; text: string } | null) => {
    if (!message) return null
    const isSuccess = message.type === 'success'
    return (
      <div className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs ${isSuccess
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
        : 'bg-rose-500/10 border-rose-500/20 text-rose-300'}`}>
        {isSuccess ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
        <span>{message.text}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="select-none">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your account and application preferences</p>
      </div>

      {/* Profile */}
      <section className="glass-panel rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <UserCircle className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Profile</h2>
        </div>
        {alertBox(profileMessage)}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full pl-10 pr-4 py-2.5 glass-input"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 glass-input"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={profileSaving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition shadow-md"
          >
            {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Profile</span>
          </button>
        </form>
      </section>

      {/* Password */}
      <section className="glass-panel rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Change Password</h2>
        </div>
        {alertBox(passwordMessage)}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-2.5 glass-input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              className="w-full px-4 py-2.5 glass-input"
            />
          </div>
          <button
            type="submit"
            disabled={passwordSaving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition shadow-md"
          >
            {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>Update Password</span>
          </button>
        </form>
      </section>

      {/* Preferences */}
      <section className="glass-panel rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Preferences</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-200">Desktop task notifications</p>
            <p className="text-xs text-slate-500 mt-0.5">Alert me about due and overdue tasks while the app is running.</p>
          </div>
          <button
            onClick={toggleNotifications}
            role="switch"
            aria-checked={notificationsOn}
            className={`relative w-11 h-6 rounded-full transition-colors ${notificationsOn ? 'bg-brand-600' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notificationsOn ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        {!window.electronAPI?.notify && (
          <p className="text-[11px] text-amber-400/80">Native notifications require the Electron desktop app.</p>
        )}
      </section>
    </div>
  )
}
