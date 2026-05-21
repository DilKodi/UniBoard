import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  LogOut,
  Settings,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    navigate("/");
    setShowDropdown(false);
  };

  const handleViewProfile = () => {
    if (user?.role === "owner") {
      navigate("/owner-profile");
    } else {
      navigate("/student-profile");
    }
    setShowDropdown(false);
  };

  const handleDashboard = () => {
    if (user?.role === "owner") {
      navigate("/owner-dashboard");
    } else if (user?.role === "student") {
      navigate("/student-dashboard");
    } else {
      navigate("/dashboard");
    }
    setShowDropdown(false);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-700" />
            <button
              onClick={() => navigate("/")}
              className="text-2xl font-bold text-blue-700 hover:text-blue-800 transition"
            >
              UniBoard
            </button>
          </div>

          <div className="hidden md:flex space-x-8">
            <button
              onClick={() => navigate("/student-dashboard")}
              className="text-gray-700 hover:text-blue-700 transition"
            >
              Browse Listings
            </button>
            <button
              onClick={() => {
                const element = document.getElementById("how-it-works");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                } else {
                  navigate("/#how-it-works");
                }
              }}
              className="text-gray-700 hover:text-blue-700 transition"
            >
              How it Works
            </button>
            <button
              onClick={() => {
                const element = document.getElementById("about");
                if (element) {
                  element.scrollIntoView({ behavior: "smooth" });
                } else {
                  navigate("/#about");
                }
              }}
              className="text-gray-700 hover:text-blue-700 transition"
            >
              About
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-600 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.email}
                      </p>
                      <p className="text-xs text-gray-600 capitalize">
                        {user?.role || "User"}
                      </p>
                    </div>

                    <button
                      onClick={handleDashboard}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </button>

                    <button
                      onClick={handleViewProfile}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      View Profile
                    </button>

                    <button
                      onClick={() => {
                        navigate("/settings");
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
