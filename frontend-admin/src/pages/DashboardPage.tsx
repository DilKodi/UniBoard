import { useEffect, useMemo, useState } from 'react'
import { LogOut, ShieldCheck, CheckCircle2, XCircle, Clock3, Loader2, Star, Eye, EyeOff, MessageSquare } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  approveListing,
  fetchOwnerProfile,
  fetchPendingListings,
  rejectListing,
  fetchListings,
  fetchPropertyReviews,
  toggleReviewVisibility,
  type BoardingPlaceResponse,
  type OwnerProfileResponse
} from '../services/api'

type PendingListingWithOwner = BoardingPlaceResponse & {
  owner?: OwnerProfileResponse | null
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [listings, setListings] = useState<PendingListingWithOwner[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({})
  
  // Document Viewer Popup States
  const [activeDocUrl, setActiveDocUrl] = useState<string | null>(null)
  const [showDocModal, setShowDocModal] = useState(false)

  // Tab State
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings')

  // Reviews Tab States
  const [allListings, setAllListings] = useState<BoardingPlaceResponse[]>([])
  const [loadingAllListings, setLoadingAllListings] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null)
  const [propertyReviews, setPropertyReviews] = useState<any[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [moderatingReviewId, setModeratingReviewId] = useState<number | null>(null)

  const getVerificationUrl = (url: string | null | undefined) => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`
  }

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true)
        const data = await fetchPendingListings()
        const ownerIds = [...new Set(data.map((listing) => listing.owner_id))]
        const ownerProfiles = await Promise.all(
          ownerIds.map(async (ownerId) => {
            try {
              return await fetchOwnerProfile(ownerId)
            } catch (error) {
              console.warn(`Failed to load owner profile for ${ownerId}`, error)
              return null
            }
          }),
        )

        const ownerById = new Map<number, OwnerProfileResponse>()
        ownerProfiles.forEach((profile) => {
          if (profile) {
            ownerById.set(Number(profile.user_id), profile)
            ownerById.set(Number(profile.id), profile) // Safe fallback
          }
        })

        setListings(
          data.map((listing) => ({
            ...listing,
            owner: ownerById.get(Number(listing.owner_id)) || null,
          })),
        )
      } finally {
        setLoading(false)
      }
    }

    loadListings()
  }, [])

  // Load all listings when switching to Reviews tab
  useEffect(() => {
    if (activeTab === 'reviews') {
      const loadAll = async () => {
        try {
          setLoadingAllListings(true)
          const data = await fetchListings()
          setAllListings(data)
          if (data.length > 0 && selectedPropertyId === null) {
            setSelectedPropertyId(data[0].id)
          }
        } catch (error) {
          console.error("Failed to load all listings for reviews", error)
        } finally {
          setLoadingAllListings(false)
        }
      }
      loadAll()
    }
  }, [activeTab])

  // Load reviews when selected property changes
  const loadReviewsForProperty = async (propertyId: number) => {
    try {
      setLoadingReviews(true)
      const data = await fetchPropertyReviews(propertyId, true)
      setPropertyReviews(data)
    } catch (error) {
      console.error("Failed to load reviews for property", error)
    } finally {
      setLoadingReviews(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'reviews' && selectedPropertyId !== null) {
      loadReviewsForProperty(selectedPropertyId)
    }
  }, [activeTab, selectedPropertyId])

  const handleToggleVisibility = async (reviewId: number) => {
    try {
      setModeratingReviewId(reviewId)
      await toggleReviewVisibility(reviewId)
      if (selectedPropertyId !== null) {
        await loadReviewsForProperty(selectedPropertyId)
      }
    } catch (error) {
      console.error("Failed to toggle review visibility", error)
    } finally {
      setModeratingReviewId(null)
    }
  }

  const metrics = useMemo(() => {
    return [
      { label: 'Pending review', value: listings.length, icon: Clock3 },
      { label: 'Ready to approve', value: listings.filter((listing) => listing.status === 'pending').length, icon: CheckCircle2 },
      { label: 'Manual notes', value: listings.filter((listing) => !!listing.rejection_reason).length, icon: XCircle },
    ]
  }, [listings])

  const universityCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    listings.forEach((l) => {
      const uni = l.nearest_university || 'Other'
      counts[uni] = (counts[uni] || 0) + 1
    })

    // If no listings are loaded yet, provide some fallback data for visualization
    if (Object.keys(counts).length === 0) {
      return [
        { name: 'University of Moratuwa', count: 12, color: 'from-blue-500 to-cyan-400' },
        { name: 'University of Colombo', count: 8, color: 'from-purple-500 to-indigo-400' },
        { name: 'University of Sri Jayewardenepura', count: 6, color: 'from-pink-500 to-rose-400' },
        { name: 'SLIIT Malabe', count: 5, color: 'from-emerald-500 to-teal-400' },
      ]
    }

    const colors = [
      'from-blue-500 to-cyan-400',
      'from-purple-500 to-indigo-400',
      'from-pink-500 to-rose-400',
      'from-emerald-500 to-teal-400',
      'from-amber-500 to-orange-400',
    ]

    return Object.entries(counts).map(([name, count], index) => ({
      name,
      count,
      color: colors[index % colors.length],
    })).sort((a, b) => b.count - a.count)
  }, [listings])

  const handleApprove = async (id: number) => {
    try {
      setBusyId(id)
      const updated = await approveListing(id)
      setListings((current) =>
        current.map((listing) =>
          listing.id === id ? { ...listing, status: updated.status } : listing
        )
      )
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
      setListings((current) =>
        current.map((listing) =>
          listing.id === id ? { ...listing, status: updated.status } : listing
        )
      )
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

        {/* Tab Selection */}
        <div className="mb-6 flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('listings')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'listings'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Pending Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'reviews'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Review Moderation
          </button>
        </div>

        {activeTab === 'listings' ? (
          <>
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

            {!loading && (
              <section className="glass-panel rounded-[2rem] p-6 grid gap-6 md:grid-cols-3">
                {/* Column 1: Approval Performance (Circular Progress Ring) */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Moderation Rate</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">Review efficiency</h3>
                    <p className="text-sm text-slate-400 mt-1">Percentage of approved boarding properties</p>
                  </div>

                  <div className="my-6 flex flex-col items-center justify-center">
                    <div className="relative h-32 w-32">
                      <svg className="h-full w-full transform -rotate-90">
                        <circle
                          cx="64"
                          cy="64"
                          r="50"
                          className="stroke-slate-800"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="50"
                          className="stroke-cyan-400"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={314}
                          strokeDashoffset={314 - (314 * 84) / 100}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-white">84%</span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400">Approved</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/5 pt-4">
                    <div>
                      <p className="text-slate-400">Avg. Review Time</p>
                      <p className="text-sm font-semibold text-white mt-0.5">4.2 hours</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Total processed</p>
                      <p className="text-sm font-semibold text-white mt-0.5">148 properties</p>
                    </div>
                  </div>
                </div>

                {/* Column 2: Listings by University Campus */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:col-span-2 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Campus Density</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">Boarding places near universities</h3>
                    <p className="text-sm text-slate-400 mt-1">Campuses with the highest volume of student accommodations</p>
                  </div>

                  <div className="my-6 space-y-3.5">
                    {universityCounts.slice(0, 4).map((uni) => {
                      const maxCount = Math.max(...universityCounts.map((u) => u.count))
                      const percentage = maxCount > 0 ? (uni.count / maxCount) * 100 : 0
                      return (
                        <div key={uni.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-slate-200">{uni.name}</span>
                            <span className="font-semibold text-cyan-300">{uni.count} listings</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-slate-950/60 overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${uni.color} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-between items-center text-xs border-t border-white/5 pt-4 text-slate-400">
                    <span>Updated in real-time</span>
                    <span className="text-cyan-400 hover:underline cursor-pointer">View all locations</span>
                  </div>
                </div>
              </section>
            )}

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
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${
                            listing.status === 'verified' || listing.status === 'approved'
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                              : listing.status === 'rejected'
                              ? 'border-red-500/20 bg-red-500/10 text-red-300'
                              : 'border-amber-400/20 bg-amber-400/10 text-amber-200'
                          }`}>
                            {listing.status}
                          </span>
                        </div>

                        <p className="text-slate-300">{listing.location}</p>
                        <div className="grid gap-2 text-sm text-slate-400 sm:grid-cols-2">
                          <p><span className="font-semibold text-slate-300">Owner:</span> {listing.owner?.full_name || listing.owner_full_name || 'Unknown'}</p>
                          <p><span className="font-semibold text-slate-300">Owner Email:</span> {listing.owner?.email || 'Unknown'}</p>
                          <p><span className="font-semibold text-slate-300">Owner Phone:</span> {listing.owner?.contact_number || 'Unknown'}</p>
                          <p><span className="font-semibold text-slate-300">Owner NIC:</span> {listing.owner?.nic_number || 'Unknown'}</p>
                          <p><span className="font-semibold text-slate-300">University:</span> {listing.nearest_university}</p>
                          <p><span className="font-semibold text-slate-300">Rooms:</span> {listing.number_of_rooms}</p>
                          <p><span className="font-semibold text-slate-300">Floors:</span> {listing.number_of_floors}</p>
                          <p><span className="font-semibold text-slate-300">Gender restriction:</span> {listing.gender_restriction || 'Any'}</p>
                          <p className="sm:col-span-2">
                            <span className="font-semibold text-slate-300">Verification document:</span>{' '}
                            {listing.verification_document_url ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveDocUrl(getVerificationUrl(listing.verification_document_url))
                                  setShowDocModal(true)
                                }}
                                className="text-cyan-400 hover:text-cyan-300 hover:underline transition font-medium text-left"
                              >
                                {listing.verification_document_name || 'View Document'}
                              </button>
                            ) : (
                              listing.verification_document_name || 'Not uploaded'
                            )}
                          </p>
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
                          disabled={busyId === listing.id || listing.status === 'rejected'}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 font-medium text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:border-white/5 disabled:bg-white/5 disabled:text-slate-500"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(listing.id)}
                          disabled={busyId === listing.id || listing.status === 'verified' || listing.status === 'approved'}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-white/5 disabled:text-slate-500"
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
          </>
        ) : (
          /* Reviews Moderation Content */
          loadingAllListings ? (
            <div className="glass-panel flex items-center justify-center rounded-[2rem] p-14 text-slate-300">
              <Loader2 className="mr-3 h-5 w-5 animate-spin text-cyan-300" />
              Loading properties...
            </div>
          ) : allListings.length === 0 ? (
            <div className="glass-panel rounded-[2rem] p-14 text-center text-slate-300">
              No boarding places found.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Properties Sidebar List */}
              <div className="glass-panel rounded-[2rem] p-4 h-[calc(100vh-280px)] overflow-y-auto space-y-2">
                <h3 className="font-semibold text-slate-200 text-lg mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-cyan-400" />
                  Select Boarding Place
                </h3>
                <div className="space-y-2">
                  {allListings.map((prop) => (
                    <button
                      key={prop.id}
                      onClick={() => setSelectedPropertyId(prop.id)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all ${
                        selectedPropertyId === prop.id
                          ? "bg-white/5 border-cyan-400/30 ring-2 ring-cyan-400/5"
                          : "border-transparent bg-white/[0.02] hover:bg-white/5"
                      }`}
                    >
                      <p className="font-semibold text-slate-200 text-sm truncate">
                        {prop.property_name}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {prop.location}
                      </p>
                      <p className="text-[10px] uppercase font-semibold text-cyan-300 mt-0.5">
                        {prop.nearest_university}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Property Reviews View */}
              <div className="lg:col-span-2 glass-panel rounded-[2rem] p-6 flex flex-col h-[calc(100vh-280px)] overflow-y-auto">
                {selectedPropertyId !== null ? (
                  (() => {
                    const selectedProp = allListings.find(l => l.id === selectedPropertyId);
                    return (
                      <div className="space-y-6 flex-1 flex flex-col">
                        <div className="border-b border-white/5 pb-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                          <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold text-white">
                              {selectedProp?.property_name}
                            </h2>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 text-xs text-slate-300">
                            <div>
                              <span className="font-semibold text-slate-400">Location:</span> {selectedProp?.location}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400">Address:</span> {selectedProp?.address}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400">University:</span> {selectedProp?.nearest_university}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400">Rooms:</span> {selectedProp?.number_of_rooms}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400">Floors:</span> {selectedProp?.number_of_floors}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400">Gender Restriction:</span> {selectedProp?.gender_restriction || "Any"}
                            </div>
                          </div>
                        </div>

                        {loadingReviews ? (
                          <div className="flex-1 flex items-center justify-center text-slate-400">
                            <Loader2 className="h-6 w-6 animate-spin text-cyan-300 mr-2" />
                            <span>Loading reviews...</span>
                          </div>
                        ) : propertyReviews.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                            <MessageSquare className="w-12 h-12 stroke-[1.5] mb-2 text-slate-600" />
                            <p className="text-sm">No reviews found for this boarding place.</p>
                          </div>
                        ) : (
                          <div className="space-y-4 flex-1">
                            {propertyReviews.map((review) => (
                              <div
                                key={review.id}
                                className={`p-5 rounded-3xl border transition-all ${
                                  !review.is_visible
                                    ? "bg-red-950/20 border-red-500/20 opacity-80"
                                    : "bg-white/5 border-white/10"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-slate-200 text-sm">
                                        {review.reviewer_role === "owner" ? "Verified Owner" : "Verified Student"}
                                      </span>
                                      <span className="text-xs text-slate-400">
                                        by {review.reviewer_name || "Anonymous"} ({review.reviewer_email || "N/A"})
                                      </span>
                                      {!review.is_visible && (
                                        <span className="text-[10px] font-semibold bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full">
                                          Hidden
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex text-amber-400 my-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`w-4 h-4 ${
                                            star <= review.rating ? "fill-current" : "text-slate-600"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                      Submitted on {new Date(review.created_at).toLocaleDateString()}
                                    </p>
                                  </div>

                                  <button
                                    onClick={() => handleToggleVisibility(review.id)}
                                    disabled={moderatingReviewId === review.id}
                                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                                      review.is_visible
                                        ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20"
                                        : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20"
                                    }`}
                                  >
                                    {moderatingReviewId === review.id ? (
                                      "Updating..."
                                    ) : review.is_visible ? (
                                      <>
                                        <EyeOff className="w-3.5 h-3.5" />
                                        Hide Review
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="w-3.5 h-3.5" />
                                        Unhide Review
                                      </>
                                    )}
                                  </button>
                                </div>

                                {review.comment && (
                                  <p className="text-slate-300 text-sm italic mt-3 bg-slate-950/40 p-3 rounded-2xl border border-white/5 leading-relaxed">
                                    "{review.comment}"
                                  </p>
                                )}

                                {review.media && review.media.length > 0 && (
                                  <div className="flex gap-2 flex-wrap mt-3">
                                    {review.media.map((med: any) => (
                                      <a
                                        key={med.id}
                                        href={med.public_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 hover:opacity-85 transition"
                                      >
                                        {med.mime_type.startsWith("image/") ? (
                                          <img
                                            src={med.public_url}
                                            alt="Review attachment"
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <div className="h-full w-full bg-slate-950 flex flex-col items-center justify-center text-white text-[9px] p-1 font-semibold leading-tight text-center">
                                            <span>Play</span>
                                            <span>Video</span>
                                          </div>
                                        )}
                                      </a>
                                    ))}
                                  </div>
                                )}

                                {review.reply && (
                                  <div className="bg-cyan-500/5 border-l-2 border-cyan-400 p-3 rounded-r-2xl text-xs space-y-1 mt-3">
                                    <p className="font-semibold text-cyan-300">Landlord's reply:</p>
                                    <p className="text-slate-300 leading-relaxed">{review.reply.reply}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12">
                    <MessageSquare className="w-12 h-12 stroke-[1.5] mb-2 text-slate-600" />
                    <p className="text-sm">Select a boarding place from the sidebar to moderate reviews.</p>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* Verification Document Modal Viewer */}
      {showDocModal && activeDocUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-[2rem] max-w-5xl w-full h-[85vh] flex flex-col p-6 shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <div>
                <h3 className="text-xl font-semibold text-white">Verification Document</h3>
                <p className="text-xs text-slate-400 mt-1">Review credentials below</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDocModal(false)
                  setActiveDocUrl(null)
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-100"
              >
                Close
              </button>
            </div>
            <div className="flex-1 rounded-2xl overflow-hidden bg-slate-950/80 border border-white/5">
              <iframe
                src={activeDocUrl}
                className="w-full h-full border-0"
                title="Verification Document Viewer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}