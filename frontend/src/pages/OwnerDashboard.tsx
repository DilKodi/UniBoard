import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Eye,
  Calendar,
  Home,
  MessageSquare,
  Plus,
  Pencil,
  X,
  Image as ImageIcon,
  Trash2,
  Upload,
  Loader2,
  Star,
} from "lucide-react";
import { useToast } from "../components/ToastProvider";
import { 
  fetchMyListings, 
  fetchRooms, 
  createRoom, 
  updateRoom, 
  toggleRoomStatus as toggleRoomApi, 
  fetchPropertyVisits, 
  fetchPropertyBookings, 
  updateVisitRequestStatus, 
  updateBookingRequestStatus,
  fetchListingImages,
  uploadListingImage,
  deleteListingImage,
  fetchPropertyReviews,
  replyToReview,
  type BoardingPlaceResponse 
} from "../services/api";

interface Room {
  id: string;
  name: string;
  type: string;
  price: number;
  views: number;
  status: "Occupied" | "Available";
  maxSharing?: number;
  slotsTaken?: number;
}

interface VisitRequest {
  id: string;
  studentName: string;
  room: string;
  requestedDate: string;
  status: "pending" | "accepted" | "declined";
}

interface BookingRequest {
  id: string;
  studentName: string;
  room: string;
  requestedDate: string;
  status: "pending" | "accepted" | "declined";
}

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [listings, setListings] = useState<BoardingPlaceResponse[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<number | null>(null);


  const [rooms, setRooms] = useState<Room[]>([]);
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"visit" | "booking" | "reviews">("visit");
  const [reviews, setReviews] = useState<any[]>([]);
  const [replyTextStore, setReplyTextStore] = useState<Record<number, string>>({});
  const [submittingReplies, setSubmittingReplies] = useState<Record<number, boolean>>({});
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // R2 Image Management State
  const [showManageImagesModal, setShowManageImagesModal] = useState(false);
  const [listingImages, setListingImages] = useState<{ id: number; url: string; key: string }[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const openManageImages = async () => {
    if (selectedListingId === null) return;
    setShowManageImagesModal(true);
    await loadListingImages(selectedListingId);
  };

  const loadListingImages = async (listingId: number) => {
    setLoadingImages(true);
    try {
      const data = await fetchListingImages(listingId);
      setListingImages(data);
    } catch (err) {
      console.error("Failed to load listing images", err);
      addToast("Failed to load property photos.", "error");
    } finally {
      setLoadingImages(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedListingId === null) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      addToast("Only JPEG, PNG, and WebP images are allowed.", "warning");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast("File size must be under 5MB.", "warning");
      return;
    }

    setUploadingImage(true);
    try {
      await uploadListingImage(selectedListingId, file);
      addToast("Image uploaded successfully!", "success");
      await loadListingImages(selectedListingId);
    } catch (err: any) {
      console.error("Failed to upload image", err);
      addToast(err?.response?.data?.detail || "Failed to upload image.", "error");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (selectedListingId === null) return;
    try {
      await deleteListingImage(selectedListingId, imageId);
      addToast("Image deleted successfully!", "success");
      await loadListingImages(selectedListingId);
    } catch (err: any) {
      console.error("Failed to delete image", err);
      addToast(err?.response?.data?.detail || "Failed to delete image.", "error");
    }
  };
  const [newRoomForm, setNewRoomForm] = useState({
    name: "",
    type: "Single",
    price: "",
    description: "",
    maxSharing: "2",
    slotsTaken: "0",
  });
  const [editRoomForm, setEditRoomForm] = useState({
    name: "",
    type: "Single",
    price: "",
    description: "",
    maxSharing: "2",
    slotsTaken: "0",
  });

  const refreshDashboardData = async (listingId: number) => {
    try {
      // Fetch rooms
      let dbRooms = await fetchRooms(listingId);

      if (dbRooms.length === 0) {
        const currentListing = listings.find((l) => l.id === listingId);
        if (currentListing && currentListing.number_of_rooms > 0) {
          const numFloors = currentListing.number_of_floors || 1;
          const promises = [];
          for (let rNum = 1; rNum <= currentListing.number_of_rooms; rNum++) {
            const floor = ((rNum - 1) % numFloors) + 1;
            const roomIdx = Math.floor((rNum - 1) / numFloors) + 1;
            const roomNumber = `${floor}${String(roomIdx).padStart(2, "0")}`;
            promises.push(
              createRoom(listingId, {
                room_number: roomNumber,
                room_type: "Single",
                price: 12000,
                floor_number: floor,
                has_attached_bathroom: false,
                has_balcony: false,
              })
            );
          }
          try {
            await Promise.all(promises);
            // Re-fetch rooms from database
            dbRooms = await fetchRooms(listingId);
          } catch (createErr) {
            console.error("Failed to auto-populate rooms", createErr);
          }
        }
      }

      const mappedRooms: Room[] = dbRooms.map((r: any) => ({
        id: r.id.toString(),
        name: `Room ${r.room_number}`,
        type: r.room_type,
        price: r.price,
        views: 0,
        status: r.is_available ? "Available" : "Occupied",
        maxSharing: r.max_sharing !== undefined && r.max_sharing !== null ? r.max_sharing : (r.room_type === "Shared" ? 2 : 1),
        slotsTaken: r.slots_taken !== undefined && r.slots_taken !== null ? r.slots_taken : (r.is_available ? 0 : 1),
      }));
      setRooms(mappedRooms);

      // Fetch visits
      const dbVisits = await fetchPropertyVisits(listingId);
      const mappedVisits: VisitRequest[] = dbVisits.map((v: any) => ({
        id: v.id.toString(),
        studentName: v.student_name,
        room: v.room_name || "Any Room",
        requestedDate: v.requested_date,
        status: v.status
      }));
      setVisitRequests(mappedVisits);

      // Fetch bookings
      const dbBookings = await fetchPropertyBookings(listingId);
      const mappedBookings: BookingRequest[] = dbBookings.map((b: any) => ({
        id: b.id.toString(),
        studentName: b.student_name,
        room: b.room_name,
        requestedDate: b.requested_date,
        status: b.status
      }));
      setBookingRequests(mappedBookings);

      // Fetch reviews
      try {
        const reviewsData = await fetchPropertyReviews(listingId);
        setReviews(reviewsData);
      } catch (revErr) {
        console.warn("Failed to load reviews for dashboard", revErr);
      }
    } catch (err) {
      console.error("Failed to load dashboard data for property", err);
    }
  };

  useEffect(() => {
    const loadListings = async () => {
      try {
        const data = await fetchMyListings();
        setListings(data);
      } catch (error) {
        console.error("Failed to load owner listings", error);
      }
    };

    loadListings();
    const interval = setInterval(loadListings, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (listings.length > 0 && selectedListingId === null) {
      setSelectedListingId(listings[0].id);
    }
  }, [listings, selectedListingId]);

  useEffect(() => {
    if (selectedListingId !== null) {
      refreshDashboardData(selectedListingId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedListingId]);

  const totalViews = rooms.reduce((sum, room) => sum + room.views, 0);
  const activeBookings = rooms.filter(
    (room) => room.status === "Occupied",
  ).length;
  const availableRooms = rooms.filter(
    (room) => room.status === "Available",
  ).length;
  const pendingInquiries = visitRequests.filter(
    (req) => req.status === "pending",
  ).length + bookingRequests.filter(
    (req) => req.status === "pending",
  ).length;

  const toggleRoomStatus = async (roomId: string) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) return;
    try {
      const nextAvailable = targetRoom.status === "Occupied";
      await toggleRoomApi(roomId, nextAvailable);
      if (selectedListingId !== null) {
        await refreshDashboardData(selectedListingId);
      }
      addToast("Room availability toggled successfully!", "success");
    } catch (err) {
      console.error("Failed to toggle room status", err);
      addToast("Failed to toggle room status.", "error");
    }
  };

  const handleVisitRequest = async (
    requestId: string,
    action: "accept" | "decline",
  ) => {
    try {
      await updateVisitRequestStatus(requestId, action === "accept" ? "accepted" : "declined");
      if (selectedListingId !== null) {
        await refreshDashboardData(selectedListingId);
      }
      addToast(`Visit request ${action}ed!`, "success");
    } catch (err) {
      console.error("Failed to handle visit request", err);
      addToast("Failed to update visit request.", "error");
    }
  };

  const handleBookingRequest = async (
    requestId: string,
    action: "accept" | "decline",
  ) => {
    try {
      await updateBookingRequestStatus(requestId, action === "accept" ? "accepted" : "declined");
      
      if (action === "accept") {
        const targetReq = bookingRequests.find((r) => r.id === requestId);
        if (targetReq) {
          const roomToUpdate = rooms.find((rm) => rm.name === targetReq.room);
          if (roomToUpdate) {
            await toggleRoomApi(roomToUpdate.id, false);
          }
        }
      }

      if (selectedListingId !== null) {
        await refreshDashboardData(selectedListingId);
      }
      addToast(`Booking request ${action}ed!`, "success");
    } catch (err) {
      console.error("Failed to handle booking request", err);
      addToast("Failed to update booking request.", "error");
    }
  };

  const handleSubmitReply = async (reviewId: number) => {
    const text = replyTextStore[reviewId]?.trim();
    if (!text) {
      addToast("Reply text cannot be empty.", "warning");
      return;
    }

    setSubmittingReplies((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await replyToReview(reviewId, text);
      addToast("Reply submitted successfully!", "success");
      setReplyTextStore((prev) => ({ ...prev, [reviewId]: "" }));
      if (selectedListingId !== null) {
        await refreshDashboardData(selectedListingId);
      }
    } catch (err: any) {
      console.error("Failed to submit reply", err);
      const msg = err.response?.data?.detail || "Failed to submit reply.";
      addToast(msg, "error");
    } finally {
      setSubmittingReplies((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleAddRoom = async () => {
    if (!newRoomForm.name || !newRoomForm.price || selectedListingId === null) {
      addToast("Please fill in all required fields", "warning");
      return;
    }

    const cleanRoomNum = newRoomForm.name.replace(/room\s*/i, "").trim();

    try {
      await createRoom(selectedListingId, {
        room_number: cleanRoomNum,
        room_type: newRoomForm.type,
        price: parseInt(newRoomForm.price),
        floor_number: 1,
        has_attached_bathroom: false,
        has_balcony: false,
        max_sharing: newRoomForm.type === "Shared" ? parseInt(newRoomForm.maxSharing) : 1,
        slots_taken: newRoomForm.type === "Shared" ? parseInt(newRoomForm.slotsTaken) : 0
      });
      await refreshDashboardData(selectedListingId);
      setNewRoomForm({ name: "", type: "Single", price: "", description: "", maxSharing: "2", slotsTaken: "0" });
      setShowAddRoomModal(false);
      addToast("Room added successfully!", "success");
    } catch (err) {
      console.error("Failed to add room", err);
      addToast("Failed to add room.", "error");
    }
  };

  const openEditModal = (room: Room) => {
    setSelectedRoomId(room.id);
    const getCleanType = (typeStr: string) => {
      const lower = typeStr.toLowerCase();
      if (lower.includes("single")) return "Single";
      if (lower.includes("shared")) return "Shared";
      if (lower.includes("studio")) return "Studio";
      if (lower.includes("double")) return "Double";
      return typeStr;
    };
    setEditRoomForm({
      name: room.name,
      type: getCleanType(room.type),
      price: room.price.toString(),
      description: "",
      maxSharing: (room.maxSharing ?? 2).toString(),
      slotsTaken: (room.slotsTaken ?? 0).toString(),
    });
    setShowEditRoomModal(true);
  };

  const handleEditRoom = async () => {
    if (!editRoomForm.name || !editRoomForm.price || !selectedRoomId || selectedListingId === null) {
      addToast("Please fill in all required fields", "warning");
      return;
    }

    const cleanRoomNum = editRoomForm.name.replace(/room\s*/i, "").trim();

    try {
      await updateRoom(selectedRoomId, {
        room_number: cleanRoomNum,
        room_type: editRoomForm.type,
        price: parseInt(editRoomForm.price),
        max_sharing: editRoomForm.type === "Shared" ? parseInt(editRoomForm.maxSharing) : 1,
        slots_taken: editRoomForm.type === "Shared" ? parseInt(editRoomForm.slotsTaken) : 0
      });
      await refreshDashboardData(selectedListingId);
      setEditRoomForm({ name: "", type: "Single", price: "", description: "", maxSharing: "2", slotsTaken: "0" });
      setSelectedRoomId(null);
      setShowEditRoomModal(false);
      addToast("Room updated successfully!", "success");
    } catch (err) {
      console.error("Failed to edit room", err);
      addToast("Failed to update room.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Owner Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your boarding rooms and track performance
            </p>
          </div>
          <button
            onClick={() => navigate("/list-property")}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            List New Property
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">My Boarding Listings</h2>
              <p className="text-sm text-gray-600">Properties you have submitted for admin review</p>
            </div>
            <span className="text-sm text-gray-500">{listings.length} total</span>
          </div>

          {listings.length === 0 ? (
            <p className="text-gray-500 text-sm">You have not submitted any boarding listings yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <button
                  key={listing.id}
                  onClick={() => setSelectedListingId(listing.id)}
                  className={`text-left rounded-lg border p-4 transition ${selectedListingId === listing.id
                      ? "border-blue-500 bg-blue-50/70 shadow-sm"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{listing.property_name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{listing.location}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${(!listing.status || listing.status.toLowerCase() === 'pending')
                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                        : (listing.status.toLowerCase() === 'verified' || listing.status.toLowerCase() === 'approved')
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-100 text-gray-700 border-transparent'
                      }`}>
                      {listing.status ? listing.status.toLowerCase() : 'pending'}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    {listing.number_of_rooms} rooms · {listing.number_of_floors} floors
                  </div>
                  {listing.status === "rejected" && listing.rejection_reason && (
                    <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                      <p className="font-semibold mb-1">Rejected by admin</p>
                      <p>{listing.rejection_reason}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedListingId !== null ? (
          <>
            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <Eye className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {totalViews.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">Total Views</p>
                <p className="text-xs text-green-600 mt-2">+12% from last month</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{activeBookings}</p>
                <p className="text-sm text-gray-600 mt-1">Active Bookings</p>
                <p className="text-xs text-gray-500 mt-2">
                  Out of {rooms.length} total rooms
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <Home className="w-8 h-8 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{availableRooms}</p>
                <p className="text-sm text-gray-600 mt-1">Available Rooms</p>
                <p className="text-xs text-blue-600 mt-2">Ready for booking</p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <MessageSquare className="w-8 h-8 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {pendingInquiries}
                </p>
                <p className="text-sm text-gray-600 mt-1">Pending Inquiries</p>
                <p className="text-xs text-orange-600 mt-2">Awaiting response</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* My Rooms Section */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">
                      Boarding Rooms
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={openManageImages}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium"
                      >
                        <ImageIcon className="w-4 h-4 text-gray-500" />
                        Manage Photos
                      </button>
                      <button
                        onClick={() => setShowAddRoomModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Add Room
                      </button>
                    </div>
                  </div>

                  {/* Table Header */}
                  <div className="px-6 py-3 bg-gray-50 grid grid-cols-6 gap-4 text-sm font-medium text-gray-600">
                    <div className="col-span-2">Room Details</div>
                    <div>Price</div>
                    <div>Views</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>

                  {/* Room List */}
                  <div className="divide-y divide-gray-200">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className="px-6 py-4 grid grid-cols-6 gap-4 items-center hover:bg-gray-50 transition"
                      >
                        <div className="col-span-2 flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <Home className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {room.name}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1.5 flex-wrap">
                              {room.type}
                              {room.type.toLowerCase().includes("shared") && room.maxSharing !== undefined && (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                                  {room.slotsTaken ?? 0}/{room.maxSharing} filled
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="text-gray-900 font-medium">
                          LKR {room.price.toLocaleString()}
                        </div>

                        <div className="text-gray-600">{room.views}</div>

                        <div>
                          <button
                            onClick={() => toggleRoomStatus(room.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${room.status === "Occupied"
                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                              }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${room.status === "Occupied"
                                  ? "bg-gray-600"
                                  : "bg-green-600"
                                }`}
                            ></div>
                            {room.status}
                          </button>
                        </div>

                        <div>
                          <button
                            onClick={() => openEditModal(room)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                          >
                            <Pencil className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Requests Section */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                      onClick={() => setActiveTab("visit")}
                      className={`flex-1 py-3 text-center font-semibold text-sm transition-all border-b-2 ${activeTab === "visit"
                          ? "border-blue-600 text-blue-600 bg-white"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      Visits ({visitRequests.filter(r => r.status === "pending").length})
                    </button>
                    <button
                      onClick={() => setActiveTab("booking")}
                      className={`flex-1 py-3 text-center font-semibold text-sm transition-all border-b-2 ${activeTab === "booking"
                          ? "border-blue-600 text-blue-600 bg-white"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      Bookings ({bookingRequests.filter(r => r.status === "pending").length})
                    </button>
                    <button
                      onClick={() => setActiveTab("reviews")}
                      className={`flex-1 py-3 text-center font-semibold text-sm transition-all border-b-2 ${activeTab === "reviews"
                          ? "border-blue-600 text-blue-600 bg-white"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      Reviews ({reviews.length})
                    </button>
                  </div>

                  <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                    {activeTab === "visit" ? (
                      visitRequests
                        .filter((req) => req.status === "pending")
                        .map((request) => (
                          <div key={request.id} className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                {request.studentName.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {request.studentName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {request.room}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Requested visit on {request.requestedDate}
                                </p>
                              </div>
                              <span className="text-xs text-gray-400">2d ago</span>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleVisitRequest(request.id, "accept")
                                }
                                className="flex-1 py-2 px-3 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() =>
                                  handleVisitRequest(request.id, "decline")
                                }
                                className="flex-1 py-2 px-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))
                    ) : activeTab === "booking" ? (
                      bookingRequests
                        .filter((req) => req.status === "pending")
                        .map((request) => (
                          <div key={request.id} className="p-4">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                                {request.studentName.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {request.studentName}
                                </p>
                                <p className="text-sm text-gray-600 font-medium text-blue-600">
                                  {request.room}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Requested booking on {request.requestedDate}
                                </p>
                              </div>
                              <span className="text-xs text-gray-400">1d ago</span>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleBookingRequest(request.id, "accept")
                                }
                                className="flex-1 py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() =>
                                  handleBookingRequest(request.id, "decline")
                                }
                                className="flex-1 py-2 px-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="p-4 border-b last:border-b-0 space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {review.reviewer_role === "owner" ? "Verified Owner" : "Verified Student"}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                By: {review.reviewer_name || "Anonymous"} ({review.reviewer_email || "N/A"})
                              </p>
                              <div className="flex text-yellow-500 my-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3.5 h-3.5 ${star <= review.rating ? "fill-current" : "text-gray-300"}`}
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {review.comment && (
                            <p className="text-gray-700 text-xs italic leading-relaxed">{review.comment}</p>
                          )}

                          {review.media && review.media.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                              {review.media.map((med: any) => (
                                <a
                                  key={med.id}
                                  href={med.public_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-10 w-10 overflow-hidden rounded border border-gray-200"
                                >
                                  {med.mime_type.startsWith("image/") ? (
                                    <img
                                      src={med.public_url}
                                      alt="Attachment"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full bg-gray-900 flex items-center justify-center text-white text-[8px]">
                                      Video
                                    </div>
                                  )}
                                </a>
                              ))}
                            </div>
                          )}

                          {review.reply ? (
                            <div className="bg-blue-50 border-l-2 border-blue-500 p-2.5 rounded-r text-xs space-y-0.5">
                              <p className="font-semibold text-blue-900">Your reply:</p>
                              <p className="text-blue-950">{review.reply.reply}</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <textarea
                                value={replyTextStore[review.id] || ""}
                                onChange={(e) =>
                                  setReplyTextStore((prev) => ({ ...prev, [review.id]: e.target.value }))
                                }
                                placeholder="Write a response..."
                                rows={2}
                                className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                              />
                              <button
                                onClick={() => handleSubmitReply(review.id)}
                                disabled={submittingReplies[review.id] || !(replyTextStore[review.id]?.trim())}
                                className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded text-xs font-semibold transition"
                              >
                                {submittingReplies[review.id] ? "Submitting..." : "Submit Response"}
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {activeTab === "visit" && visitRequests.filter((req) => req.status === "pending").length === 0 && (
                      <div className="p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">
                          No pending visit inquiries
                        </p>
                      </div>
                    )}

                    {activeTab === "booking" && bookingRequests.filter((req) => req.status === "pending").length === 0 && (
                      <div className="p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">
                          No pending booking requests
                        </p>
                      </div>
                    )}

                    {activeTab === "reviews" && reviews.length === 0 && (
                      <div className="p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">
                          No reviews left for this property yet.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="px-6 py-3 border-t border-gray-200 text-center">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                      View All Inquiries
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-pulse" />
            <p className="text-gray-500 text-sm">
              Please select a boarding listing from above to view and manage its rooms and requests.
            </p>
          </div>
        )}
      </div>

      <Footer />

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Room</h2>
              <button
                onClick={() => setShowAddRoomModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Room Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name/Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Room 301"
                  value={newRoomForm.name}
                  onChange={(e) =>
                    setNewRoomForm({ ...newRoomForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type *
                </label>
                <select
                  value={newRoomForm.type}
                  onChange={(e) =>
                    setNewRoomForm({ ...newRoomForm, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Single">Single Room</option>
                  <option value="Shared">Shared Room</option>
                  <option value="Studio">Studio</option>
                  <option value="Double">Double Room</option>
                </select>
              </div>

              {/* Shared Room Slots */}
              {newRoomForm.type === "Shared" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Beds (Capacity) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newRoomForm.maxSharing}
                      onChange={(e) =>
                        setNewRoomForm({ ...newRoomForm, maxSharing: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Beds Filled (Slots Taken) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={newRoomForm.maxSharing}
                      value={newRoomForm.slotsTaken}
                      onChange={(e) =>
                        setNewRoomForm({ ...newRoomForm, slotsTaken: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Price (LKR) *
                </label>
                <input
                  type="number"
                  placeholder="e.g., 15000"
                  value={newRoomForm.price}
                  onChange={(e) =>
                    setNewRoomForm({ ...newRoomForm, price: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Add details about the room..."
                  value={newRoomForm.description}
                  onChange={(e) =>
                    setNewRoomForm({
                      ...newRoomForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddRoomModal(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRoom}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Room</h3>
              <button
                onClick={() => {
                  setShowEditRoomModal(false);
                  setSelectedRoomId(null);
                  setEditRoomForm({
                    name: "",
                    type: "Single",
                    price: "",
                    description: "",
                    maxSharing: "2",
                    slotsTaken: "0",
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Room 101"
                value={editRoomForm.name}
                onChange={(e) =>
                  setEditRoomForm({ ...editRoomForm, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Room Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Type
              </label>
              <select
                value={editRoomForm.type}
                onChange={(e) =>
                  setEditRoomForm({ ...editRoomForm, type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Single">Single</option>
                <option value="Shared">Shared</option>
                <option value="Studio">Studio</option>
                <option value="Double">Double</option>
              </select>
            </div>

            {/* Shared Room Slots */}
            {editRoomForm.type === "Shared" && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Beds (Capacity) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editRoomForm.maxSharing}
                    onChange={(e) =>
                      setEditRoomForm({ ...editRoomForm, maxSharing: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beds Filled (Slots Taken) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={editRoomForm.maxSharing}
                    value={editRoomForm.slotsTaken}
                    onChange={(e) =>
                      setEditRoomForm({ ...editRoomForm, slotsTaken: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Monthly Price */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Price (LKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 15000"
                value={editRoomForm.price}
                onChange={(e) =>
                  setEditRoomForm({ ...editRoomForm, price: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Add details about the room..."
                value={editRoomForm.description}
                onChange={(e) =>
                  setEditRoomForm({
                    ...editRoomForm,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditRoomModal(false);
                  setSelectedRoomId(null);
                  setEditRoomForm({
                    name: "",
                    type: "Single",
                    price: "",
                    description: "",
                    maxSharing: "2",
                    slotsTaken: "0",
                  });
                }}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditRoom}
                className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Images Modal */}
      {showManageImagesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manage Property Photos</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Upload photos of your boarding place. JPEG, PNG, and WebP are allowed (Max 5MB).
                </p>
              </div>
              <button
                onClick={() => setShowManageImagesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Images Grid */}
            <div className="flex-1 overflow-y-auto mb-6">
              {loadingImages ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span>Loading photos...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Upload Card */}
                  <label className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition h-40 relative">
                    {uploadingImage ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                        <span className="text-xs text-gray-500">Uploading...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm font-semibold text-gray-900">Add Photo</span>
                        <span className="text-xs text-gray-500 mt-1">Click to browse</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleUploadImage}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>

                  {/* Existing Images */}
                  {listingImages.map((image) => (
                    <div
                      key={image.id}
                      className="group relative rounded-xl overflow-hidden bg-gray-100 border border-gray-200 h-40 shadow-sm"
                    >
                      <img
                        src={image.url}
                        alt="Property photo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <button
                          onClick={() => handleDeleteImage(image.id)}
                          className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition shadow-md hover:scale-105"
                          title="Delete photo"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loadingImages && listingImages.length === 0 && (
                <div className="text-center py-12 border rounded-xl bg-gray-50 mt-4">
                  <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No photos uploaded yet. Click above to add some!</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4 flex justify-end">
              <button
                onClick={() => setShowManageImagesModal(false)}
                className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
