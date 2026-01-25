import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Star,
  Home,
  Building,
  Layers,
  Maximize,
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

const mockBoardingPlaces: BoardingPlace[] = [
  {
    id: "1",
    name: "Sunrise Student Lodge",
    nearestUniversity: "University of Moratuwa",
    distance: 0.5,
    distanceUnit: "km from campus",
    price: 45000,
    rating: 4.8,
    roomType: "Single Room",
    amenities: ["WiFi", "Security"],
    icon: "home",
    coordinates: { lat: 0, lng: 0 },
    rooms: [
      {
        id: "r1",
        roomNumber: "101",
        type: "Single",
        isAvailable: true,
        price: 45000,
      },
      {
        id: "r2",
        roomNumber: "102",
        type: "Single",
        isAvailable: false,
        price: 45000,
      },
      {
        id: "r3",
        roomNumber: "103",
        type: "Single",
        isAvailable: true,
        price: 45000,
      },
    ],
  },
  {
    id: "2",
    name: "Campus View Hostel",
    nearestUniversity: "University of Colombo",
    distance: 0.8,
    distanceUnit: "km from campus",
    price: 38000,
    rating: 4.6,
    roomType: "Shared",
    amenities: ["Meals", "WiFi"],
    icon: "building",
    coordinates: { lat: 0, lng: 0 },
    rooms: [
      {
        id: "r4",
        roomNumber: "201",
        type: "Shared",
        isAvailable: true,
        price: 38000,
      },
      {
        id: "r5",
        roomNumber: "202",
        type: "Shared",
        isAvailable: true,
        price: 38000,
      },
      {
        id: "r6",
        roomNumber: "203",
        type: "Shared",
        isAvailable: false,
        price: 38000,
      },
    ],
  },
  {
    id: "3",
    name: "Elite Student Residence",
    nearestUniversity: "University of Moratuwa",
    distance: 1.2,
    distanceUnit: "km from campus",
    price: 65000,
    rating: 4.9,
    roomType: "Studio",
    amenities: ["Gym", "WiFi", "Security"],
    icon: "building2",
    coordinates: { lat: 0, lng: 0 },
    rooms: [
      {
        id: "r7",
        roomNumber: "301",
        type: "Studio",
        isAvailable: false,
        price: 65000,
      },
      {
        id: "r8",
        roomNumber: "302",
        type: "Studio",
        isAvailable: true,
        price: 65000,
      },
      {
        id: "r9",
        roomNumber: "303",
        type: "Studio",
        isAvailable: true,
        price: 65000,
      },
    ],
  },
  {
    id: "4",
    name: "Scholar's Den",
    nearestUniversity: "University of Peradeniya",
    distance: 0.3,
    distanceUnit: "km from campus",
    price: 52000,
    rating: 4.7,
    roomType: "Single Room",
    amenities: ["Study Hall", "WiFi"],
    icon: "home2",
    coordinates: { lat: 0, lng: 0 },
    rooms: [
      {
        id: "r10",
        roomNumber: "401",
        type: "Single",
        isAvailable: true,
        price: 52000,
      },
      {
        id: "r11",
        roomNumber: "402",
        type: "Single",
        isAvailable: true,
        price: 52000,
      },
    ],
  },
  {
    id: "5",
    name: "Comfort Student Home",
    nearestUniversity: "University of Colombo",
    distance: 1.5,
    distanceUnit: "km from campus",
    price: 42000,
    rating: 4.5,
    roomType: "Shared",
    amenities: ["Meals", "Gym", "Security"],
    icon: "home",
    coordinates: { lat: 0, lng: 0 },
    rooms: [
      {
        id: "r12",
        roomNumber: "501",
        type: "Shared",
        isAvailable: true,
        price: 42000,
      },
      {
        id: "r13",
        roomNumber: "502",
        type: "Shared",
        isAvailable: false,
        price: 42000,
      },
      {
        id: "r14",
        roomNumber: "503",
        type: "Shared",
        isAvailable: true,
        price: 42000,
      },
      {
        id: "r15",
        roomNumber: "504",
        type: "Shared",
        isAvailable: false,
        price: 42000,
      },
    ],
  },
  {
    id: "6",
    name: "Academic Plaza",
    nearestUniversity: "University of Kelaniya",
    distance: 0.2,
    distanceUnit: "km from campus",
    price: 58000,
    rating: 4.8,
    roomType: "Studio",
    amenities: ["Study Hall", "WiFi", "Gym"],
    icon: "building",
    coordinates: { lat: 0, lng: 0 },
    rooms: [
      {
        id: "r16",
        roomNumber: "601",
        type: "Studio",
        isAvailable: true,
        price: 58000,
      },
      {
        id: "r17",
        roomNumber: "602",
        type: "Studio",
        isAvailable: true,
        price: 58000,
      },
      {
        id: "r18",
        roomNumber: "603",
        type: "Studio",
        isAvailable: false,
        price: 58000,
      },
    ],
  },
];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [universityName, setUniversityName] = useState("");
  const [distance, setDistance] = useState("1 km");
  const [priceRange, setPriceRange] = useState("$200-500");
  const [roomType, setRoomType] = useState("Any");
  const [filters, setFilters] = useState({
    wifiIncluded: false,
    mealsProvided: false,
    gymAccess: false,
    security247: false,
  });

  const handleBoardingClick = (boardingId: string) => {
    const selectedBoarding = mockBoardingPlaces.find(
      (place) => place.id === boardingId,
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
      if (
        universityName &&
        !place.nearestUniversity
          .toLowerCase()
          .includes(universityName.toLowerCase())
      ) {
        return false;
      }

      // Filter by distance
      const maxDistance = parseInt(distance);
      if (place.distance > maxDistance) {
        return false;
      }

      // Filter by price range
      let minPrice = 0,
        maxPrice = Infinity;
      if (priceRange === "$200-500") {
        minPrice = 200 * 189; // Convert USD to LKR (approximate)
        maxPrice = 500 * 189;
      } else if (priceRange === "$500-800") {
        minPrice = 500 * 189;
        maxPrice = 800 * 189;
      } else if (priceRange === "$800-1200") {
        minPrice = 800 * 189;
        maxPrice = 1200 * 189;
      } else if (priceRange === "$1200+") {
        minPrice = 1200 * 189;
      }

      if (place.price < minPrice || place.price > maxPrice) {
        return false;
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
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
              <option>$200-500</option>
              <option>$500-800</option>
              <option>$800-1200</option>
              <option>$1200+</option>
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
            <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md p-2 flex gap-2">
              <button className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 flex items-center gap-1">
                <Layers className="w-4 h-4" />
                Layers
              </button>
              <button className="px-3 py-1.5 bg-white border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 flex items-center gap-1">
                <Maximize className="w-4 h-4" />
                Fullscreen
              </button>
            </div>

            {/* Map Placeholder */}
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 relative">
              {/* Map markers representation */}
              <div className="absolute top-1/4 left-1/4">
                <div className="relative">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
                    Sunrise Lodge
                  </div>
                </div>
              </div>

              <div className="absolute top-1/3 right-1/3">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <Building className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="absolute bottom-1/3 left-1/3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Building className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Center Message */}
              <div className="text-center bg-white bg-opacity-90 p-8 rounded-xl shadow-lg">
                <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Interactive map will load here
                </h3>
                <p className="text-gray-600 mb-4">
                  Enter a university name to see boarding locations
                </p>
                <p className="text-sm text-gray-500">
                  relative to the university on the map
                </p>
              </div>

              {/* Map Controls */}
              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                <button className="w-10 h-10 bg-white rounded shadow-md hover:bg-gray-50 flex items-center justify-center text-xl font-bold">
                  +
                </button>
                <button className="w-10 h-10 bg-white rounded shadow-md hover:bg-gray-50 flex items-center justify-center text-xl font-bold">
                  −
                </button>
                <button className="w-10 h-10 bg-white rounded shadow-md hover:bg-gray-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
