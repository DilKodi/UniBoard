import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Clock3, Home, Layers3, Mail, MapPin, Phone, Shield, Star, MessageSquare, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchListingById,
  fetchRooms,
  createVisitRequest,
  createBookingRequest,
  fetchOwnerProfile,
  fetchListingImages,
  fetchPropertyReviews,
  fetchPropertyReviewsSummary,
  deleteReview,
  fetchStudentBookings,
  fetchStudentVisits,
  createReview,
  uploadReviewMedia,
  type BoardingPlaceResponse
} from "../services/api";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { UNIVERSITY_COORDINATES } from "../data/universities";

// Fix Leaflet default marker icon issue with React
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type RoomOption = {
  id: string;
  roomNumber: string;
  type: string;
  isAvailable: boolean;
  price: number;
  maxSharing?: number;
  slotsTaken?: number;
  floorNumber?: number;
}

type BoardingDetailsListing = BoardingPlaceResponse & {
  images?: string[];
  description?: string;
  owner_contact_number?: string | null;
  owner_email?: string | null;
  rooms?: RoomOption[];
  price?: number;
}

const getCompleteRoomsList = (listing: BoardingDetailsListing): RoomOption[] => {
  const existingRooms = listing.rooms || [];
  if (existingRooms.length >= listing.number_of_rooms) {
    return existingRooms;
  }

  const completeRooms = [...existingRooms];
  const missingCount = listing.number_of_rooms - existingRooms.length;

  const existingRoomNumbers = new Set(existingRooms.map((r) => r.roomNumber.toLowerCase()));
  const existingRoomIds = new Set(existingRooms.map((r) => r.id));

  // Find min price of existing rooms, default to listing price or 10000
  const basePrice = existingRooms.length > 0
    ? Math.min(...existingRooms.map(r => r.price))
    : (listing.price || 10000);

  // Determine primary type
  const primaryType = existingRooms[0]?.type || "Single";

  let generatedCount = 0;

  // Try generating room numbers across floors
  for (let floor = 1; floor <= listing.number_of_floors; floor++) {
    if (generatedCount >= missingCount) break;

    // Generate up to 10 rooms per floor
    for (let rNum = 1; rNum <= 10; rNum++) {
      if (generatedCount >= missingCount) break;

      const roomNumStr = `${floor}${String(rNum).padStart(2, "0")}`; // e.g. "101", "102"

      if (!existingRoomNumbers.has(roomNumStr.toLowerCase())) {
        const id = `gen-${listing.id}-${floor}-${rNum}`;
        if (!existingRoomIds.has(id)) {
          completeRooms.push({
            id,
            roomNumber: roomNumStr,
            type: primaryType,
            isAvailable: true,
            price: basePrice,
            floorNumber: floor,
          });
          generatedCount++;
        }
      }
    }
  }

  // Fallback generation if floor count was too small to fit the rooms
  let i = 1;
  while (generatedCount < missingCount) {
    const roomNumStr = `Room ${i}`;
    if (!existingRoomNumbers.has(roomNumStr.toLowerCase())) {
      completeRooms.push({
        id: `gen-fallback-${listing.id}-${i}`,
        roomNumber: roomNumStr,
        type: primaryType,
        isAvailable: true,
        price: basePrice,
        floorNumber: 1,
      });
      generatedCount++;
    }
    i++;
  }

  // Sort rooms by floor number first, then room number alphabetically
  return completeRooms.sort((a, b) => {
    if (a.floorNumber !== undefined && b.floorNumber !== undefined) {
      if (a.floorNumber !== b.floorNumber) {
        return a.floorNumber - b.floorNumber;
      }
    }
    return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
  });
};

