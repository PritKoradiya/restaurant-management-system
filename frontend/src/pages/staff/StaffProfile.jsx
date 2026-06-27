import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

function StaffProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.getCurrentUser();
        const currentUser = response.user;

        setUser(currentUser);
        setFormData({
          firstName: currentUser.firstName || "",
          lastName: currentUser.lastName || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
          address: currentUser.address || "",
        });
      } catch (error) {
        console.error("Failed to load staff profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const fullName = useMemo(() => {
    if (!formData.firstName && !formData.lastName) {
      return user?.username || "Staff";
    }
    return `${formData.firstName} ${formData.lastName}`.trim();
  }, [formData.firstName, formData.lastName, user]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?._id) return;

    setSaving(true);
    try {
      const response = await api.updateUser(user._id, formData);
      setUser(response.user || user);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (error) {
      alert(error.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card-shadow p-6">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Staff Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal details and account information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-linear-to-r from-green-600 to-teal-500 text-white flex items-center justify-center text-2xl font-bold">
              {fullName?.charAt(0).toUpperCase() || "S"}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{fullName}</h2>
              <p className="text-sm text-gray-600">@{user?.username || "staff"}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-gray-500">Role</span>
              <span className="text-gray-900 font-medium capitalize sm:text-right">{user?.role || "staff"}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-900 font-medium break-all sm:text-right">{formData.email || "Not set"}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span className="text-gray-500">Phone</span>
              <span className="text-gray-900 font-medium sm:text-right">{formData.phone || "Not set"}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="First name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="9876543210"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Street, City"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-70"
              >
                {saving ? "Saving..." : "Save Profile"}
              </button>
              {saved && <p className="text-sm text-green-600 font-medium">Profile updated successfully</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default StaffProfile;
