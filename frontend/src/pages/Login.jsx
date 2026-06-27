import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [role, setRole] = useState("admin");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await api.login({
        username: username.trim(),
        password,
        role
      });

      // Store authentication data
      localStorage.setItem("token", response.token);
      localStorage.setItem("role", response.user.role);
      localStorage.setItem("username", response.user.username);
      localStorage.setItem("userId", response.user.id);

      // Navigate based on role
      if (response.user.role === "admin") {
        navigate("/admin/dashboard");
      } else if (response.user.role === "staff") {
        navigate("/staff/dashboard");
      } else if (response.user.role === "customer") {
        navigate("/customer/menu");
      }

    } catch (error) {
      setErrors({ general: error.message || "Login failed. Please check your credentials." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-start sm:items-center justify-center px-3 py-6 sm:p-4 relative overflow-hidden">

      {/* Background Shapes */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-32 h-32 bg-orange-400 rounded-full"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-red-400 rounded-full"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-yellow-400 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-orange-500 rounded-full"></div>
      </div>

      <div className="max-w-md w-full space-y-5 sm:space-y-8 relative z-10">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-linear-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
            <span className="text-2xl sm:text-3xl">🍽️</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Restaurant<span className="text-orange-600">Pro</span>
          </h1>

          <p className="text-gray-600 text-sm sm:text-lg">
            Professional Restaurant Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="card-shadow p-4 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-6">

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Your Role
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`p-3 sm:p-4 border-2 rounded-xl transition ${
                    role === "admin"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  <div className="text-2xl mb-1">👑</div>
                  <div className="font-medium">Admin</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("staff")}
                  className={`p-3 sm:p-4 border-2 rounded-xl transition ${
                    role === "staff"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  <div className="text-2xl mb-1">👨‍🍳</div>
                  <div className="font-medium">Staff</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`p-3 sm:p-4 border-2 rounded-xl transition ${
                    role === "customer"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  <div className="text-2xl mb-1">👤</div>
                  <div className="font-medium">Customer</div>
                </button>

              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`input-field ${
                  errors.username ? "border-red-400" : ""
                }`}
                placeholder="Enter username"
              />

              {errors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.username}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`input-field ${
                  errors.password ? "border-red-400" : ""
                }`}
                placeholder="Enter password"
              />

              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password}
                </p>
              )}
            </div>

            {/* General Error */}
            {errors.general && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
                {errors.general}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-orange-600 hover:text-orange-700 font-semibold"
                >
                  Create one here
                </Link>
              </p>
            </div>
          </form>

          {/* Demo Credentials */}
          
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          © 2026 Restaurant Management System
        </div>
      </div>
    </div>
  );
}

export default Login;