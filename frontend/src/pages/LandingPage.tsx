import { Check, Shield, Users, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Find Your Perfect
              <br />
              Boarding Place
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Discover safe, affordable, and verified housing options
              <br />
              tailored to match your campus. Connect with trusted
              <br />
              landlords and streamline your housing search.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate("/get-started")}
                className="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition font-medium"
              >
                Browse Listings
              </button>
              <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                Learn More
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-8 w-8 bg-green-500 rounded flex items-center justify-center">
                  <Check className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Campus Proximity
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose from properties near university campuses
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-8 w-8 bg-green-500 rounded flex items-center justify-center">
                  <Check className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Verified Listings
                  </h3>
                  <p className="text-sm text-gray-600">
                    Every listing is verified and up-to-date
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-8 w-8 bg-green-500 rounded flex items-center justify-center">
                  <Check className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Quick Booking
                  </h3>
                  <p className="text-sm text-gray-600">
                    Browse, choose and book in minutes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose UniBoard Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose UniBoard?
            </h2>
            <p className="text-gray-600">
              We are built for students, by students. Experience the ease with
              our
              <br />
              student-centric boarding platform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-100 rounded-full mb-6">
                <Shield className="text-blue-700" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-4">Safety First</h3>
              <p className="text-gray-600">
                All properties have been verified through our partnership with
                the Student Housing Association, offering peace of mind with
                real reviews from verified students.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-100 rounded-full mb-6">
                <Users className="text-blue-700" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-4">Community Trust</h3>
              <p className="text-gray-600">
                Connect with the students and local landlords built on
                transparency, with genuine insights about boarding places.
              </p>
            </div>

            <div className="text-center p-8 rounded-xl hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-100 rounded-full mb-6">
                <Filter className="text-blue-700" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Filters</h3>
              <p className="text-gray-600">
                Find exactly what you need. Filter by price, distance from
                campus, amenities, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-blue-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Find Your Home?
          </h2>
          <p className="text-blue-100 mb-8">
            Join thousands of students using to secure safe and affordable
            boarding on
            <br />
            UniBoard!
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/get-started")}
              className="px-8 py-3 bg-white text-blue-700 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Sign Up as Student
            </button>
            <button
              onClick={() => navigate("/get-started")}
              className="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-blue-800 transition font-medium"
            >
              List Your Property
            </button>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-5xl font-bold text-blue-700 mb-2">5K+</div>
              <div className="text-gray-600">Active Listings</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-blue-700 mb-2">15K+</div>
              <div className="text-gray-600">Happy Students</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-blue-700 mb-2">4.8/5</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
