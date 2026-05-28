import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-10 flex items-center justify-center">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel relative overflow-hidden rounded-[2rem] p-8 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.2),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.14),_transparent_28%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              <ShieldCheck className="h-4 w-4" />
              Admin portal
            </div>
            <h1 className="mt-8 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Review listings, resolve reports, and keep the platform trusted.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
              This subdomain is isolated from the public site. Only administrator accounts can sign in and access the approval workflow.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ['Protected origin', 'Dedicated token storage per admin app'],
                ['Fast review', 'Approve or reject pending boarding listings'],
                ['Audit-ready', 'Admin-only access enforced by the API'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] p-8 sm:p-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">Sign in</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Administrator login</h2>
            <p className="mt-2 text-sm text-slate-400">Use your admin credentials to access the moderation dashboard.</p>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Email address</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/25"
                placeholder="admin@uniboard.local"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/25"
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Open dashboard'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}