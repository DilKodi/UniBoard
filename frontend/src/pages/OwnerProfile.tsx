import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { updateOwnerProfile, uploadProfilePicture } from "../services/api";
import {
  Camera,
  Mail,
  Phone,
  MapPin,
  Building2,
  Save,
  ShieldCheck,
} from "lucide-react";

export default function OwnerProfile() {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    nicNumber: "",
    propertyBusinessName: "",
    officeAddress: "",
    preferredContactTime: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.owner_profile?.full_name || "Boarding Owner",
        email: user.email || "",
        phone: user.owner_profile?.contact_number || "",
        nicNumber: user.owner_profile?.nic_number || "",
        propertyBusinessName: user.owner_profile?.property_business_name || "",
        officeAddress: user.owner_profile?.office_address || "",
        preferredContactTime: user.owner_profile?.preferred_contact_time || "",
      });
      if (user.owner_profile?.profile_image_url) {
        setProfileImage(user.owner_profile.profile_image_url);
      }
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      let finalImageUrl = profileImage;
      if (imageFile) {
        const uploadRes = await uploadProfilePicture(imageFile);
        finalImageUrl = uploadRes.url;
      }

      await updateOwnerProfile({
        full_name: formData.fullName,
        contact_number: formData.phone,
        office_address: formData.officeAddress,
        preferred_contact_time: formData.preferredContactTime,
        property_business_name: formData.propertyBusinessName,
        profile_image_url: finalImageUrl,
      });
      setImageFile(null);
      await login(); // refresh auth user context
      setIsEditing(false);
      alert("Owner profile updated successfully!");
    } catch (error) {
      console.error("Failed to update owner profile", error);
      alert("Failed to save profile. Please try again.");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImageFile(null);
    setProfileImage(user?.owner_profile?.profile_image_url || "");
    if (user) {
      setFormData({
        fullName: user.owner_profile?.full_name || "Boarding Owner",
        email: user.email || "",
        phone: user.owner_profile?.contact_number || "",
        nicNumber: user.owner_profile?.nic_number || "",
        propertyBusinessName: user.owner_profile?.property_business_name || "",
        officeAddress: user.owner_profile?.office_address || "",
        preferredContactTime: user.owner_profile?.preferred_contact_time || "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Owner Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your account details and business information
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-green-500 to-emerald-600"></div>

          <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-6">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-4xl font-bold">
                      {formData.fullName.charAt(0)}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-green-600 rounded-full p-2 cursor-pointer hover:bg-green-700 transition">
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex justify-end mb-6">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">
                    {formData.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <p className="text-gray-900">{formData.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.phone}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  NIC Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="nicNumber"
                    value={formData.nicNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.nicNumber}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Property Business Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="propertyBusinessName"
                    value={formData.propertyBusinessName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">
                    {formData.propertyBusinessName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Contact Time
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="preferredContactTime"
                    value={formData.preferredContactTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">
                    {formData.preferredContactTime}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Office Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="officeAddress"
                    value={formData.officeAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900">{formData.officeAddress}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
