import { useState, type FormEvent } from 'react'
import { ArrowRight, KeyRound, ShieldCheck, UsersRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

type AuthPageProps = {
  mode: 'login' | 'register'
}

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === 'register'
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (isRegister) await register(email, password, fullName)
      else await login(email, password)
      navigate('/', { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to continue. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-story" aria-label="User management">
        <div className="brand-lockup brand-lockup-light">
          <span className="brand-symbol"><UsersRound size={19} strokeWidth={2.2} /></span>
          <span>fieldwork<span className="brand-period">.</span></span>
        </div>
        <div className="story-copy">
          <p className="eyebrow eyebrow-lime">PEOPLE, IN GOOD ORDER</p>
          <h1>Make room<br />for the work.</h1>
          <p className="story-description">A clear view of your team, their access, and the details that keep things moving.</p>
        </div>
        <div className="story-board" aria-hidden="true">
          <div className="board-topline"><span>TEAM DIRECTORY</span><span className="board-live"><i /> LIVE</span></div>
          <div className="board-person"><span className="avatar avatar-lime">AM</span><span><b>Alex Morgan</b><small>Operations</small></span><span className="board-role">ADMIN</span></div>
          <div className="board-person"><span className="avatar avatar-coral">JR</span><span><b>Jamie Rivera</b><small>People &amp; culture</small></span><span className="board-role">MEMBER</span></div>
          <div className="board-person"><span className="avatar avatar-sky">SK</span><span><b>Sam Kim</b><small>Product</small></span><span className="board-role">MEMBER</span></div>
          <div className="board-foot"><span>03 ACTIVE PEOPLE</span><span className="board-bars"><i /><i /><i /><i /><i /><i /><i /></span></div>
        </div>
        <p className="story-footnote"><ShieldCheck size={14} /> Thoughtful access. Clear ownership.</p>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-inner">
          <div className="mobile-brand brand-lockup">
            <span className="brand-symbol"><UsersRound size={19} strokeWidth={2.2} /></span>
            <span>fieldwork<span className="brand-period">.</span></span>
          </div>
          <div className="auth-heading">
            <p className="eyebrow">{isRegister ? 'GET STARTED' : 'WELCOME BACK'}</p>
            <h2>{isRegister ? 'Create your account' : 'Sign in to your workspace'}</h2>
            <p>{isRegister ? 'Set up your profile to get started.' : 'Your people and permissions, right where you left them.'}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <label className="field-label">
                Full name
                <input autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="e.g. Morgan Lee" required maxLength={200} />
              </label>
            )}
            <label className="field-label">
              Work email
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
            </label>
            <label className="field-label">
              Password
              <span className="password-input-wrap">
                <input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isRegister ? 'At least 12 characters' : 'Enter your password'} required minLength={isRegister ? 12 : 1} maxLength={128} />
                <KeyRound size={16} aria-hidden="true" />
              </span>
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary auth-submit" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="auth-switch">
            {isRegister ? 'Already have an account?' : 'New to Fieldwork?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link>
          </p>
          <p className="auth-security"><ShieldCheck size={15} /> Your account details are protected.</p>
        </div>
      </section>
    </main>
  )
}