import { useEffect, useState, type FormEvent } from 'react'
import { Activity, ArrowLeft, ArrowRight, BadgeCheck, Ban, Check, ChevronDown, CircleUserRound, KeyRound, LogOut, Pencil, Plus, Search, Shield, SlidersHorizontal, UserRound, UsersRound, X } from 'lucide-react'
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { UserDialog } from '../components/UserDialog'
import { api, type User, type UserRole } from '../lib/api'

const PAGE_SIZE = 10

function initials(user: User) {
  return (user.full_name || user.email).split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export function Workspace() {
  const { session, logout } = useAuth()
  const navigate = useNavigate()
  if (!session) return null
  const isAdmin = session.user.role === 'admin'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <Link className="brand-lockup sidebar-brand" to="/">
          <span className="brand-symbol"><UsersRound size={18} strokeWidth={2.2} /></span>
          <span>fieldwork<span className="brand-period">.</span></span>
        </Link>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {isAdmin && <NavLink to="/users" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><UsersRound size={17} />People<span className="nav-count">Directory</span></NavLink>}
          <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><CircleUserRound size={17} />My profile</NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <span className="avatar avatar-sidebar">{initials(session.user)}</span>
            <span className="sidebar-user-copy"><b>{session.user.full_name || session.user.email.split('@')[0]}</b><small>{isAdmin ? 'Administrator' : 'Member'}</small></span>
          </div>
          <button className="sidebar-logout" type="button" onClick={handleLogout}><LogOut size={16} />Sign out</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="crumb"><span>Workspace</span><span className="crumb-slash">/</span><b>{isAdmin ? 'People' : 'My profile'}</b></div>
          <div className="topbar-right"><span className="secure-label"><i /> Secure session</span><span className="avatar avatar-top">{initials(session.user)}</span></div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  )
}

export function DirectoryPage() {
  const { session } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const [loadedKey, setLoadedKey] = useState('')
  const [dialogUser, setDialogUser] = useState<User | null | undefined>(undefined)
  const [error, setError] = useState('')
  const requestKey = `${session?.token ?? ''}:${page}:${query}:${roleFilter}:${statusFilter}:${refreshKey}`

  useEffect(() => {
    if (!session || session.user.role !== 'admin') return
    let active = true
    api.users(session.token, {
      skip: page * PAGE_SIZE,
      limit: PAGE_SIZE,
      q: query || undefined,
      role: roleFilter === 'all' ? undefined : roleFilter as UserRole,
      is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    }).then((result) => {
      if (active) {
        setUsers(result.items)
        setTotal(result.total)
        setError('')
        setLoadedKey(requestKey)
      }
    }).catch((reason: unknown) => {
      if (active) {
        setError(reason instanceof Error ? reason.message : 'Could not load the directory.')
        setLoadedKey(requestKey)
      }
    })
    return () => { active = false }
  }, [session, page, query, roleFilter, statusFilter, refreshKey, requestKey])

  if (session?.user.role !== 'admin') return <Navigate to="/profile" replace />

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(0)
    setQuery(searchText.trim())
  }

  async function saveUser(values: { email: string; full_name: string; role: UserRole; password?: string }) {
    if (!session) return
    if (dialogUser) await api.updateUser(session.token, dialogUser.id, values)
    else await api.createUser(session.token, { ...values, password: values.password || '' })
    setDialogUser(undefined)
    setRefreshKey((key) => key + 1)
  }

  async function setActive(user: User) {
    if (!session) return
    if (user.is_active && !window.confirm(`Deactivate ${user.full_name || user.email}? They will no longer be able to sign in.`)) return
    setError('')
    try {
      if (user.is_active) await api.deactivateUser(session.token, user.id)
      else await api.updateUser(session.token, user.id, { is_active: true })
      setRefreshKey((key) => key + 1)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update this account.')
    }
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const activeCount = users.filter((user) => user.is_active).length
  const loading = loadedKey !== requestKey

  return (
    <section className="directory-page page-enter">
      <div className="page-heading-row">
        <div><p className="eyebrow">WORKSPACE DIRECTORY</p><h1>People</h1><p className="page-subtitle">Manage your team and their workspace access.</p></div>
        <button className="button button-primary add-person" onClick={() => setDialogUser(null)}><Plus size={17} />Add person</button>
      </div>

      <div className="metric-strip">
        <div className="metric"><span className="metric-icon metric-icon-green"><UsersRound size={17} /></span><span><b>{total}</b><small>People in directory</small></span></div>
        <div className="metric"><span className="metric-icon metric-icon-lime"><Activity size={17} /></span><span><b>{activeCount}<em> on this page</em></b><small>Active accounts</small></span></div>
        <div className="metric-note"><span className="metric-note-dot" />Directory synced <b>just now</b></div>
      </div>

      <section className="directory-panel" aria-labelledby="directory-title">
        <div className="panel-heading"><div><h2 id="directory-title">Team directory</h2><p>{total} {total === 1 ? 'person' : 'people'} total</p></div><span className="panel-stamp"><Shield size={14} /> Admin view</span></div>
        <form className="filter-bar" onSubmit={search}>
          <label className="search-box"><Search size={16} /><span className="visually-hidden">Search by email</span><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search by email" /></label>
          <label className="select-wrap"><SlidersHorizontal size={15} /><span className="visually-hidden">Filter by role</span><select value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(0) }}><option value="all">All roles</option><option value="admin">Administrator</option><option value="user">User</option></select><ChevronDown size={14} /></label>
          <label className="select-wrap"><span className="visually-hidden">Filter by status</span><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(0) }}><option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option></select><ChevronDown size={14} /></label>
          <button className="button button-filter" type="submit">Search</button>
        </form>

        {error && <div className="notice notice-error" role="alert"><span>{error}</span><button className="icon-button" aria-label="Dismiss message" onClick={() => setError('')}><X size={16} /></button></div>}

        <div className="table-scroll">
          <table className="people-table">
            <thead><tr><th scope="col">Person</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Added</th><th scope="col"><span className="visually-hidden">Actions</span></th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="table-message"><span className="spinner" />Loading directory…</td></tr> : error && users.length === 0 ? <tr><td colSpan={5} className="table-message">The directory could not be loaded.</td></tr> : users.length === 0 ? <tr><td colSpan={5} className="table-message"><span className="empty-mark"><UsersRound size={18} /></span><b>No people found</b><span>Try adjusting your filters or add someone new.</span></td></tr> : users.map((user, index) => (
                <tr key={user.id} className="person-row" style={{ animationDelay: `${index * 35}ms` }}>
                  <td><div className="person-cell"><span className={`avatar avatar-${index % 4}`}>{initials(user)}</span><span className="person-copy"><b>{user.full_name || 'Name not provided'}</b><small>{user.email}</small></span></div></td>
                  <td><span className={`role-label ${user.role === 'admin' ? 'role-admin' : ''}`}>{user.role === 'admin' ? <><BadgeCheck size={14} />Administrator</> : <><UserRound size={14} />User</>}</span></td>
                  <td><span className={`status-label ${user.is_active ? 'status-active' : 'status-inactive'}`}><i />{user.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td className="date-cell">{formatDate(user.created_at)}</td>
                  <td><div className="row-actions"><button className="icon-button" title="Edit person" aria-label={`Edit ${user.full_name || user.email}`} onClick={() => setDialogUser(user)}><Pencil size={15} /></button><button className={`icon-button ${user.is_active ? 'danger-action' : 'restore-action'}`} title={user.is_active ? 'Deactivate account' : 'Reactivate account'} aria-label={`${user.is_active ? 'Deactivate' : 'Reactivate'} ${user.full_name || user.email}`} onClick={() => void setActive(user)}>{user.is_active ? <Ban size={15} /> : <Check size={15} />}</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="table-footer"><span>Showing <b>{total === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)}</b> of <b>{total}</b></span><div className="pagination"><button className="icon-button" title="Previous page" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}><ArrowLeft size={16} /></button><span>Page <b>{page + 1}</b> of <b>{pages}</b></span><button className="icon-button" title="Next page" aria-label="Next page" disabled={page + 1 >= pages} onClick={() => setPage((value) => value + 1)}><ArrowRight size={16} /></button></div></footer>
      </section>
      {dialogUser !== undefined && <UserDialog user={dialogUser} onClose={() => setDialogUser(undefined)} onSave={saveUser} />}
    </section>
  )
}

