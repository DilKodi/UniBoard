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
  Bell,
  CheckCircle2,
  XCircle,
  Calendar,
  Home,
  Trash2,
  Check,
} from "lucide-react";
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../services/api";
import type { NotificationResponse } from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const adminAppUrl = import.meta.env.VITE_ADMIN_APP_URL || "http://localhost:5174";
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notifications State & Refs
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  const profileImageUrl =
    user?.role === "student"
      ? user.student_profile?.profile_image_url
      : user?.role === "owner"
      ? user.owner_profile?.profile_image_url
      : null;

  const fetchUserNotifications = async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserNotifications();
      const interval = setInterval(fetchUserNotifications, 15000); // poll every 15s
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleNotificationClick = async (item: NotificationResponse) => {
    if (!item.is_read) {
      await handleMarkAsRead(item.id);
    }
    setShowNotifications(false);
    if (item.action_url) {
      navigate(item.action_url);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      let date = new Date(dateStr);
      // Force naive ISO strings to be parsed as UTC by appending 'Z'
      if (dateStr && !dateStr.endsWith("Z") && !dateStr.includes("+") && !/-\d{2}:\d{2}$/.test(dateStr)) {
        date = new Date(dateStr + "Z");
      }
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (error) {
      return "";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "property_approved":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "property_rejected":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "visit_requested":
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case "booking_requested":
        return <Home className="w-5 h-5 text-indigo-600" />;
      case "visit_status_updated":
      case "booking_status_updated":
        return <CheckCircle2 className="w-5 h-5 text-teal-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

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
    } else if (user?.role === "admin") {
      window.location.replace(adminAppUrl);
    } else {
      navigate("/dashboard");
    }
    setShowDropdown(false);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: sectionId === "get-started" ? "center" : "start",
      });
    } else {
      navigate(`/#${sectionId}`);
    }
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
              onClick={() => scrollToSection("about")}
              className="text-gray-700 hover:text-blue-700 transition"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("get-started")}
              className="text-gray-700 hover:text-blue-700 transition"
            >
              Get Started
            </button>
            <button
              onClick={() => scrollToSection("contact-us")}
              className="text-gray-700 hover:text-blue-700 transition"
            >
              Contact Us
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications Dropdown */}
                <div className="relative" ref={notificationDropdownRef}>
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowDropdown(false);
                    }}
                    className="relative p-2 rounded-full text-gray-500 hover:text-blue-700 hover:bg-gray-100 transition duration-200"
                    title="Notifications"
                  >
                    <Bell className="w-6 h-6" />
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <span className="absolute top-1 right-1 flex h-4.5 w-4.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-red-600 text-[10px] text-white font-bold items-center justify-center">
                          {notifications.filter(n => !n.is_read).length}
                        </span>
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-150 py-2 z-50 transform origin-top-right transition-all duration-200">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                        {notifications.some(n => !n.is_read) && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition duration-150"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                              <Bell className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-800">All caught up!</p>
                            <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                              You'll see updates about bookings, visits, and approvals here.
                            </p>
                          </div>
                        ) : (
                          notifications.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleNotificationClick(item)}
                              className={`flex gap-3 p-3.5 hover:bg-blue-50/30 transition duration-150 cursor-pointer relative group ${
                                !item.is_read ? "bg-blue-50/10" : ""
                              }`}
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                {getNotificationIcon(item.type)}
                              </div>
                              <div className="flex-grow min-w-0 pr-8">
                                <p className={`text-xs font-semibold text-gray-900 ${!item.is_read ? "font-bold" : ""}`}>
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-gray-600 leading-normal mt-0.5">
                                  {item.message}
                                </p>
                                <span className="text-[10px] text-gray-400 mt-1 block">
                                  {formatRelativeTime(item.created_at)}
                                </span>
                              </div>

                              {/* Notification Controls */}
                              <div className="absolute right-3 top-3.5 flex gap-1 items-center md:opacity-0 md:group-hover:opacity-100 transition duration-150">
                                {!item.is_read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsRead(item.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNotification(item.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {!item.is_read && (
                                <span className="absolute right-3.5 bottom-4 w-2 h-2 rounded-full bg-blue-600 group-hover:hidden"></span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      setShowDropdown(!showDropdown);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center text-white font-semibold">
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.email?.charAt(0).toUpperCase() || "U"
                      )}
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
              </>
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
