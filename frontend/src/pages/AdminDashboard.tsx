import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useToast } from "../components/ToastProvider";
import {
  approveListing,
  fetchPendingListings,
  rejectListing,
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

  useEffect(() => {
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

    loadPending();
  }, [addToast]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Review</h1>
            <p className="text-gray-600 mt-2">
              Approve or reject boarding listings submitted by owners.
            </p>
          </div>
          <button
            onClick={() => navigate("/listings")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            View Public Listings
          </button>
        </div>

        {loading ? (
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
                      {listing.verification_document_name || "Not uploaded"}
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
        )}
      </div>
      <Footer />
    </div>
  );
}
