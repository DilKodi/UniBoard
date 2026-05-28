import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Home,
  Building,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { demoBoardingPlaces } from "../data/demoBoardingPlaces";
import {
  matchesUniversitySearch,
  universitySearchOptions,
} from "../data/universities";

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

// Custom marker icons
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

const blueIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Room {
  id: string;
  roomNumber: string;
  type: string;
  isAvailable: boolean;
  price: number;
}

interface BoardingPlace {
  id: string | number;
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
  images?: string[];
  description?: string;
  demo?: boolean;
}

const mockBoardingPlaces: BoardingPlace[] = [
  {
    id: "1",
    name: "Sunrise Student Lodge",
    nearestUniversity: "University of Moratuwa",
    distance: 0.5,
    distanceUnit: "km from campus",
    price: 9000,
    rating: 4.8,
    roomType: "Single Room",
    amenities: ["WiFi", "Security"],
    icon: "home",
    coordinates: { lat: 6.7964, lng: 79.9006 },
    rooms: [
      {
        id: "r1",
        roomNumber: "101",
        type: "Single",
        isAvailable: true,
        price: 9000,
      },
      {
        id: "r2",
        roomNumber: "102",
        type: "Single",
        isAvailable: false,
        price: 9000,
      },
      {
        id: "r3",
        roomNumber: "103",
        type: "Single",
        isAvailable: true,
        price: 9000,
      },
    ],
  },
  {
    id: "2",
    name: "Campus View Hostel",
    nearestUniversity: "University of Colombo",
    distance: 1.5,
    distanceUnit: "km from campus",
    price: 12000,
    rating: 4.6,
    roomType: "Shared",
    amenities: ["Meals", "WiFi"],
    icon: "building",
    coordinates: { lat: 6.902, lng: 79.8608 },
    rooms: [
      {
        id: "r4",
        roomNumber: "201",
        type: "Shared",
        isAvailable: true,
        price: 12000,
      },
      {
        id: "r5",
        roomNumber: "202",
        type: "Shared",
        isAvailable: true,
        price: 12000,
      },
      {
        id: "r6",
        roomNumber: "203",
        type: "Shared",
        isAvailable: false,
        price: 12000,
      },
    ],
  },
  {
    id: "3",
    name: "Elite Student Residence",
    nearestUniversity: "University of Moratuwa",
    distance: 3,
    distanceUnit: "km from campus",
    price: 18000,
    rating: 4.9,
    roomType: "Studio",
    amenities: ["Gym", "WiFi", "Security"],
    icon: "building2",
    coordinates: { lat: 6.795, lng: 79.9 },
    rooms: [
      {
        id: "r7",
        roomNumber: "301",
        type: "Studio",
        isAvailable: false,
        price: 18000,
      },
      {
        id: "r8",
        roomNumber: "302",
        type: "Studio",
        isAvailable: true,
        price: 18000,
      },
      {
        id: "r9",
        roomNumber: "303",
        type: "Studio",
        isAvailable: true,
        price: 18000,
      },
    ],
  },
  {
    id: "4",
    name: "Scholar's Den",
    nearestUniversity: "University of Peradeniya",
    distance: 0.8,
    distanceUnit: "km from campus",
    price: 7500,
    rating: 4.7,
    roomType: "Single Room",
    amenities: ["WiFi", "Security"],
    icon: "home2",
    coordinates: { lat: 7.2579, lng: 80.5975 },
    rooms: [
      {
        id: "r10",
        roomNumber: "401",
        type: "Single",
        isAvailable: true,
        price: 7500,
      },
      {
        id: "r11",
        roomNumber: "402",
        type: "Single",
        isAvailable: true,
        price: 7500,
      },
    ],
  },
  {
    id: "5",
    name: "Comfort Student Home",
    nearestUniversity: "University of Colombo",
    distance: 4.5,
    distanceUnit: "km from campus",
    price: 14000,
    rating: 4.5,
    roomType: "Shared",
    amenities: ["Meals", "Gym", "Security"],
    icon: "home",
    coordinates: { lat: 6.903, lng: 79.862 },
    rooms: [
      {
        id: "r12",
        roomNumber: "501",
        type: "Shared",
        isAvailable: true,
        price: 14000,
      },
      {
        id: "r13",
        roomNumber: "502",
        type: "Shared",
        isAvailable: false,
        price: 14000,
      },
      {
        id: "r14",
        roomNumber: "503",
        type: "Shared",
        isAvailable: true,
        price: 14000,
      },
      {
        id: "r15",
        roomNumber: "504",
        type: "Shared",
        isAvailable: false,
        price: 14000,
      },
    ],
  },
  {
    id: "6",
    name: "Academic Plaza",
    nearestUniversity: "University of Kelaniya",
    distance: 2.5,
    distanceUnit: "km from campus",
    price: 21000,
    rating: 4.8,
    roomType: "Studio",
    amenities: ["WiFi", "Gym", "Security"],
    icon: "building",
    coordinates: { lat: 6.955, lng: 79.91 },
    rooms: [
      {
        id: "r16",
        roomNumber: "601",
        type: "Studio",
        isAvailable: true,
        price: 21000,
      },
      {
        id: "r17",
        roomNumber: "602",
        type: "Studio",
        isAvailable: true,
        price: 21000,
      },
      {
        id: "r18",
        roomNumber: "603",
        type: "Studio",
        isAvailable: false,
        price: 21000,
      },
    ],
  },
  {
    id: "7",
    name: "J'pura Residence",
    nearestUniversity: "University of Sri Jayewardenepura",
    distance: 1.2,
    distanceUnit: "km from campus",
    price: 13500,
    rating: 4.4,
    roomType: "Shared",
    amenities: ["Meals", "WiFi", "Security"],
    icon: "home",
    coordinates: { lat: 6.8766, lng: 79.9217 },
    rooms: [
      {
        id: "r19",
        roomNumber: "701",
        type: "Shared",
        isAvailable: true,
        price: 13500,
      },
      {
        id: "r20",
        roomNumber: "702",
        type: "Shared",
        isAvailable: true,
        price: 13500,
      },
      {
        id: "r21",
        roomNumber: "703",
        type: "Shared",
        isAvailable: false,
        price: 13500,
      },
    ],
  },
  {
    id: "8",
    name: "Moratuwa Budget Stay",
    nearestUniversity: "University of Moratuwa",
    distance: 0.7,
    distanceUnit: "km from campus",
    price: 8500,
    rating: 4.3,
    roomType: "Shared",
    amenities: ["WiFi", "Security"],
    icon: "home",
    coordinates: { lat: 6.797, lng: 79.901 },
    rooms: [
      {
        id: "r22",
        roomNumber: "801",
        type: "Shared",
        isAvailable: true,
        price: 8500,
      },
      {
        id: "r23",
        roomNumber: "802",
        type: "Shared",
        isAvailable: true,
        price: 8500,
      },
      {
        id: "r24",
        roomNumber: "803",
        type: "Shared",
        isAvailable: false,
        price: 8500,
      },
      {
        id: "r25",
        roomNumber: "804",
        type: "Shared",
        isAvailable: true,
        price: 8500,
      },
    ],
  },
  {
    id: "9",
    name: "The Moratuwa Residence",
    nearestUniversity: "University of Moratuwa",
    distance: 0.9,
    distanceUnit: "km from campus",
    price: 16500,
    rating: 4.7,
    roomType: "Single Room",
    amenities: ["WiFi", "Gym", "Meals", "Security"],
    icon: "building",
    coordinates: { lat: 6.7955, lng: 79.902 },
    rooms: [
      {
        id: "r26",
        roomNumber: "901",
        type: "Single",
        isAvailable: true,
        price: 16500,
      },
      {
        id: "r27",
        roomNumber: "902",
        type: "Single",
        isAvailable: false,
        price: 16500,
      },
      {
        id: "r28",
        roomNumber: "903",
        type: "Single",
        isAvailable: true,
        price: 16500,
      },
    ],
  },
  ...demoBoardingPlaces,
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [universityName, setUniversityName] = useState("");
  const [distance, setDistance] = useState("1 km");
  const [priceRange, setPriceRange] = useState("Any");
  const [roomType, setRoomType] = useState("Any");
  const [filters, setFilters] = useState({
    wifiIncluded: false,
    mealsProvided: false,
    gymAccess: false,
    security247: false,
  });

  const handleBoardingClick = (boardingId: string | number) => {
    const selectedBoarding = mockBoardingPlaces.find(
      (place) => place.id.toString() === boardingId.toString(),
    );
    if (selectedBoarding) {
      navigate(`/boarding/${boardingId}`, {
        state: { boarding: selectedBoarding },
      });
    }
  };

  // Filter logic for search functionality
  const getFilteredResults = () => {
    return mockBoardingPlaces.filter((place) => {
      // Filter by university name (exact match)
      if (universityName && !matchesUniversitySearch(universityName, place.nearestUniversity)) {
        return false;
      }

      // Filter by distance
      const maxDistance = parseInt(distance);
      if (place.distance > maxDistance) {
        return false;
      }

      // Filter by price range
      if (priceRange !== "Any") {
        let minPrice = 0,
          maxPrice = Infinity;
        if (priceRange === "LKR 7000-10000") {
          minPrice = 7000;
          maxPrice = 10000;
        } else if (priceRange === "LKR 10000-15000") {
          minPrice = 10000;
          maxPrice = 15000;
        } else if (priceRange === "LKR 15000-20000") {
          minPrice = 15000;
          maxPrice = 20000;
        } else if (priceRange === "LKR 20000+") {
          minPrice = 20000;
        }

        if (place.price < minPrice || place.price > maxPrice) {
          return false;
        }
      }

      // Filter by room type
      if (roomType !== "Any") {
        const roomTypeMap: { [key: string]: string } = {
          Single: "Single Room",
          Shared: "Shared",
          Studio: "Studio",
        };
        if (place.roomType !== roomTypeMap[roomType]) {
          return false;
        }
      }

      // Filter by amenities (quick filters)
      const amenitiesFilter = [
        filters.wifiIncluded && "WiFi",
        filters.mealsProvided && "Meals",
        filters.gymAccess && "Gym",
        filters.security247 && "Security",
      ].filter(Boolean);

      if (amenitiesFilter.length > 0) {
        const hasAllAmenities = amenitiesFilter.every((amenity) =>
          place.amenities.includes(amenity as string),
        );
        if (!hasAllAmenities) {
          return false;
        }
      }

      return true;
    });
  };

  const filteredPlaces = getFilteredResults();

  const getIconColor = (index: number) => {
    const colors = [
      "text-blue-500",
      "text-green-500",
      "text-purple-500",
      "text-orange-500",
    ];
    return colors[index % colors.length];
  };

  const getIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case "home":
        return <Home className={className} />;
      case "building":
        return <Building className={className} />;
      case "building2":
        return <Building className={className} />;
      case "home2":
        return <Home className={className} />;
      default:
        return <Home className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Find Boarding Places Near Your University
        </h1>
        <p className="text-gray-600">
          Discover comfortable and affordable boarding options within walking
          distance of your campus.
        </p>
      </div>

      {/* Filter Bar - Pinned */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex gap-4 items-end">
          {/* University Name */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              University Name
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Enter university name..."
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                list="university-suggestions"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <datalist id="university-suggestions">
                {universitySearchOptions.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Distance */}
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distance (km)
            </label>
            <select
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>1 km</option>
              <option>2 km</option>
              <option>3 km</option>
              <option>5 km</option>
              <option>10 km</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range
            </label>
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Any</option>
              <option>LKR 7000-10000</option>
              <option>LKR 10000-15000</option>
              <option>LKR 15000-20000</option>
              <option>LKR 20000+</option>
            </select>
          </div>

          {/* Room Type */}
          <div className="w-48">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Type
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Any</option>
              <option>Single</option>
              <option>Shared</option>
              <option>Studio</option>
            </select>
          </div>

          {/* Search Button */}
          <button className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium">
            <Search className="w-5 h-5" />
            Search
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-250px)]">
        {/* Left Side - Results */}
        <div className="w-1/2 overflow-y-auto px-8 py-6">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Available Boarding Places
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredPlaces.length} results found
              </p>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Quick Filters
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.wifiIncluded}
                  onChange={(e) =>
                    setFilters({ ...filters, wifiIncluded: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">WiFi Included</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.mealsProvided}
                  onChange={(e) =>
                    setFilters({ ...filters, mealsProvided: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Meals Provided</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.gymAccess}
                  onChange={(e) =>
                    setFilters({ ...filters, gymAccess: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Gym Access</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.security247}
                  onChange={(e) =>
                    setFilters({ ...filters, security247: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">24/7 Security</span>
              </label>
            </div>
          </div>

          {/* Boarding Places List */}
          <div className="space-y-4">
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map((place, index) => (
                <div
                  key={place.id}
                  onClick={() => handleBoardingClick(place.id)}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`p-3 rounded-lg bg-opacity-10 ${getIconColor(index)} bg-current`}
                    >
                      {getIcon(place.icon, `w-6 h-6 ${getIconColor(index)}`)}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {place.name}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4" />
                            {place.distance} {place.distanceUnit}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-semibold text-gray-900">
                            {place.rating}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <p className="text-2xl font-bold text-gray-900">
                            LKR {place.price.toLocaleString()}
                            <span className="text-sm font-normal text-gray-600">
                              /month
                            </span>
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                              {place.roomType}
                            </span>
                            {place.amenities.map((amenity, i) => (
                              <span
                                key={i}
                                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your filters or search criteria
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Map View */}
        <div className="w-1/2 bg-gray-100 border-l border-gray-200 relative">
          <div className="sticky top-0 h-full">
            {/* Map */}
            <MapContainer
              center={[7.8731, 80.7718]}
              zoom={8}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredPlaces.map((place) => (
                <Marker
                  key={place.id}
                  position={[place.coordinates.lat, place.coordinates.lng]}
                  icon={
                    place.name === "Sunrise Student Lodge" ? redIcon : blueIcon
                  }
                >
                  <Popup>
                    <div className="p-1">
                      <h3 className="font-bold text-sm">{place.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {place.nearestUniversity}
                      </p>
                      <p className="text-xs text-gray-600">
                        {place.distance} {place.distanceUnit}
                      </p>
                      <p className="font-semibold text-sm mt-1">
                        LKR {place.price.toLocaleString()}/month
                      </p>
                      <button
                        onClick={() => handleBoardingClick(place.id)}
                        className="mt-2 w-full bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700"
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
