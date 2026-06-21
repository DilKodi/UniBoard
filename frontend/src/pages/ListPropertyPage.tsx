import { useState, useEffect, useRef, useMemo } from "react";
import { Upload, ChevronDown, MapPin, Search } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ToastProvider";
import { universities, UNIVERSITY_COORDINATES } from "../data/universities";
import { createListing, uploadDocument } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon issue with React
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface PropertyFormData {
  propertyName: string;
  location: string;
  address: string;
  nearestUniversity: string;
  numberOfFloors: string;
  numberOfRooms: string;
  genderRestriction: string;
  priceRange: string;
  verificationDocument: File | null;
}

function LocationMarker({
  coordinates,
  setCoordinates,
}: {
  coordinates: { lat: number; lng: number } | null;
  setCoordinates: (coords: { lat: number; lng: number }) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      setCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  const markerRef = useRef<any>(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latLng = marker.getLatLng();
          setCoordinates({ lat: latLng.lat, lng: latLng.lng });
        }
      },
    }),
    [setCoordinates]
  );

  return coordinates === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[coordinates.lat, coordinates.lng]}
      ref={markerRef}
      icon={redIcon}
    />
  );
}

function MapViewUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const ListPropertyPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState<PropertyFormData>({
    propertyName: "",
    location: "",
    address: "",
    nearestUniversity: "",
    numberOfFloors: "",
    numberOfRooms: "",
    genderRestriction: "Any",
    priceRange: "",
    verificationDocument: null,
  });

  const [fileName, setFileName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedUniversityName, setSelectedUniversityName] =
    useState<string>("");
  const [selectedCampus, setSelectedCampus] = useState<string>("");
  const selectedUniversity = universities.find(
    (uni) => uni.name === selectedUniversityName,
  );
  const campusOptions = selectedUniversity?.campuses ?? [];

  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([7.8731, 80.7718]);
  const [searchingLocation, setSearchingLocation] = useState(false);

  // Center map on university when it changes
  useEffect(() => {
    if (selectedUniversityName) {
      const foundKey = Object.keys(UNIVERSITY_COORDINATES).find(key =>
        selectedUniversityName.toLowerCase().includes(key.toLowerCase())
      );
      if (foundKey) {
        const coords = UNIVERSITY_COORDINATES[foundKey];
        setMapCenter([coords.lat, coords.lng]);
        setCoordinates({ lat: coords.lat, lng: coords.lng });
      }
    }
  }, [selectedUniversityName]);

  const handleLocateAddress = async () => {
    if (!formData.address) {
      addToast("Please enter a full address first.", "warning");
      return;
    }
    setSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          formData.address
        )}&limit=1`,
        {
          headers: {
            "User-Agent": "UniBoard/1.0",
          },
        }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setCoordinates({ lat, lng: lon });
        setMapCenter([lat, lon]);
        addToast("Location found and updated on the map!", "success");
      } else {
        addToast("Could not resolve address. Try placing a marker manually on the map.", "warning");
      }
    } catch (err) {
      console.error("Geocoding failed", err);
      addToast("Geocoding service unavailable. You can click on the map to manually set the location.", "warning");
    } finally {
      setSearchingLocation(false);
    }
  };

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

    if (!user?.id) {
      addToast("Please sign in again before submitting a listing", "warning");
      return;
    }

    // Validate required fields
    if (
      !formData.propertyName ||
      !formData.location ||
      !formData.address ||
      !formData.nearestUniversity ||
      !formData.numberOfFloors ||
      !formData.numberOfRooms ||
      !formData.priceRange ||
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

    const submitPayload = {
      owner_id: user.id,
      property_name: formData.propertyName,
      location: formData.location,
      address: formData.address,
      nearest_university: formData.nearestUniversity,
      number_of_floors: Number(formData.numberOfFloors),
      number_of_rooms: Number(formData.numberOfRooms),
      total_rooms: Number(formData.numberOfRooms),
      gender_restriction: formData.genderRestriction,
      price_range: formData.priceRange,
      latitude: coordinates ? coordinates.lat : null,
      longitude: coordinates ? coordinates.lng : null,
    };

    setSubmitting(true);
    // First upload the verification document
    uploadDocument(formData.verificationDocument as File)
      .then((res) => {
        const payloadWithDoc = {
          ...submitPayload,
          verification_document_url: res.file_url || `/uploads/${res.filename}`,
        };
        return createListing(payloadWithDoc);
      })
      .then(() => {
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
          genderRestriction: "Any",
          priceRange: "",
          verificationDocument: null,
        });
        setFileName("");
        navigate("/owner-dashboard");
      })
      .catch((err) => {
        console.error("Create listing failed", err);
        addToast(err?.response?.data?.detail || "Failed to submit listing", "error");
      })
      .finally(() => setSubmitting(false));
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
              <div className="flex gap-2">
                <textarea
                  name="address"
                  placeholder="e.g., 123 Main Street, Colombo 3, Sri Lanka"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={3}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={handleLocateAddress}
                  disabled={searchingLocation}
                  className="px-4 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 rounded-lg transition text-sm font-semibold flex flex-col items-center justify-center gap-1 min-w-[100px]"
                >
                  <Search className="w-5 h-5 text-gray-500" />
                  {searchingLocation ? "Locating..." : "Locate on Map"}
                </button>
              </div>
            </div>

            {/* Interactive Map Picker */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Property Location on Map <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Click on the map or drag the pin to pinpoint the exact location of your property.
              </p>
              <div style={{ height: "300px", width: "100%" }} className="rounded-lg overflow-hidden border border-gray-300 relative z-0">
                <MapContainer
                  center={mapCenter}
                  zoom={coordinates ? 15 : 8}
                  style={{ height: "100%", width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapViewUpdater center={mapCenter} zoom={coordinates ? 15 : 8} />
                  <LocationMarker coordinates={coordinates} setCoordinates={setCoordinates} />
                </MapContainer>
              </div>
              {coordinates && (
                <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-200">
                  Selected coordinates: <span className="font-semibold">{coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</span>
                </p>
              )}
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

                      const uni = universities.find(
                        (entry) => entry.name === uniName,
                      );
                      setFormData((prev) => ({
                        ...prev,
                        nearestUniversity: uni
                          ? `${uni.name} (${uni.location})`
                          : "",
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
                        <option value="">No campus/branch available</option>
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

            {/* Gender restriction */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Gender Preference / Restriction <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="genderRestriction"
                  value={formData.genderRestriction}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white"
                >
                  <option value="Any">Any (Mixed / Unisex)</option>
                  <option value="Male Only">Male Only</option>
                  <option value="Female Only">Female Only</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Monthly Price Range (LKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="priceRange"
                placeholder="e.g., LKR 10,000 - 15,000"
                value={formData.priceRange}
                onChange={handleInputChange}
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
