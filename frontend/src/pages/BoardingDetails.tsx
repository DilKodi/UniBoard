import { useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  Star,
  Wifi,
  DoorOpen,
  Laptop,
  Utensils,
  Wind,
  Car,
  Tv,
  Shirt,
  MapPin,
  Calendar,
  Bookmark,
  Phone,
  Mail,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface Room {
  id: string;
  roomNumber: string;
  type: string;
  isAvailable: boolean;
  price: number;
}

interface BoardingPlace {
  id: string;
  name: string;
  nearestUniversity: string;
  distance: number;
  distanceUnit: string;
  price: number;
  rating: number;
  roomType: string;
  amenities: string[];
  icon: string;
  coordinates: { lat: number; lng: number };
  rooms?: Room[];
}

export default function BoardingDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showContactModal, setShowContactModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Get boarding data from navigation state
  const boardingData = location.state?.boarding as BoardingPlace;

  // Fallback mock data if no state is passed
  const defaultBoarding = {
    id: "1",
    name: "Colombo Boarding - Nugegoda",
    nearestUniversity: "University of Colombo",
    distance: 0.8,
    distanceUnit: "km from campus",
    price: 12500,
    rating: 4.5,
    roomType: "Single Room",
    amenities: ["WiFi", "Meals"],
    rooms: [
      {
        id: "r1",
        roomNumber: "101",
        type: "Single",
        isAvailable: true,
        price: 12500,
      },
      {
        id: "r2",
        roomNumber: "102",
        type: "Single",
        isAvailable: false,
        price: 12500,
      },
      {
        id: "r3",
        roomNumber: "103",
        type: "Single",
        isAvailable: true,
        price: 12500,
      },
      {
        id: "r4",
        roomNumber: "201",
        type: "Shared",
        isAvailable: true,
        price: 8500,
      },
      {
        id: "r5",
        roomNumber: "202",
        type: "Shared",
        isAvailable: false,
        price: 8500,
      },
      {
        id: "r6",
        roomNumber: "203",
        type: "Shared",
        isAvailable: true,
        price: 8500,
      },
      {
        id: "r7",
        roomNumber: "301",
        type: "Studio",
        isAvailable: false,
        price: 15000,
      },
      {
        id: "r8",
        roomNumber: "302",
        type: "Studio",
        isAvailable: true,
        price: 15000,
      },
    ],
  };

  const boardingPlace = boardingData || defaultBoarding;

  // Map amenities to full details with icons
  const getAmenityIcon = (amenity: string) => {
    const amenityMap: Record<string, ReactNode> = {
      WiFi: <Wifi className="w-6 h-6" />,
      Meals: <Utensils className="w-6 h-6" />,
      Gym: <Shirt className="w-6 h-6" />,
      "Study Hall": <Laptop className="w-6 h-6" />,
    };
    return amenityMap[amenity] || <Star className="w-6 h-6" />;
  };

  const amenitiesWithIcons = [
    ...boardingPlace.amenities.map((amenity) => ({
      icon: getAmenityIcon(amenity),
      label: amenity,
    })),
    { icon: <DoorOpen className="w-6 h-6" />, label: "Attached Bathroom" },
    { icon: <Wind className="w-6 h-6" />, label: "AC Available" },
    { icon: <Car className="w-6 h-6" />, label: "Secure Parking" },
    { icon: <Tv className="w-6 h-6" />, label: "Common TV" },
  ];

  const boarding = {
    id: boardingPlace.id,
    title: boardingPlace.name,
    distance: `${boardingPlace.distance} ${boardingPlace.distanceUnit}`,
    price: boardingPlace.price,
    safetyScore: boardingPlace.rating,
    isVerified: true,
    owner: {
      name: "Nimal Perera",
      role: "Property Owner",
      avatar: "",
      phone: "+94 77 123 4567",
      email: "nimal.perera@example.com",
    },
    images: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&h=600&fit=crop",
    ],
    description: `Comfortable boarding house located within walking distance to campus. Perfect for students seeking a quiet study environment with all essential amenities. The property features spacious rooms with natural lighting and proper ventilation. Room Type: ${boardingPlace.roomType}.`,
    amenities: amenitiesWithIcons,
  };

  const handleRequestVisit = () => {
    if (!selectedRoomId) {
      alert("Please select an available room first!");
      return;
    }
    const room = boardingPlace.rooms?.find((r) => r.id === selectedRoomId);
    alert(
      `Visit request sent for Room ${room?.roomNumber}! The owner will contact you soon.`,
    );
  };

  const handleBookNow = () => {
    if (!selectedRoomId) {
      alert("Please select an available room first!");
      return;
    }
    const room = boardingPlace.rooms?.find((r) => r.id === selectedRoomId);
    alert(
      `Booking request sent for Room ${room?.roomNumber}! Please wait for owner confirmation.`,
    );
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === boarding.images.length - 1 ? 0 : prev + 1,
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? boarding.images.length - 1 : prev - 1,
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Header Navigation */}
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
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery Slideshow */}
            <div className="relative rounded-xl overflow-hidden h-96 bg-gray-900 group">
              <img
                src={boarding.images[currentImageIndex]}
                alt={`${boarding.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Navigation Arrows */}
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6 text-gray-900" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6 text-gray-900" />
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {boarding.images.length}
              </div>

              {/* Thumbnail Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {boarding.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? "bg-white w-8"
                        : "bg-white/50 hover:bg-white/75"
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Property Title and Info */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {boarding.title}
                  </h1>
                  <p className="text-gray-600 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {boarding.distance}
                  </p>
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <Star className="w-5 h-5 text-blue-600" />
                    Nearest University:{" "}
                    <span className="font-semibold text-gray-900">
                      {boardingPlace.nearestUniversity}
                    </span>
                  </p>
                </div>

                <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <Bookmark className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-4 mt-4">
                {boarding.isVerified && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <Shield className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-semibold">
                      Verified Owner
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-gray-900 font-semibold">
                    {boarding.safetyScore}
                    <span className="text-gray-600 text-sm ml-1">
                      /5 Safety Score
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Available Rooms Section */}
            {boardingPlace.rooms && boardingPlace.rooms.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Available Rooms
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  Click on an available room to select it before requesting a
                  visit
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {boardingPlace.rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => {
                        if (room.isAvailable) {
                          setSelectedRoomId(
                            selectedRoomId === room.id ? null : room.id,
                          );
                        }
                      }}
                      disabled={!room.isAvailable}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        !room.isAvailable
                          ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-50"
                          : selectedRoomId === room.id
                            ? "bg-green-50 border-green-500 shadow-md"
                            : "bg-white border-gray-300 hover:border-green-400 hover:bg-green-50 cursor-pointer"
                      }`}
                    >
                      <div className="font-bold text-lg text-gray-900">
                        Room {room.roomNumber}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {room.type}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mt-2">
                        LKR {room.price.toLocaleString()}
                      </div>
                      <div
                        className={`text-xs font-semibold mt-2 ${
                          room.isAvailable ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {room.isAvailable ? "✓ Available" : "✕ Filled"}
                      </div>
                      {selectedRoomId === room.id && (
                        <div className="text-xs text-green-600 mt-2 font-semibold">
                          Selected
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Facilities & Amenities */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Facilities & Amenities
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {boarding.amenities.map((amenity, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition"
                  >
                    <div className="text-gray-700 mb-2">{amenity.icon}</div>
                    <span className="text-sm font-medium text-gray-900 text-center">
                      {amenity.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Description
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {boarding.description}
              </p>
            </div>
          </div>

          {/* Right Column - Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24 space-y-6">
              {/* Price */}
              <div className="border-b border-gray-200 pb-4">
                <p className="text-3xl font-bold text-gray-900">
                  LKR {boarding.price.toLocaleString()}
                </p>
                <p className="text-gray-600 text-sm">per month</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleRequestVisit}
                  className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 font-semibold"
                >
                  <Calendar className="w-5 h-5" />
                  Request Visit
                </button>
                <button
                  onClick={handleBookNow}
                  className="w-full py-3 px-4 bg-white text-gray-900 border-2 border-gray-900 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 font-semibold"
                >
                  <Bookmark className="w-5 h-5" />
                  Book Now
                </button>
              </div>

              {/* Owner Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Owner Information
                </h3>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {boarding.owner.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {boarding.owner.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {boarding.owner.role}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowContactModal(true)}
                  className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium"
                >
                  <Phone className="w-4 h-4" />
                  Contact Owner
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Contact Owner
              </h2>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">
                    {boarding.owner.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">
                    {boarding.owner.email}
                  </p>
                </div>
              </div>

              <button className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-medium">
                <MessageSquare className="w-5 h-5" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
