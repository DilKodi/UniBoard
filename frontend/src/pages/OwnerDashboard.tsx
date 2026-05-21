import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  Eye,
  Calendar,
  Home,
  MessageSquare,
  Plus,
  Pencil,
  X,
} from "lucide-react";
import { useToast } from "../components/ToastProvider";

interface Room {
  id: string;
  name: string;
  type: string;
  price: number;
  views: number;
  status: "Occupied" | "Available";
}

interface VisitRequest {
  id: string;
  studentName: string;
  room: string;
  requestedDate: string;
  status: "pending" | "accepted" | "declined";
}

const mockRooms: Room[] = [
  {
    id: "1",
    name: "Room 101",
    type: "Single • Near Campus",
    price: 15000,
    views: 342,
    status: "Occupied",
  },
  {
    id: "2",
    name: "Room 102",
    type: "Shared • 2 Beds",
    price: 12000,
    views: 289,
    status: "Available",
  },
  {
    id: "3",
    name: "Room 103",
    type: "Single • AC Room",
    price: 18000,
    views: 521,
    status: "Occupied",
  },
  {
    id: "4",
    name: "Room 201",
    type: "Single • Balcony",
    price: 16500,
    views: 198,
    status: "Available",
  },
  {
    id: "5",
    name: "Room 202",
    type: "Shared • 3 beds",
    price: 10000,
    views: 267,
    status: "Available",
  },
];

