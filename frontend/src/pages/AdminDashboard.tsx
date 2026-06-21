import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Star, Eye, EyeOff, MessageSquare } from "lucide-react";
import { useToast } from "../components/ToastProvider";
import {
  approveListing,
  fetchPendingListings,
  rejectListing,
  fetchListings,
  fetchPropertyReviews,
  toggleReviewVisibility,
  type BoardingPlaceResponse,
} from "../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [listings, setListings] = useState<BoardingPlaceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<
    Record<number, string>
  >({});
  
  // Document Viewer Popup States
  const [activeDocUrl, setActiveDocUrl] = useState<string | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<"listings" | "reviews">("listings");

  // Reviews Tab States
  const [allListings, setAllListings] = useState<BoardingPlaceResponse[]>([]);
  const [loadingAllListings, setLoadingAllListings] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [propertyReviews, setPropertyReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [moderatingReviewId, setModeratingReviewId] = useState<number | null>(null);

  const getVerificationUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const loadPending = async () => {
    try {
      setLoading(true);
      const data = await fetchPendingListings();
      setListings(data);
    } catch (error) {
      console.error("Failed to load pending listings", error);
      addToast("Unable to load pending listings.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, [addToast]);

  // Load all listings when switching to Reviews tab
  useEffect(() => {
    if (activeTab === "reviews") {
      const loadAll = async () => {
        try {
          setLoadingAllListings(true);
          const data = await fetchListings();
          setAllListings(data);
          if (data.length > 0 && selectedPropertyId === null) {
            setSelectedPropertyId(data[0].id);
          }
        } catch (error) {
          console.error("Failed to load all listings for reviews", error);
          addToast("Unable to load properties.", "error");
        } finally {
          setLoadingAllListings(false);
        }
      };
      loadAll();
    }
  }, [activeTab, addToast]);

  // Load reviews when selected property changes
  const loadReviewsForProperty = async (propertyId: number) => {
    try {
      setLoadingReviews(true);
      const data = await fetchPropertyReviews(propertyId, true);
      setPropertyReviews(data);
    } catch (error) {
      console.error("Failed to load reviews for property", error);
      addToast("Failed to load reviews.", "error");
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reviews" && selectedPropertyId !== null) {
      loadReviewsForProperty(selectedPropertyId);
    }
  }, [activeTab, selectedPropertyId]);

  const handleApprove = async (id: number) => {
    try {
      setBusyId(id);
      const updated = await approveListing(id);
      setListings((current) => current.filter((listing) => listing.id !== id));
      addToast(`${updated.property_name} approved successfully.`, "success");
    } catch (error) {
      console.error("Failed to approve listing", error);
      addToast("Unable to approve listing.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id: number) => {
    try {
      setBusyId(id);
      const updated = await rejectListing(id, rejectionReasons[id]);
      setListings((current) => current.filter((listing) => listing.id !== id));
      addToast(`${updated.property_name} rejected.`, "success");
    } catch (error) {
      console.error("Failed to reject listing", error);
      addToast("Unable to reject listing.", "error");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleVisibility = async (reviewId: number) => {
    try {
      setModeratingReviewId(reviewId);
      const res = await toggleReviewVisibility(reviewId);
      addToast(`Review visibility updated to ${res.is_visible ? "Visible" : "Hidden"}.`, "success");
      if (selectedPropertyId !== null) {
        await loadReviewsForProperty(selectedPropertyId);
      }
    } catch (error) {
      console.error("Failed to toggle review visibility", error);
      addToast("Failed to update review visibility.", "error");
    } finally {
      setModeratingReviewId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Board</h1>
            <p className="text-gray-600 mt-2">
              Approve boarding listings or moderate student reviews.
            </p>
          </div>
          <button
            onClick={() => navigate("/listings")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View Public Listings
          </button>
        </div>

        {/* Tab Selection */}
        <div className="mb-6 flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("listings")}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
              activeTab === "listings"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Pending Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`py-3 px-6 font-semibold text-sm border-b-2 transition-all ${
              activeTab === "reviews"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Review Moderation
          </button>
        </div>

        {activeTab === "listings" ? (
          loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-gray-600">
              Loading pending listings...
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-gray-600">
              No listings are waiting for review.
            </div>
          ) : (
            <div className="grid gap-4">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-bold text-gray-900">
                          {listing.property_name}
                        </h2>
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                          {listing.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-2">{listing.location}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Owner: {listing.owner_full_name || "Unknown"} ·{" "}
                        {listing.number_of_rooms} rooms ·{" "}
                        {listing.number_of_floors} floors
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        University: {listing.nearest_university}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Verification document:{" "}
                        {listing.verification_document_url ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveDocUrl(getVerificationUrl(listing.verification_document_url));
                              setShowDocModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:underline transition font-medium"
                          >
                            {listing.verification_document_name || "View Document"}
                          </button>
                        ) : (
                          listing.verification_document_name || "Not uploaded"
                        )}
                      </p>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rejection reason (optional)
                        </label>
                        <textarea
                          value={rejectionReasons[listing.id] || ""}
                          onChange={(event) =>
                            setRejectionReasons((current) => ({
                              ...current,
                              [listing.id]: event.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Explain what needs to be corrected before resubmission"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReject(listing.id)}
                        disabled={busyId === listing.id}
                        className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(listing.id)}
                        disabled={busyId === listing.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Reviews Tab */
          loadingAllListings ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-gray-600">
              Loading properties...
            </div>
          ) : allListings.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-gray-600">
              No boarding places found.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Properties Sidebar List */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 h-[calc(100vh-280px)] overflow-y-auto">
                <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  Select Boarding Place
                </h3>
                <div className="space-y-2">
                  {allListings.map((prop) => (
                    <button
                      key={prop.id}
                      onClick={() => setSelectedPropertyId(prop.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedPropertyId === prop.id
                          ? "bg-blue-50 border-blue-300 ring-2 ring-blue-50"
                          : "border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-semibold text-gray-950 text-sm truncate">
                        {prop.property_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {prop.location}
                      </p>
                      <p className="text-[10px] uppercase font-semibold text-gray-400 mt-0.5">
                        {prop.nearest_university}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Property Reviews View */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 flex flex-col h-[calc(100vh-280px)] overflow-y-auto">
                {selectedPropertyId !== null ? (
                  (() => {
                    const selectedProp = allListings.find(l => l.id === selectedPropertyId);
                    return (
                      <div className="space-y-6 flex-1 flex flex-col">
                        <div className="border-b pb-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                          <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-900">
                              {selectedProp?.property_name}
                            </h2>
                            <button
                              onClick={() => navigate(`/listings/${selectedPropertyId}`)}
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                            >
                              View Public Details Page
                            </button>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 text-xs text-gray-700">
                            <div>
                              <span className="font-semibold text-gray-500">Location:</span> {selectedProp?.location}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-500">Address:</span> {selectedProp?.address}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-500">University:</span> {selectedProp?.nearest_university}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-500">Rooms:</span> {selectedProp?.number_of_rooms}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-500">Floors:</span> {selectedProp?.number_of_floors}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-500">Gender Restriction:</span> {selectedProp?.gender_restriction || "Any"}
                            </div>
                          </div>
                        </div>

                        {loadingReviews ? (
                          <div className="flex-1 flex items-center justify-center text-gray-500">
                            <span className="animate-pulse">Loading reviews...</span>
                          </div>
                        ) : propertyReviews.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12">
                            <MessageSquare className="w-12 h-12 stroke-[1.5] mb-2 text-gray-300" />
                            <p className="text-sm">No reviews found for this boarding place.</p>
                          </div>
                        ) : (
                          <div className="space-y-4 flex-1">
                            {propertyReviews.map((review) => (
                              <div
                                key={review.id}
                                className={`p-5 rounded-xl border transition-all ${
                                  !review.is_visible
                                    ? "bg-red-50/40 border-red-200 opacity-80"
                                    : "bg-gray-50/50 border-gray-200"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-900 text-sm">
                                        {review.reviewer_role === "owner" ? "Verified Owner" : "Verified Student"}
                                      </span>
                                      <span className="text-xs text-gray-600">
                                        by {review.reviewer_name || "Anonymous"} ({review.reviewer_email || "N/A"})
                                      </span>
                                      {!review.is_visible && (
                                        <span className="text-[10px] font-semibold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                          Hidden from public
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex text-yellow-500 my-1">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={`w-4 h-4 ${
                                            star <= review.rating ? "fill-current" : "text-gray-200"
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <p className="text-xs text-gray-400">
                                      Submitted on {new Date(review.created_at).toLocaleDateString()}
                                    </p>
                                  </div>

                                  <button
                                    onClick={() => handleToggleVisibility(review.id)}
                                    disabled={moderatingReviewId === review.id}
                                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                                      review.is_visible
                                        ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200"
                                        : "bg-green-50 hover:bg-green-100 text-green-700 border border-green-200"
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
                                  <p className="text-gray-700 text-sm italic mt-3 bg-white p-3 rounded-lg border border-gray-100 leading-relaxed">
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
                                        className="h-14 w-14 overflow-hidden rounded-lg border border-gray-200 hover:opacity-95 transition"
                                      >
                                        {med.mime_type.startsWith("image/") ? (
                                          <img
                                            src={med.public_url}
                                            alt="Review attachment"
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <div className="h-full w-full bg-gray-900 flex flex-col items-center justify-center text-white text-[9px] p-1 font-semibold leading-tight text-center">
                                            <span>Play</span>
                                            <span>Video</span>
                                          </div>
                                        )}
                                      </a>
                                    ))}
                                  </div>
                                )}

                                {review.reply && (
                                  <div className="bg-blue-50/70 border-l-2 border-blue-500 p-3 rounded-r-lg text-xs space-y-1 mt-3">
                                    <p className="font-semibold text-blue-900">Landlord's reply:</p>
                                    <p className="text-blue-950 leading-relaxed">{review.reply.reply}</p>
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
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12">
                    <MessageSquare className="w-12 h-12 stroke-[1.5] mb-2 text-gray-300" />
                    <p className="text-sm">Select a boarding place from the sidebar to moderate reviews.</p>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>
      <Footer />

      {/* Verification Document Modal Viewer */}
      {showDocModal && activeDocUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full h-[85vh] flex flex-col p-6 shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Verification Document</h3>
                <p className="text-xs text-gray-500 mt-1">Review credentials below</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowDocModal(false);
                  setActiveDocUrl(null);
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Close
              </button>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden bg-gray-100 border">
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
  );
}
