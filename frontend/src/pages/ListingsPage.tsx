import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, MapPin, Home, Layers3, Clock3 } from "lucide-react";
import Footer from "../components/Footer";
import { fetchListings, type BoardingPlaceResponse } from "../services/api";
import { demoBoardingPlaces } from "../data/demoBoardingPlaces";

const ListingsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [listings, setListings] = useState<Array<BoardingPlaceResponse & { demo?: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        const data = await fetchListings();
        setListings([...demoBoardingPlaces, ...data]);
      } catch (err) {
        console.error("Failed to load listings", err);
        setListings([...demoBoardingPlaces]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, []);

  const filteredListings = listings.filter((listing) => {
    const search = searchQuery.toLowerCase();
    return (
      listing.property_name.toLowerCase().includes(search) ||
      listing.location.toLowerCase().includes(search) ||
      listing.nearest_university.toLowerCase().includes(search)
    );
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
          {loading ? (
            <div className="text-center py-12 text-gray-600">
              Loading listings...
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : filteredListings.length === 0 ? (
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
                  onClick={() => navigate(`/boarding/${listing.id}`)}
                >
                  <div className="h-48 bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 relative">
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute top-3 left-3 bg-white/90 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      Listing #{listing.id}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-sm uppercase tracking-wide text-white/80">
                        {listing.status}
                      </p>
                      <h3 className="text-xl font-bold line-clamp-2">
                        {listing.property_name}
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {listing.property_name}
                    </h3>

                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <MapPin size={16} className="mr-1" />
                      <span>{listing.location}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                        <Home size={12} />
                        {listing.number_of_rooms} rooms
                      </span>
                      <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                        <Layers3 size={12} />
                        {listing.number_of_floors} floors
                      </span>
                      <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                        <Clock3 size={12} />
                        {new Date(listing.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t pt-3">
                      <div className="text-sm text-gray-600">
                        Near {listing.nearest_university}
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