const mockVisitRequests: VisitRequest[] = [
  {
    id: "1",
    studentName: "Aisha Khan",
    room: "Room 102",
    requestedDate: "Jan 27, 2025",
    status: "pending",
  },
  {
    id: "2",
    studentName: "Rahul Sharma",
    room: "Room 201",
    requestedDate: "Jan 23, 2025",
    status: "pending",
  },
  {
    id: "3",
    studentName: "Priya Patel",
    room: "Room 102",
    requestedDate: "Jan 24, 2025",
    status: "pending",
  },
  {
    id: "4",
    studentName: "Amit Singh",
    room: "Room 202",
    requestedDate: "Jan 25, 2025",
    status: "pending",
  },
];

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [visitRequests, setVisitRequests] =
    useState<VisitRequest[]>(mockVisitRequests);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [newRoomForm, setNewRoomForm] = useState({
    name: "",
    type: "Single",
    price: "",
    description: "",
  });
  const [editRoomForm, setEditRoomForm] = useState({
    name: "",
    type: "Single",
    price: "",
    description: "",
  });

  const totalViews = rooms.reduce((sum, room) => sum + room.views, 0);
  const activeBookings = rooms.filter(
    (room) => room.status === "Occupied",
  ).length;
  const availableRooms = rooms.filter(
    (room) => room.status === "Available",
  ).length;
  const pendingInquiries = visitRequests.filter(
    (req) => req.status === "pending",
  ).length;

  const toggleRoomStatus = (roomId: string) => {
    setRooms(
      rooms.map((room) =>
        room.id === roomId
          ? {
              ...room,
              status: room.status === "Occupied" ? "Available" : "Occupied",
            }
          : room,
      ),
    );
  };

  const handleVisitRequest = (
    requestId: string,
    action: "accept" | "decline",
  ) => {
    setVisitRequests(
      visitRequests.map((req) =>
        req.id === requestId
          ? { ...req, status: action === "accept" ? "accepted" : "declined" }
          : req,
      ),
    );
  };

  const handleAddRoom = () => {
    if (!newRoomForm.name || !newRoomForm.price) {
      addToast("Please fill in all required fields", "warning");
      return;
    }

    const newRoom: Room = {
      id: (Math.max(...rooms.map((r) => parseInt(r.id))) + 1).toString(),
      name: newRoomForm.name,
      type: newRoomForm.type,
      price: parseInt(newRoomForm.price),
      views: 0,
      status: "Available",
    };

    setRooms([...rooms, newRoom]);
    setNewRoomForm({ name: "", type: "Single", price: "", description: "" });
    setShowAddRoomModal(false);
    addToast("Room added successfully!", "success");
  };

  const openEditModal = (room: Room) => {
    setSelectedRoomId(room.id);
    setEditRoomForm({
      name: room.name,
      type: room.type,
      price: room.price.toString(),
      description: "",
    });
    setShowEditRoomModal(true);
  };

  const handleEditRoom = () => {
    if (!editRoomForm.name || !editRoomForm.price) {
      addToast("Please fill in all required fields", "warning");
      return;
    }

    setRooms(
      rooms.map((room) =>
        room.id === selectedRoomId
          ? {
              ...room,
              name: editRoomForm.name,
              type: editRoomForm.type,
              price: parseInt(editRoomForm.price),
            }
          : room,
      ),
    );

    setEditRoomForm({ name: "", type: "Single", price: "", description: "" });
    setSelectedRoomId(null);
    setShowEditRoomModal(false);
    addToast("Room updated successfully!", "success");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Owner Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your boarding rooms and track performance
            </p>
          </div>
          <button
            onClick={() => navigate("/list-property")}
            className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            List New Property
          </button>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {totalViews.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Views</p>
            <p className="text-xs text-green-600 mt-2">+12% from last month</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{activeBookings}</p>
            <p className="text-sm text-gray-600 mt-1">Active Bookings</p>
            <p className="text-xs text-gray-500 mt-2">
              Out of {rooms.length} total rooms
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <Home className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{availableRooms}</p>
            <p className="text-sm text-gray-600 mt-1">Available Rooms</p>
            <p className="text-xs text-blue-600 mt-2">Ready for booking</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {pendingInquiries}
            </p>
            <p className="text-sm text-gray-600 mt-1">Pending Inquiries</p>
            <p className="text-xs text-orange-600 mt-2">Awaiting response</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* My Rooms Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Boarding Rooms
                </h2>
                <button
                  onClick={() => setShowAddRoomModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Room
                </button>
              </div>

              {/* Table Header */}
              <div className="px-6 py-3 bg-gray-50 grid grid-cols-5 gap-4 text-sm font-medium text-gray-600">
                <div className="col-span-2">Room Details</div>
                <div>Price</div>
                <div>Views</div>
                <div>Status</div>
                <div>Actions</div>
              </div>

              {/* Room List */}
              <div className="divide-y divide-gray-200">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="px-6 py-4 grid grid-cols-5 gap-4 items-center hover:bg-gray-50 transition"
                  >
                    <div className="col-span-2 flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Home className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {room.name}
                        </p>
                        <p className="text-sm text-gray-600">{room.type}</p>
                      </div>
                    </div>

                    <div className="text-gray-900 font-medium">
                      LKR {room.price.toLocaleString()}
                    </div>

                    <div className="text-gray-600">{room.views}</div>

                    <div>
                      <button
                        onClick={() => toggleRoomStatus(room.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                          room.status === "Occupied"
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            room.status === "Occupied"
                              ? "bg-gray-600"
                              : "bg-green-600"
                          }`}
                        ></div>
                        {room.status}
                      </button>
                    </div>

                    <div>
                      <button
                        onClick={() => openEditModal(room)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <Pencil className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visit Requests Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Visit Requests
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Recent inquiries from students
                </p>
              </div>

              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {visitRequests
                  .filter((req) => req.status === "pending")
                  .map((request) => (
                    <div key={request.id} className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {request.studentName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {request.studentName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {request.room}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Requested visit on {request.requestedDate}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">2d ago</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleVisitRequest(request.id, "accept")
                          }
                          className="flex-1 py-2 px-3 bg-black text-white rounded-lg hover:bg-gray-800 transition text-sm font-medium"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleVisitRequest(request.id, "decline")
                          }
                          className="flex-1 py-2 px-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}

                {visitRequests.filter((req) => req.status === "pending")
                  .length === 0 && (
                  <div className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      No pending inquiries
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-gray-200 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All Inquiries
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Add Room Modal */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Room</h2>
              <button
                onClick={() => setShowAddRoomModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Room Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name/Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Room 301"
                  value={newRoomForm.name}
                  onChange={(e) =>
                    setNewRoomForm({ ...newRoomForm, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type *
                </label>
                <select
                  value={newRoomForm.type}
                  onChange={(e) =>
                    setNewRoomForm({ ...newRoomForm, type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Single">Single Room</option>
                  <option value="Shared">Shared Room</option>
                  <option value="Studio">Studio</option>
                  <option value="Double">Double Room</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Price (LKR) *
                </label>
                <input
                  type="number"
                  placeholder="e.g., 15000"
                  value={newRoomForm.price}
                  onChange={(e) =>
                    setNewRoomForm({ ...newRoomForm, price: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Add details about the room..."
                  value={newRoomForm.description}
                  onChange={(e) =>
                    setNewRoomForm({
                      ...newRoomForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddRoomModal(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRoom}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditRoomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Edit Room</h3>
              <button
                onClick={() => {
                  setShowEditRoomModal(false);
                  setSelectedRoomId(null);
                  setEditRoomForm({
                    name: "",
                    type: "Single",
                    price: "",
                    description: "",
                  });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Room 101"
                value={editRoomForm.name}
                onChange={(e) =>
                  setEditRoomForm({ ...editRoomForm, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Room Type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Type
              </label>
              <select
                value={editRoomForm.type}
                onChange={(e) =>
                  setEditRoomForm({ ...editRoomForm, type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Single">Single</option>
                <option value="Shared">Shared</option>
                <option value="Studio">Studio</option>
                <option value="Double">Double</option>
              </select>
            </div>

            {/* Monthly Price */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Price (LKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 15000"
                value={editRoomForm.price}
                onChange={(e) =>
                  setEditRoomForm({ ...editRoomForm, price: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Add details about the room..."
                value={editRoomForm.description}
                onChange={(e) =>
                  setEditRoomForm({
                    ...editRoomForm,
                    description: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditRoomModal(false);
                  setSelectedRoomId(null);
                  setEditRoomForm({
                    name: "",
                    type: "Single",
                    price: "",
                    description: "",
                  });
                }}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleEditRoom}
                className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