export default function BoardingDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [listing, setListing] = useState<BoardingDetailsListing | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [dbRooms, setDbRooms] = useState<RoomOption[]>([]);

  const allRooms = useMemo(() => {
    if (dbRooms.length > 0) return dbRooms;
    if (!listing) return [];
    return getCompleteRoomsList(listing);
  }, [listing, dbRooms]);

  const mapCoords = useMemo(() => {
    if (!listing) return null;
    if (listing.latitude != null && listing.longitude != null) {
      return { lat: listing.latitude, lng: listing.longitude };
    }
    // Fallback to university coordinates
    const foundKey = Object.keys(UNIVERSITY_COORDINATES).find(key =>
      listing.nearest_university?.toLowerCase().includes(key.toLowerCase())
    );
    if (foundKey) {
      return UNIVERSITY_COORDINATES[foundKey];
    }
    return { lat: 7.8731, lng: 80.7718 };
  }, [listing]);

  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reviews States
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewSummary, setReviewSummary] = useState<any | null>(null);
  const [eligibleBookingsAndVisits, setEligibleBookingsAndVisits] = useState<any[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewFiles, setReviewFiles] = useState<File[]>([]);
  const [selectedBookingOrVisit, setSelectedBookingOrVisit] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const visitMinDate = useMemo(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }, []);

  const visitMinTime = useMemo(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  }, []);

  const refreshReviewsAndEligibility = async () => {
    if (!id) return;
    let reviewsData: any[] = [];
    try {
      reviewsData = await fetchPropertyReviews(Number(id));
      setReviews(reviewsData);
    } catch (revErr) {
      console.warn("Failed to load reviews", revErr);
    }

    try {
      const summaryData = await fetchPropertyReviewsSummary(Number(id));
      setReviewSummary(summaryData);
    } catch (sumErr) {
      console.warn("Failed to load review summary", sumErr);
    }

    const isEligibleRole = user && (user.role === "student" || user.role === "owner");
    if (isEligibleRole) {
      const alreadyReviewed = reviewsData.some((r: any) => r.student_id === user.id);
      if (alreadyReviewed) {
        setEligibleBookingsAndVisits([]);
        setSelectedBookingOrVisit("");
        return;
      }

      let combined: any[] = [];
      if (user.role === "student") {
        try {
          const [bookings, visits] = await Promise.all([
            fetchStudentBookings(user.id),
            fetchStudentVisits(user.id)
          ]);

          const propBookings = bookings.filter((b: any) => 
            b.property_id === Number(id) && ["completed", "accepted"].includes(b.status)
          );
          const propVisits = visits.filter((v: any) => 
            v.property_id === Number(id) && ["completed", "accepted"].includes(v.status)
          );

          combined = [
            ...propBookings.map((b: any) => ({ ...b, type: "booking" })),
            ...propVisits.map((v: any) => ({ ...v, type: "visit" }))
          ];
        } catch (eligErr) {
          console.warn("Failed to load student eligibility", eligErr);
        }
      }

      // Always allow a General Review as a choice
      combined.push({ id: "general", type: "general", property_id: Number(id) });
      
      setEligibleBookingsAndVisits(combined);
      setSelectedBookingOrVisit("general-general");
    } else {
      setEligibleBookingsAndVisits([]);
      setSelectedBookingOrVisit("");
    }
  };

  useEffect(() => {
    const loadListing = async () => {
      if (!id) {
        setError("Missing listing id.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchListingById(Number(id)) as any;

        // Fetch owner details dynamically
        let ownerProfile = null;
        if (data.owner_id) {
          try {
            ownerProfile = await fetchOwnerProfile(data.owner_id);
          } catch (ownerErr) {
            console.warn("Failed to load owner profile", ownerErr);
          }
        }

        // Convert comma separated images to list
        const imagesList = data.images ? data.images.split(",") : [];

        // Load R2 images dynamically
        let finalImages = imagesList;
        try {
          const r2Images = await fetchListingImages(Number(id));
          if (r2Images && r2Images.length > 0) {
            finalImages = r2Images.map((img: any) => img.url);
          }
        } catch (imgErr) {
          console.warn("Failed to load listing images from R2", imgErr);
        }

        setListing({
          ...data,
          images: finalImages,
          owner_full_name: ownerProfile?.full_name || data.owner_full_name || "Property Owner",
          owner_contact_number: ownerProfile?.contact_number || null,
          owner_email: ownerProfile?.email || null,
        });
        setSelectedImage(finalImages[0] || null);

        // Fetch rooms
        try {
          const roomsData = await fetchRooms(Number(id));
          const mappedRooms: RoomOption[] = roomsData.map((r: any) => ({
            id: r.id.toString(),
            roomNumber: r.room_number,
            type: r.room_type,
            isAvailable: r.is_available,
            price: r.price,
            floorNumber: r.floor_number,
            maxSharing: r.max_sharing,
            slotsTaken: r.slots_taken,
          }));
          setDbRooms(mappedRooms);
        } catch (roomErr) {
          console.warn("Failed to load rooms for property", roomErr);
        }

        // Fetch reviews, summary, and eligibility
        await refreshReviewsAndEligibility();
      } catch (err) {
        console.error("Failed to load listing", err);
        setError("Unable to load this boarding place right now.");
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [id, location.state, user]);

  const openRequestVisitModal = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    setVisitDate(tomorrow.toISOString().slice(0, 10));
    setVisitTime("10:00");
    setShowVisitModal(true);
  };

  const submitVisitRequest = async () => {
    if (!user) {
      addToast("You must be logged in as a student to request a visit.", "warning");
      navigate("/login");
      return;
    }
    if (user.role !== "student") {
      addToast("Only students can request visits.", "warning");
      return;
    }
    if (!visitDate || !visitTime) {
      addToast("Select a visit date and time.", "warning");
      return;
    }

    const scheduledAt = new Date(`${visitDate}T${visitTime}:00`);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      addToast("Please choose an upcoming day and time.", "warning");
      return;
    }

    try {
      await createVisitRequest({
        student_id: user.id,
        student_name: user.student_profile?.full_name || user.email,
        property_id: listing!.id,
        property_name: listing!.property_name,
        room_name: "Any Room",
        requested_date: `${visitDate} ${visitTime}`
      });
      addToast(
        `Visit request sent for ${listing?.property_name || "this boarding place"} on ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
        "success",
      );
      setShowVisitModal(false);
    } catch (err) {
      console.error("Failed to send visit request", err);
      addToast("Failed to submit visit request.", "error");
    }
  };

  const handleBookNow = () => {
    const firstSelectableRoom = allRooms.find((room) => room.isAvailable) || allRooms[0];
    setSelectedRoomId(firstSelectableRoom?.id || "");
    setShowBookModal(true);
  };

  const submitBookingRequest = async () => {
    if (!user) {
      addToast("You must be logged in as a student to book a room.", "warning");
      navigate("/login");
      return;
    }
    if (user.role !== "student") {
      addToast("Only students can book rooms.", "warning");
      return;
    }
    if (!allRooms.length) {
      addToast("Room booking details are not available for this property yet.", "warning");
      return;
    }

    const selectedRoom = allRooms.find((room) => room.id === selectedRoomId);
    if (!selectedRoom) {
      addToast("Select a room to continue.", "warning");
      return;
    }

    if (!selectedRoom.isAvailable) {
      addToast("That room is already occupied. Please choose an available room.", "warning");
      return;
    }

    try {
      await createBookingRequest({
        student_id: user.id,
        student_name: user.student_profile?.full_name || user.email,
        property_id: listing!.id,
        property_name: listing!.property_name,
        room_id: selectedRoom.id,
        room_name: `Room ${selectedRoom.roomNumber}`,
        requested_date: new Date().toLocaleDateString()
      });
      addToast(
        `Booking request sent for room ${selectedRoom.roomNumber} (${selectedRoom.type}) at ${listing!.property_name}.`,
        "success",
      );
      setShowBookModal(false);
    } catch (err) {
      console.error("Failed to submit booking request", err);
      addToast("Failed to send booking request.", "error");
    }
  };

  const handleDeleteReviewClick = async (reviewId: number) => {
    if (!window.confirm("Are you sure you want to delete your review? This action cannot be undone.")) return;
    try {
      await deleteReview(reviewId);
      addToast("Review deleted successfully.", "success");
      await refreshReviewsAndEligibility();
    } catch (err) {
      console.error("Failed to delete review", err);
      addToast("Failed to delete review.", "error");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingOrVisit) {
      addToast("Please select a booking or visit to review.", "warning");
      return;
    }

    setSubmittingReview(true);
    try {
      const parts = selectedBookingOrVisit.split("-");
      const type = parts[0];
      const linkId = Number(parts[1]);

      const payload = {
        property_id: Number(id),
        rating: reviewRating,
        comment: reviewComment || null,
        booking_id: type === "booking" ? linkId : null,
        visit_id: type === "visit" ? linkId : null,
      };

      const reviewRes = await createReview(payload);
      
      if (reviewFiles.length > 0) {
        try {
          await uploadReviewMedia(reviewRes.id, reviewFiles);
        } catch (mediaErr) {
          console.error("Failed to upload media files", mediaErr);
          addToast("Review created, but media upload failed.", "warning");
        }
      }

      addToast("Review submitted successfully!", "success");
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewComment("");
      setReviewFiles([]);
      await refreshReviewsAndEligibility();
    } catch (err: any) {
      console.error("Failed to submit review", err);
      let msg = "Failed to submit review.";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          msg = detail;
        } else if (Array.isArray(detail)) {
          msg = detail.map((d: any) => `${d.loc ? d.loc.join('.') : ''}: ${d.msg}`).join(", ");
        } else if (typeof detail === "object") {
          msg = JSON.stringify(detail);
        }
      } else if (err.message) {
        msg = err.message;
      }
      addToast(msg, "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-8 py-20 text-center text-gray-600">
          Loading boarding place...
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-8 py-20 text-center">
          <p className="text-red-600 mb-4">{error || "Listing not found."}</p>
          <button
            onClick={() => navigate("/listings")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to listings
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Search Results</span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className={`relative rounded-xl overflow-hidden h-96 ${listing.images?.length ? "bg-gray-900" : "bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400"}`}>
              {listing.images?.length ? (
                <img
                  src={selectedImage || listing.images[0]}
                  alt={listing.property_name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 p-8 flex flex-col justify-end text-white">
                <p className="text-sm uppercase tracking-[0.3em] text-white/80">Boarding place</p>
                <h1 className="text-4xl font-bold mt-2">{listing.property_name}</h1>
                <p className="mt-3 text-white/90 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {listing.location}
                </p>
              </div>
              <div className="absolute top-4 right-4 bg-white/90 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                {listing.status}
              </div>
            </div>

            {listing.images?.length ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Image gallery</h2>
                  <p className="text-sm text-gray-500">Click an image to preview it above</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {listing.images.map((image, index) => (
                    <button
                      key={image}
                      onClick={() => setSelectedImage(image)}
                      className={`group relative overflow-hidden rounded-lg border transition ${selectedImage === image ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200"}`}
                    >
                      <img
                        src={image}
                        alt={`${listing.property_name} ${index + 1}`}
                        className="h-28 w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{listing.property_name}</h2>
                  <p className="text-gray-600 mt-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {listing.address}
                  </p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Bookmark className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className={`grid gap-4 mt-6 ${listing.price_range ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Home className="w-4 h-4" />
                    Rooms
                  </div>
                  <div className="text-xl font-bold text-gray-900 mt-2">{listing.number_of_rooms}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Layers3 className="w-4 h-4" />
                    Floors
                  </div>
                  <div className="text-xl font-bold text-gray-900 mt-2">{listing.number_of_floors}</div>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Clock3 className="w-4 h-4" />
                    Listed
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mt-2">
                    {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : "N/A"}
                  </div>
                </div>
                {listing.price_range && (
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                    <div className="flex items-center gap-2 text-blue-700 text-sm font-semibold">
                      Price Range
                    </div>
                    <div className="text-sm font-bold text-blue-900 mt-2">{listing.price_range}</div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Nearest university</h3>
                <p className="text-gray-700">{listing.nearest_university}</p>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Gender Restriction</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${listing.gender_restriction === "Male Only"
                    ? "bg-blue-100 text-blue-800"
                    : listing.gender_restriction === "Female Only"
                      ? "bg-pink-100 text-pink-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                  {listing.gender_restriction || "Any"}
                </span>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Verification document</h3>
                <p className="text-gray-700">{listing.verification_document_name || "Not uploaded yet"}</p>
              </div>

              {/* Location Map */}
              {mapCoords && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Location on map
                  </h3>
                  <div style={{ height: "300px", width: "100%" }} className="rounded-xl overflow-hidden border border-gray-200 relative z-0">
                    <MapContainer
                      center={[mapCoords.lat, mapCoords.lng]}
                      zoom={15}
                      style={{ height: "100%", width: "100%" }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[mapCoords.lat, mapCoords.lng]} icon={redIcon}>
                        <Popup>
                          <div className="p-1">
                            <h4 className="font-bold text-sm">{listing.property_name}</h4>
                            <p className="text-xs text-gray-600 mt-1">{listing.address}</p>
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                </div>
              )}

              {allRooms.length ? (
                <div className="mt-6 rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Room availability</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
                      Available rooms: {allRooms.filter((room) => room.isAvailable).length}
                    </div>
                    <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800">
                      Occupied rooms: {allRooms.filter((room) => !room.isAvailable).length}
                    </div>
                  </div>
                </div>
              ) : null}

              {listing.description && (
                <div className="mt-6 rounded-xl bg-gray-50 p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">About this property</h3>
                  <p className="text-gray-700 leading-7">{listing.description}</p>
                </div>
              )}

              {listing.status === "rejected" && listing.rejection_reason && (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                  <h3 className="font-semibold text-red-900 mb-2">Rejected listing</h3>
                  <p className="text-sm text-red-800">{listing.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Student Reviews</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {reviewSummary ? `${reviewSummary.total_reviews} reviews` : "No reviews yet"}
                  </p>
                </div>
                {eligibleBookingsAndVisits.length > 0 && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition"
                  >
                    Write a Review
                  </button>
                )}
              </div>

              {/* Review Summary Breakdown */}
              {reviewSummary && reviewSummary.total_reviews > 0 && (
                <div className="flex flex-col md:flex-row items-center gap-6 bg-gray-50 p-6 rounded-xl">
                  <div className="text-center md:border-r pr-6 border-gray-200">
                    <div className="text-5xl font-extrabold text-gray-900">{reviewSummary.average_rating}</div>
                    <div className="flex justify-center my-2 text-yellow-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${star <= Math.round(reviewSummary.average_rating) ? "fill-current" : ""}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 font-medium">Out of 5 Stars</p>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    <p className="text-sm text-gray-700 font-medium">
                      Reviews are verified and submitted by students who visited or stayed at this boarding place.
                    </p>
                  </div>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-600">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-lg font-medium">No reviews yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Be the first to share your experience if you have visited or booked this property.
                    </p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b last:border-b-0 pb-6 last:pb-0 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                            {review.reviewer_role === "owner" ? "O" : (review.student_id ? "S" : "A")}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {review.reviewer_role === "owner" 
                                ? "Verified Owner" 
                                : (review.reviewer_role === "student" ? "Verified Student" : (review.student_id ? "Verified Student" : "Admin"))}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="flex text-yellow-500">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3.5 h-3.5 ${star <= review.rating ? "fill-current" : ""}`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {user && user.role === "student" && user.id === review.student_id && (
                          <button
                            onClick={() => handleDeleteReviewClick(review.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                            title="Delete review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {review.comment && <p className="text-gray-700 leading-relaxed text-sm">{review.comment}</p>}

                      {/* Review Media Attachments */}
                      {review.media && review.media.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {review.media.map((med: any) => (
                            <a
                              key={med.id}
                              href={med.public_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200 group"
                            >
                              {med.mime_type.startsWith("image/") ? (
                                <img
                                  src={med.public_url}
                                  alt="Attachment"
                                  className="h-full w-full object-cover transition group-hover:scale-105"
                                />
                              ) : (
                                <div className="h-full w-full bg-gray-900 flex items-center justify-center text-white text-xs">
                                  Video
                                </div>
                              )}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Landlord's Reply */}
                      {review.reply && (
                        <div className="mt-4 bg-blue-50/50 border-l-4 border-blue-500 p-4 rounded-r-xl space-y-1">
                          <p className="font-semibold text-sm text-blue-900">Landlord's Response</p>
                          <p className="text-sm text-blue-950 leading-relaxed">{review.reply.reply}</p>
                          <p className="text-xs text-blue-800/80">
                            {new Date(review.reply.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                  {listing.owner_full_name?.charAt(0).toUpperCase() || "O"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{listing.owner_full_name || "Property Owner"}</p>
                  <p className="text-sm text-gray-600">Owner</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  {listing.owner_contact_number || "Contact can be added later"}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  {listing.owner_email || "Verification-based contact flow pending"}
                </div>
                {(listing.status?.toLowerCase() === "approved" || listing.status?.toLowerCase() === "verified") && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    Verified Listing
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-3">
                <button
                  onClick={openRequestVisitModal}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Request a Visit
                </button>
                <button
                  onClick={handleBookNow}
                  className="w-full py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-semibold"
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showVisitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-gray-900">Schedule a visit</h2>
              <p className="mt-2 text-sm text-gray-600">
                Choose an upcoming day and time for your visit to {listing.property_name}.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Visit day</label>
                <input
                  type="date"
                  min={visitMinDate}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Visit time</label>
                <input
                  type="time"
                  min={visitDate === visitMinDate ? visitMinTime : undefined}
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowVisitModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitVisitRequest}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-gray-900">Choose a room to book</h2>
              <p className="mt-2 text-sm text-gray-600">
                All room options are shown below, including occupied ones for reference.
              </p>
            </div>

            {allRooms.length ? (
              <div className="max-h-[60vh] overflow-y-auto pr-1">
                <div className="grid gap-3 md:grid-cols-2">
                  {allRooms.map((room) => {
                    const isSelected = selectedRoomId === room.id;
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => room.isAvailable && setSelectedRoomId(room.id)}
                        className={`rounded-xl border p-4 text-left transition ${isSelected ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200"} ${room.isAvailable ? "hover:border-blue-400 hover:bg-blue-50/40" : "bg-gray-50 opacity-90"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-gray-900">Room {room.roomNumber}</p>
                            <p className="text-sm text-gray-600">
                              {room.type === "Shared" && room.maxSharing !== undefined
                                ? `Shared (${room.maxSharing}-person sharing)`
                                : room.type}
                              {room.floorNumber !== undefined && ` • Floor ${room.floorNumber}`}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${room.isAvailable ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                            {room.type === "Shared" && room.maxSharing !== undefined && room.slotsTaken !== undefined
                              ? room.isAvailable
                                ? `${room.maxSharing - room.slotsTaken} slots left`
                                : "Full"
                              : room.isAvailable ? "Available" : "Occupied"}
                          </span>
                        </div>

                        {room.type === "Shared" && room.maxSharing !== undefined && room.slotsTaken !== undefined && (
                          <div className="mt-3 text-xs text-gray-600">
                            <div className="flex justify-between mb-1">
                              <span>Sharing Slots: {room.slotsTaken}/{room.maxSharing} filled</span>
                              <span className="font-semibold text-blue-700">
                                {room.maxSharing - room.slotsTaken} left
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${(room.slotsTaken / room.maxSharing) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-base font-bold text-gray-900">
                            LKR {room.price.toLocaleString()}
                            <span className="text-sm font-normal text-gray-600"> / month</span>
                          </p>
                          {!room.isAvailable && (
                            <span className="text-xs font-semibold text-gray-500">
                              {room.type === "Shared" ? "All slots filled" : "Already filled"}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Room options are not available for this property yet.
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowBookModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitBookingRequest}
                disabled={!allRooms.length}
                className="flex-1 rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Send Booking Request
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
              <p className="mt-1 text-sm text-gray-600">
                Share your experience about {listing.property_name}.
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Select Booking/Visit</label>
                <select
                  value={selectedBookingOrVisit}
                  onChange={(e) => setSelectedBookingOrVisit(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  required
                >
                  <option value="" disabled>-- Choose a stay or visit --</option>
                  {eligibleBookingsAndVisits.map((item) => (
                    <option key={`${item.type}-${item.id}`} value={`${item.type}-${item.id}`}>
                      {item.type === "booking" 
                        ? `Stay Booking (Room: ${item.room_name || "N/A"})` 
                        : (item.type === "visit" ? `Visit Request (Date: ${item.requested_date})` : "General Review")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-yellow-500 hover:scale-110 transition p-0.5"
                    >
                      <Star className={`w-8 h-8 ${star <= reviewRating ? "fill-current" : "text-gray-300"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Comment (Optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell us what you liked or disliked about this property..."
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Upload Media (Optional)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setReviewFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {reviewFiles.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Selected: {reviewFiles.map((f) => f.name).join(", ")}
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  disabled={submittingReview}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-blue-700 hover:bg-blue-800 px-4 py-2 text-sm font-semibold text-white transition flex items-center justify-center disabled:bg-gray-300"
                  disabled={submittingReview || !selectedBookingOrVisit}
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}