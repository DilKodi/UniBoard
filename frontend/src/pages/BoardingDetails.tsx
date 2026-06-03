import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Clock3, Home, Layers3, Mail, MapPin, Phone, Shield } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useToast } from "../components/ToastProvider";
import { fetchListingById, type BoardingPlaceResponse } from "../services/api";
import { demoBoardingPlaces } from "../data/demoBoardingPlaces";

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
  const [listing, setListing] = useState<BoardingDetailsListing | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const allRooms = useMemo(() => {
    if (!listing) return [];
    return getCompleteRoomsList(listing);
  }, [listing]);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const visitMinDate = useMemo(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }, []);

  const visitMinTime = useMemo(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  }, []);

  useEffect(() => {
    const loadListing = async () => {
      const routeState = location.state as { boarding?: BoardingDetailsListing } | null;
      if (routeState?.boarding) {
        setListing(routeState.boarding);
        setSelectedImage(routeState.boarding.images?.[0] || null);
        setLoading(false);
        return;
      }

      if (!id) {
        setError("Missing listing id.");
        setLoading(false);
        return;
      }

      const demoListing = demoBoardingPlaces.find((place) => place.id.toString() === id || `mock-${place.id}` === id);
      if (demoListing) {
        setListing(demoListing);
        setSelectedImage(demoListing.images?.[0] || null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchListingById(Number(id));
        setListing(data);
        setSelectedImage(null);
      } catch (err) {
        console.error("Failed to load listing", err);
        const fallbackListing = demoBoardingPlaces.find((place) => place.id.toString() === id || `mock-${place.id}` === id);
        if (fallbackListing) {
          setListing(fallbackListing);
          setSelectedImage(fallbackListing.images?.[0] || null);
          return;
        }

        setError("Unable to load this boarding place right now.");
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [id, location.state]);

  const openRequestVisitModal = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    setVisitDate(tomorrow.toISOString().slice(0, 10));
    setVisitTime("10:00");
    setShowVisitModal(true);
  };

  const submitVisitRequest = () => {
    if (!visitDate || !visitTime) {
      addToast("Select a visit date and time.", "warning");
      return;
    }

    const scheduledAt = new Date(`${visitDate}T${visitTime}:00`);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      addToast("Please choose an upcoming day and time.", "warning");
      return;
    }

    addToast(
      `Visit request sent for ${listing?.property_name || "this boarding place"} on ${scheduledAt.toLocaleDateString()} at ${scheduledAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
      "success",
    );
    setShowVisitModal(false);
  };

  const handleBookNow = () => {
    const firstSelectableRoom = allRooms.find((room) => room.isAvailable) || allRooms[0];
    setSelectedRoomId(firstSelectableRoom?.id || "");
    setShowBookModal(true);
  };

  const submitBookingRequest = () => {
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

    addToast(
      `Booking request sent for room ${selectedRoom.roomNumber} (${selectedRoom.type}) at ${listing.property_name}.`,
      "success",
    );
    setShowBookModal(false);
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

              <div className="grid sm:grid-cols-3 gap-4 mt-6">
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
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Nearest university</h3>
                <p className="text-gray-700">{listing.nearest_university}</p>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Verification document</h3>
                <p className="text-gray-700">{listing.verification_document_name || "Not uploaded yet"}</p>
              </div>

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
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  {listing.status === "approved" ? "Approved listing" : "Pending admin review"}
                </div>
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

      <Footer />
    </div>
  );
}