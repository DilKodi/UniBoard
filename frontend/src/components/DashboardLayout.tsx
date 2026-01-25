import { useNavigate } from "react-router-dom";
import { Loader2, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import StudentDashboard from "../pages/StudentDashboard";
import OwnerDashboard from "../pages/OwnerDashboard";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: user.role === "student" ? "#3b82f6" : "#16a34a",
            }}
          >
            {user.role === "student" ? "S" : "O"}
          </button>
          <span className="font-semibold text-xl tracking-tight text-gray-900">
            UniBoard
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto">
        {user.role === "student" ? <StudentDashboard /> : <OwnerDashboard />}
      </main>
    </div>
  );
}
