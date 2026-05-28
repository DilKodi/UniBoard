import { useEffect, useMemo, useState } from 'react'
import { LogOut, ShieldCheck, CheckCircle2, XCircle, Clock3, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { approveListing, fetchPendingListings, rejectListing, type BoardingPlaceResponse } from '../services/api'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [listings, setListings] = useState<BoardingPlaceResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({})

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true)
        const data = await fetchPendingListings()
        setListings(data)
      } finally {
        setLoading(false)
      }
    }

    loadListings()
  }, [])

  const metrics = useMemo(() => {
    return [
      { label: 'Pending review', value: listings.length, icon: Clock3 },
      { label: 'Ready to approve', value: listings.filter((listing) => listing.status === 'pending').length, icon: CheckCircle2 },
      { label: 'Manual notes', value: listings.filter((listing) => !!listing.rejection_reason).length, icon: XCircle },
    ]
  }, [listings])

  const handleApprove = async (id: number) => {
    try {
      setBusyId(id)
      const updated = await approveListing(id)
      setListings((current) => current.filter((listing) => listing.id !== id))
      setRejectionReasons((current) => {
        const next = { ...current }
        delete next[id]
        return next
      })
      return updated
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (id: number) => {
    try {
      setBusyId(id)
      const updated = await rejectListing(id, rejectionReasons[id])
      setListings((current) => current.filter((listing) => listing.id !== id))
      setRejectionReasons((current) => {
        const next = { ...current }
        delete next[id]
        return next
      })
      return updated
    } finally {
      setBusyId(null)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="glass-panel flex flex-col gap-6 rounded-[2rem] p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
              <ShieldCheck className="h-4 w-4" />
              Moderation console
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-white">Listing review queue</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Approve or reject newly submitted boarding listings from owners. The admin token is scoped to this subdomain and never shares storage with the public app.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">{user?.email}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-100"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="glass-panel rounded-3xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">{metric.label}</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{metric.value}</p>
                  </div>
                  <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            )
          })}
        </section>

        {loading ? (
          <div className="glass-panel flex items-center justify-center rounded-[2rem] p-14 text-slate-300">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-cyan-300" />
            Loading pending listings...
          </div>
        ) : listings.length === 0 ? (
          <div className="glass-panel rounded-[2rem] p-14 text-center text-slate-300">
            No listings are waiting for review right now.
          </div>
        ) : (
          <div className="grid gap-4">
            {listings.map((listing) => (
              <article key={listing.id} className="glass-panel rounded-[2rem] p-6">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-3xl space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold text-white">{listing.property_name}</h2>
                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                        {listing.status}
                      </span>
                    </div>

                    <p className="text-slate-300">{listing.location}</p>
                    <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                      <p>Owner: {listing.owner_full_name || 'Unknown'}</p>
                      <p>University: {listing.nearest_university}</p>
                      <p>Rooms: {listing.number_of_rooms}</p>
                      <p>Floors: {listing.number_of_floors}</p>
                      <p className="sm:col-span-2">Verification document: {listing.verification_document_name || 'Not uploaded'}</p>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-200">Rejection reason</span>
                      <textarea
                        value={rejectionReasons[listing.id] || ''}
                        onChange={(event) =>
                          setRejectionReasons((current) => ({
                            ...current,
                            [listing.id]: event.target.value,
                          }))
                        }
                        rows={3}
                        placeholder="Leave a short note for the owner if the submission needs changes"
                        className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/25"
                      />
                    </label>
                  </div>

                  <div className="flex shrink-0 gap-3 xl:flex-col">
                    <button
                      onClick={() => handleReject(listing.id)}
                      disabled={busyId === listing.id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 font-medium text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprove(listing.id)}
                      disabled={busyId === listing.id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}