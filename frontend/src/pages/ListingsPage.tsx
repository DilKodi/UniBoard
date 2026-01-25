import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MapPin, Star } from "lucide-react";
import Footer from "../components/Footer";

interface Listing {
  id: number;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  verified: boolean;
  amenities: string[];
  distance: string;
}

const ListingsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters] = useState({
    priceRange: [0, 30000],
    amenities: [] as string[],
    verified: false,
  });

  // Mock data - replace with API call
  const listings: Listing[] = [
    {
      id: 1,
      title: "Spacious Room in Modern Apartment",
      location: "Nugegoda",
      price: 15000,
      rating: 4.8,
      reviews: 45,
      image: "/api/placeholder/300/200",
      verified: true,
      amenities: ["WiFi", "Attached Bathroom", "AC"],
      distance: "2.5 km from campus",
    },
    {
      id: 2,
      title: "Cozy Studio Near Campus",
      location: "Colombo 3",
      price: 12000,
      rating: 4.6,
      reviews: 32,
      image: "/api/placeholder/300/200",
      verified: true,
      amenities: ["Kitchen Access", "Laundry", "WiFi"],
      distance: "1.5 km from campus",
    },
    {
      id: 3,
      title: "Luxury Boarding House",
      location: "Battaramulla",
      price: 25000,
      rating: 4.9,
      reviews: 78,
      image: "/api/placeholder/300/200",
      verified: true,
      amenities: ["WiFi", "Attached Bathroom", "Gym", "Parking"],
      distance: "3.2 km from campus",
    },
    {
      id: 4,
      title: "Affordable Room in Shared House",
      location: "Wellawatta",
      price: 8000,
      rating: 4.4,
      reviews: 28,
      image: "/api/placeholder/300/200",
      verified: false,
      amenities: ["WiFi", "Shared Kitchen"],
      distance: "2.0 km from campus",
    },
    {
      id: 5,
      title: "Modern Hostel - Private Rooms",
      location: "Kirulapana",
      price: 18000,
      rating: 4.7,
      reviews: 56,
      image: "/api/placeholder/300/200",
      verified: true,
      amenities: ["WiFi", "Common Area", "Laundry", "Security"],
      distance: "1.8 km from campus",
    },
    {
      id: 6,
      title: "Family-run Boarding Place",
      location: "Dehiwala",
      price: 11000,
      rating: 4.5,
      reviews: 35,
      image: "/api/placeholder/300/200",
      verified: true,
      amenities: ["WiFi", "Home Cooked Food", "Laundry"],
      distance: "4.5 km from campus",
    },
  ];

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice =
      listing.price >= filters.priceRange[0] &&
      listing.price <= filters.priceRange[1];
    const matchesVerified = !filters.verified || listing.verified;

    return matchesSearch && matchesPrice && matchesVerified;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate("/")}
              className="text-2xl font-bold text-blue-700 hover:text-blue-800 transition"
            >
              UniBoard
            </button>

            <div className="hidden md:flex space-x-8">
              <a
                href="#listings"
                className="text-gray-700 hover:text-blue-700 transition font-medium"
              >
                Browse Listings
              </a>
              <a
                href="#how-it-works"
                className="text-gray-700 hover:text-blue-700 transition"
              >
                How it Works
              </a>
              <a
                href="#about"
                className="text-gray-700 hover:text-blue-700 transition"
              >
                About
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-blue-700 border border-blue-700 rounded-lg hover:bg-blue-50 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/get-started")}
                className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Section */}
      <section className="bg-white border-b py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Find Your Perfect Boarding
          </h1>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search
              className="absolute left-4 top-3.5 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by location, area, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-gray-600">
              <span className="font-semibold">
                Found {filteredListings.length} listings
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value="newest"
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Sort by: Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Listings Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredListings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No listings found. Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
                  onClick={() => navigate(`/listing/${listing.id}`)}
                >
                  {/* Image Container */}
                  <div className="relative">
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Rs. {listing.price.toLocaleString()}/month
                    </div>
                    {listing.verified && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                        ✓ Verified
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {listing.title}
                    </h3>

                    {/* Location and Distance */}
                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <MapPin size={16} className="mr-1" />
                      <span>{listing.location}</span>
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      📍 {listing.distance}
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {listing.amenities.slice(0, 3).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                      {listing.amenities.length > 3 && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          +{listing.amenities.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center justify-between border-t pt-3">
                      <div className="flex items-center">
                        <Star
                          size={16}
                          className="text-yellow-400 mr-1"
                          fill="currentColor"
                        />
                        <span className="font-semibold text-gray-900">
                          {listing.rating}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          ({listing.reviews})
                        </span>
                      </div>
                      <button className="text-blue-700 hover:text-blue-800 font-medium text-sm">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ListingsPage;