export function ProfilePage() {
  const { session, changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  if (!session) return null
  const user = session.user

  async function submitPasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.')
      return
    }
    setPasswordBusy(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage('Password updated. Other active sessions have been signed out.')
    } catch (reason) {
      setPasswordError(reason instanceof Error ? reason.message : 'Could not change your password.')
    } finally {
      setPasswordBusy(false)
    }
  }

  return (
    <section className="profile-page page-enter">
      <div className="page-heading-row"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>My profile</h1><p className="page-subtitle">Your account details and access level.</p></div></div>
      <div className="profile-layout">
        <section className="profile-card">
          <div className="profile-banner"><span className="profile-banner-grid" /><span className="profile-avatar">{initials(user)}</span></div>
          <div className="profile-body"><p className="eyebrow">ACCOUNT HOLDER</p><h2>{user.full_name || 'Name not provided'}</h2><p className="profile-email">{user.email}</p><span className={`status-label ${user.is_active ? 'status-active' : 'status-inactive'}`}><i />{user.is_active ? 'Active account' : 'Inactive account'}</span></div>
          <div className="profile-foot"><span>Member since</span><b>{formatDate(user.created_at)}</b></div>
        </section>
        <section className="access-panel"><div className="panel-heading"><div><p className="eyebrow">ACCESS</p><h2>Your permissions</h2></div><span className="access-icon"><Shield size={18} /></span></div><div className="access-role"><span className="access-role-mark">{user.role === 'admin' ? <BadgeCheck size={20} /> : <UserRound size={20} />}</span><span><b>{user.role === 'admin' ? 'Administrator' : 'User'}</b><small>{user.role === 'admin' ? 'Can manage accounts and workspace access.' : 'Standard workspace account.'}</small></span></div><div className="access-detail"><span>Account ID</span><b>FW-{String(user.id).padStart(4, '0')}</b></div><div className="access-detail"><span>Sign-in method</span><b>Work email</b></div><div className="access-note"><Shield size={15} /><span>Need an account change? Contact your workspace administrator.</span></div>
          <div className="password-section"><div className="password-section-heading"><span className="access-role-mark"><KeyRound size={17} /></span><span><b>Change password</b><small>Use at least 12 characters. Other sessions will be revoked.</small></span></div>
            <form className="password-form" onSubmit={submitPasswordChange}>
              <label className="field-label">Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required maxLength={128} /></label>
              <label className="field-label">New password<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={12} maxLength={128} /></label>
              <label className="field-label">Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={12} maxLength={128} /></label>
              {passwordError && <p className="form-error" role="alert">{passwordError}</p>}
              {passwordMessage && <p className="form-success" role="status">{passwordMessage}</p>}
              <button className="button button-primary" type="submit" disabled={passwordBusy}>{passwordBusy ? 'Updating…' : 'Update password'}</button>
            </form>
          </div>
        </section>
      </div>
    </section>
  )
}