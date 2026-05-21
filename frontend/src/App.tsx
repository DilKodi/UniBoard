import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ListingsPage from "./pages/ListingsPage";
import RoleSelection from "./pages/RoleSelection";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import StudentDashboard from "./pages/StudentDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import BoardingDetails from "./pages/BoardingDetails";
import StudentProfile from "./pages/StudentProfile";
import OwnerProfile from "./pages/OwnerProfile";
import ListPropertyPage from "./pages/ListPropertyPage";
import { ToastProvider } from "./components/ToastProvider";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/get-started" element={<RoleSelection />} />
          <Route path="/login" element={<AuthPage />} />
          <Route
            path="/list-property"
            element={
              <ProtectedRoute requiredRole="owner">
                <ListPropertyPage />
              </ProtectedRoute>
            }
          />

          {/* Protected routes */}
          <Route path="/boarding/:id" element={<BoardingDetails />} />

          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student-profile"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner-dashboard"
            element={
              <ProtectedRoute requiredRole="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner-profile"
            element={
              <ProtectedRoute requiredRole="owner">
                <OwnerProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
