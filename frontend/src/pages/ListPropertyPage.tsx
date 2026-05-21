import { useState } from "react";
import { Upload, ChevronDown } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import { universities } from "../data/universities";

interface PropertyFormData {
  propertyName: string;
  location: string;
  address: string;
  nearestUniversity: string;
  numberOfFloors: string;
  numberOfRooms: string;
  verificationDocument: File | null;
}

const ListPropertyPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [formData, setFormData] = useState<PropertyFormData>({
    propertyName: "",
    location: "",
    address: "",
    nearestUniversity: "",
    numberOfFloors: "",
    numberOfRooms: "",
    verificationDocument: null,
  });

  const [fileName, setFileName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedUniversityName, setSelectedUniversityName] = useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const selectedUniversity = universities.find(
    (uni) => uni.name === selectedUniversityName,
  );
  const campusOptions = selectedUniversity?.campuses ?? [];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        verificationDocument: file,
      }));
      setFileName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.propertyName ||
      !formData.location ||
      !formData.address ||
      !formData.nearestUniversity ||
      !formData.numberOfFloors ||
      !formData.numberOfRooms ||
      !formData.verificationDocument
    ) {
      addToast("Please fill in all required fields", "warning");
      return;
    }

    // Validate numeric fields
    if (
      isNaN(Number(formData.numberOfFloors)) ||
      Number(formData.numberOfFloors) < 1
    ) {
      addToast("Number of floors must be a valid positive number", "warning");
      return;
    }

    if (
      isNaN(Number(formData.numberOfRooms)) ||
      Number(formData.numberOfRooms) < 1
    ) {
      addToast("Number of rooms must be a valid positive number", "warning");
      return;
    }

    setSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      addToast(
        "Property listing submitted successfully! Your listing awaits admin review.",
        "success",
      );
      setFormData({
        propertyName: "",
        location: "",
        address: "",
        nearestUniversity: "",
        numberOfFloors: "",
        numberOfRooms: "",
        verificationDocument: null,
      });
      setFileName("");
      setSubmitting(false);
      navigate("/owner-dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            List Your Boarding Property
          </h1>
          <p className="text-gray-600">
            Share your boarding place with students looking for safe and
            affordable housing near campus.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Name of Boarding House <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="propertyName"
                placeholder="e.g., Cozy Student Boarding"
                value={formData.propertyName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                placeholder="e.g., Colombo, Colombo District"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Full Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                placeholder="e.g., 123 Main Street, Colombo 3, Sri Lanka"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Nearest University */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Nearest University <span className="text-red-500">*</span>
              </label>
              <div className="relative space-y-3">
                {/* University selector */}
                <div>
                  <select
                    name="universitySelect"
                    value={selectedUniversityName}
                    onChange={(e) => {
                      const uniName = e.target.value;
                      setSelectedUniversityName(uniName);
                      setSelectedCampus("");

                      const uni = universities.find((entry) => entry.name === uniName);
                      setFormData((prev) => ({
                        ...prev,
                        nearestUniversity: uni ? `${uni.name} (${uni.location})` : "",
                      }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
                  >
                    <option value="">Select a university</option>
                    {universities.map((uni) => (
                      <option key={uni.name} value={uni.name}>
                        {uni.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campus selector - shown when a university is selected */}
                {selectedUniversityName && (
                  <div className="relative">
                    <select
                      name="nearestUniversity"
                      value={selectedCampus}
                      onChange={(e) => {
                        const campus = e.target.value;
                        setSelectedCampus(campus);
                        setFormData((prev) => ({
                          ...prev,
                          nearestUniversity: `${selectedUniversityName} - ${campus}`,
                        }));
                      }}
                      disabled={campusOptions.length === 0}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                      {campusOptions.length > 0 ? (
                        <>
                          <option value="">Select a campus/branch</option>
                          {campusOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </>
                      ) : (
                        <option value="">
                          No campus/branch available
                        </option>
                      )}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                  </div>
                )}
              </div>
            </div>

            {/* Number of Floors */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Number of Floors <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="numberOfFloors"
                placeholder="e.g., 3"
                value={formData.numberOfFloors}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Number of Rooms */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Number of Rooms <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="numberOfRooms"
                placeholder="e.g., 12"
                value={formData.numberOfRooms}
                onChange={handleInputChange}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Verification Document */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Verification Document <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Upload property ownership proof or lease agreement (PDF, JPG,
                PNG). Max 5MB.
              </p>
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  {fileName ? (
                    <p className="text-sm font-medium text-gray-900">
                      {fileName}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-900">
                        Click to upload
                      </p>
                      <p className="text-xs text-gray-500">or drag and drop</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? "Submitting..." : "Submit Property Listing"}
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                What happens next?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  ✓ Your property will be reviewed by our admin team within 48
                  hours
                </li>
                <li>✓ You'll receive an email with approval or feedback</li>
                <li>
                  ✓ Once approved, you can add rooms and manage your listing
                </li>
              </ul>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ListPropertyPage;
