import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { loginUser, signupUser } from "../services/api";
import {
  GraduationCap,
  Building2,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
  full_name?: string;
  university?: string;
  contact_number?: string;
  nic_number?: string;
}

export default function AuthPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Default to student if no role selected
  const role = state?.role || "student";
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
  } = useForm<FormData>({
    mode: "onBlur",
  });

  const validatePasswords = (value: string | undefined) => {
    const password = getValues("password");
    return !value || value === password || "Passwords do not match";
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) || "Invalid email address";
  };

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    return true;
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isLogin) {
        // LOGIN LOGIC
        const result = await loginUser(data.email, data.password);

        if (result.access_token) {
          localStorage.setItem("token", result.access_token);
          await login();

          // Decode JWT token to get user role
          const tokenPayload = JSON.parse(
            atob(result.access_token.split(".")[1]),
          );
          const userRole = tokenPayload.role;

          setSuccess("Login successful! Redirecting...");

          // Redirect based on user role - students go to search page
          setTimeout(() => {
            if (userRole === "student") {
              navigate("/student-dashboard");
            } else if (userRole === "owner") {
              navigate("/owner-dashboard");
            } else {
              navigate("/dashboard");
            }
          }, 1000);
        }
      } else {
        // SIGNUP LOGIC
        const additionalData =
          role === "student"
            ? { university: data.university }
            : {
                contact_number: data.contact_number,
                nic_number: data.nic_number,
              };

        const result = await signupUser(
          data.email,
          data.password,
          role,
          data.full_name || "",
          additionalData,
        );

        if (result.id) {
          setSuccess("Account created successfully! Switching to login...");
          reset();
          setTimeout(() => {
            setIsLogin(true);
            setSuccess("");
          }, 2000);
        }
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Something went wrong";
      setError(
        Array.isArray(errorMessage)
          ? errorMessage[0]?.msg || "Registration failed"
          : errorMessage,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div
          className={`p-6 text-center text-white ${role === "student" ? "bg-primary" : "bg-green-600"}`}
        >
          <div className="flex justify-center mb-4">
            {role === "student" ? (
              <GraduationCap size={48} />
            ) : (
              <Building2 size={48} />
            )}
          </div>
          <h2 className="text-2xl font-bold">
            {isLogin
              ? `Welcome Back, ${role === "student" ? "Student" : "Owner"}!`
              : `Create ${role === "student" ? "Student" : "Owner"} Account`}
          </h2>
          <p className="opacity-90 mt-2">
            {isLogin
              ? "Enter your details to access your account"
              : "Join UniBoard to get started"}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-4 flex items-start gap-2">
              <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  {...register("full_name", {
                    required: "Full name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                    errors.full_name ? "border-red-500" : ""
                  }`}
                  placeholder="John Doe"
                />
                {errors.full_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.full_name.message}
                  </p>
                )}
              </div>
            )}

            {!isLogin && role === "student" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  University
                </label>
                <select
                  {...register("university", {
                    required: "University is required",
                  })}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                    errors.university ? "border-red-500" : ""
                  }`}
                  defaultValue=""
                >
                  <option value="">Select your university</option>
                  <option value="University of Moratuwa">
                    University of Moratuwa
                  </option>
                  <option value="University of Colombo">
                    University of Colombo
                  </option>
                  <option value="University of Peradeniya">
                    University of Peradeniya
                  </option>
                  <option value="University of Sri Jayewardenepura">
                    University of Sri Jayewardenepura
                  </option>
                  <option value="University of Kelaniya">
                    University of Kelaniya
                  </option>
                  <option value="University of Ruhuna">
                    University of Ruhuna
                  </option>
                  <option value="University of Jaffna">
                    University of Jaffna
                  </option>
                  <option value="Open University of Sri Lanka">
                    Open University of Sri Lanka
                  </option>
                  <option value="Sabaragamuwa University">
                    Sabaragamuwa University
                  </option>
                </select>
                {errors.university && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.university.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                {...register("email", {
                  required: "Email is required",
                  validate: validateEmail,
                })}
                type="email"
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                  errors.email ? "border-red-500" : ""
                }`}
                placeholder="name@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                {...register("password", {
                  required: "Password is required",
                  validate: isLogin ? undefined : validatePassword,
                })}
                type="password"
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                  errors.password ? "border-red-500" : ""
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  {...register("confirmPassword", {
                    required: "Please confirm your password",
                    validate: validatePasswords,
                  })}
                  type="password"
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                    errors.confirmPassword ? "border-red-500" : ""
                  }`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            )}

            {/* Extra Owner Fields */}
            {!isLogin && role === "owner" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIC Number
                  </label>
                  <input
                    {...register("nic_number", {
                      required: "NIC number is required",
                      pattern: {
                        value: /^[0-9]{10,12}[vVxX]?$/,
                        message: "Invalid NIC format",
                      },
                    })}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                      errors.nic_number ? "border-red-500" : ""
                    }`}
                    placeholder="123456789V"
                  />
                  {errors.nic_number && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.nic_number.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    {...register("contact_number", {
                      required: "Contact number is required",
                      pattern: {
                        value: /^(\+94|0)?[0-9]{9}$/,
                        message: "Invalid phone number format",
                      },
                    })}
                    className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none ${
                      errors.contact_number ? "border-red-500" : ""
                    }`}
                    placeholder="0771234567"
                  />
                  {errors.contact_number && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.contact_number.message}
                    </p>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg text-white font-semibold transition-colors flex justify-center items-center ${
                role === "student"
                  ? "bg-primary hover:bg-blue-700 disabled:bg-blue-300"
                  : "bg-green-600 hover:bg-green-700 disabled:bg-green-300"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  {isLogin ? "Signing In..." : "Creating Account..."}
                </>
              ) : isLogin ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setSuccess("");
                reset();
              }}
              className={`font-semibold hover:underline ${role === "student" ? "text-primary" : "text-green-600"}`}
            >
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/get-started")}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ← Change Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
