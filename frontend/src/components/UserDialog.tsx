import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { User, UserRole } from '../lib/api'

type UserDialogProps = {
  user: User | null
  onClose: () => void
  onSave: (values: { email: string; full_name: string; role: UserRole; password?: string }) => Promise<void>
}

export function UserDialog({ user, onClose, onSave }: UserDialogProps) {
  const [email, setEmail] = useState(user?.email ?? '')
  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [role, setRole] = useState<UserRole>(user?.role ?? 'user')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSave({ email, full_name: fullName, role, ...(user ? {} : { password }) })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to save this user.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="user-dialog" role="dialog" aria-modal="true" aria-labelledby="user-dialog-title">
        <header className="dialog-header">
          <div><p className="eyebrow">{user ? 'ACCOUNT DETAILS' : 'NEW ACCOUNT'}</p><h2 id="user-dialog-title">{user ? 'Edit person' : 'Add a person'}</h2></div>
          <button className="icon-button" type="button" title="Close dialog" aria-label="Close dialog" onClick={onClose}><X size={18} /></button>
        </header>
        <form className="dialog-form" onSubmit={handleSubmit}>
          <label className="field-label">Full name<input autoFocus value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Name" maxLength={200} /></label>
          <label className="field-label">Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required /></label>
          {!user && <label className="field-label">Temporary password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} maxLength={128} placeholder="At least 12 characters" required /></label>}
          <label className="field-label">Role<select value={role} onChange={(event) => setRole(event.target.value as UserRole)}><option value="user">User</option><option value="admin">Administrator</option></select></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="dialog-actions">
            <button className="button button-quiet" type="button" onClick={onClose}>Cancel</button>
            <button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : user ? 'Save changes' : 'Create account'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}