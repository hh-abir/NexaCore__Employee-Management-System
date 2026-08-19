"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  X, 
  Calendar as CalendarIcon, 
  ShieldCheck, 
  AlertCircle, 
  Sparkles, 
  Tv, 
  Wifi, 
  Video, 
  DoorOpen, 
  Search, 
  Filter,
  Check,
  Ban,
  Layers,
  FileText
} from "lucide-react";
import { useToast } from "@/components/Toast";

interface MeetingRoom {
  id: string;
  name: string;
  floor: string;
  capacity: number;
  amenities: string[];
  status: "AVAILABLE" | "MAINTENANCE";
}

interface RoomBooking {
  id: string;
  roomId: string;
  room: MeetingRoom;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

async function safeJson(res: Response) {
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return {};
    }
  }
  return {};
}

export default function MeetingRoomsPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionLoading } = useSession();
  const { toast } = useToast();

  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [bookings, setBookings] = useState<RoomBooking[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter Tabs
  const [bookingTab, setBookingTab] = useState<"ALL" | "PENDING" | "APPROVED" | "MY_BOOKINGS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(new Date().toISOString().slice(0, 10));

  // Reserve Modal State
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reserveRoomId, setReserveRoomId] = useState("");
  const [reserveTitle, setReserveTitle] = useState("");
  const [reserveDesc, setReserveDesc] = useState("");
  const [reserveDate, setReserveDate] = useState(new Date().toISOString().slice(0, 10));
  const [reserveStartTime, setReserveStartTime] = useState("10:00");
  const [reserveEndTime, setReserveEndTime] = useState("11:00");
  const [reserveAttendees, setReserveAttendees] = useState("4");
  const [submittingBooking, setSubmittingBooking] = useState(false);

  // Add Room Modal State (HR Only)
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomFloor, setNewRoomFloor] = useState("");
  const [newRoomCapacity, setNewRoomCapacity] = useState("8");
  const [newRoomAmenities, setNewRoomAmenities] = useState<string[]>(["4K Video Display", "Whiteboard", "High-Speed WiFi"]);
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Review Modal State (HR Only)
  const [reviewBookingItem, setReviewBookingItem] = useState<RoomBooking | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewNote, setReviewNote] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !sessionData) {
      router.push("/login");
    }
  }, [sessionData, sessionLoading, router]);

  useEffect(() => {
    if (sessionData) {
      fetchRoomsAndBookings();
    }
  }, [sessionData]);

  const fetchRoomsAndBookings = async () => {
    setLoading(true);
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/rooms`, { credentials: "include" }),
        fetch(`${API_BASE_URL}/api/rooms/bookings`, { credentials: "include" })
      ]);

      if (roomsRes.ok) {
        const data = await safeJson(roomsRes);
        setRooms(data.rooms || []);
        if (data.rooms?.length > 0 && !reserveRoomId) {
          setReserveRoomId(data.rooms[0].id);
        }
      }

      if (bookingsRes.ok) {
        const data = await safeJson(bookingsRes);
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to load room data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveRoomId || !reserveTitle.trim() || !reserveDate || !reserveStartTime || !reserveEndTime) {
      toast.error("Please fill in all required booking details.");
      return;
    }

    setSubmittingBooking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: reserveRoomId,
          title: reserveTitle.trim(),
          description: reserveDesc.trim() || undefined,
          date: reserveDate,
          startTime: reserveStartTime,
          endTime: reserveEndTime,
          attendees: parseInt(reserveAttendees) || 2
        }),
        credentials: "include"
      });
      const data = await safeJson(res);

      if (res.ok) {
        toast.success(data.message || "Meeting room requested! HR notified.");
        setShowReserveModal(false);
        setReserveTitle("");
        setReserveDesc("");
        fetchRoomsAndBookings();
      } else {
        toast.error(data.error || "Failed to book meeting room.");
      }
    } catch (err) {
      console.error("Booking error:", err);
      toast.error("Internal server error.");
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleReviewBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBookingItem) return;

    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/bookings/${reviewBookingItem.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewStatus,
          reviewNote: reviewNote.trim() || undefined
        }),
        credentials: "include"
      });
      const data = await safeJson(res);

      if (res.ok) {
        toast.success(`Booking ${reviewStatus.toLowerCase()} successfully!`);
        setReviewBookingItem(null);
        setReviewNote("");
        fetchRoomsAndBookings();
      } else {
        toast.error(data.error || "Failed to update booking status.");
      }
    } catch (err) {
      console.error("Review error:", err);
      toast.error("Internal server error.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        credentials: "include"
      });
      const data = await safeJson(res);
      if (res.ok) {
        toast.success("Reservation cancelled.");
        fetchRoomsAndBookings();
      } else {
        toast.error(data.error || "Failed to cancel booking.");
      }
    } catch (err) {
      toast.error("Internal server error.");
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !newRoomFloor.trim()) {
      toast.error("Room name and floor location are required.");
      return;
    }

    setCreatingRoom(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName.trim(),
          floor: newRoomFloor.trim(),
          capacity: parseInt(newRoomCapacity) || 8,
          amenities: newRoomAmenities,
          status: "AVAILABLE"
        }),
        credentials: "include"
      });
      const data = await safeJson(res);

      if (res.ok) {
        toast.success("New meeting room registered!");
        setShowAddRoomModal(false);
        setNewRoomName("");
        setNewRoomFloor("");
        fetchRoomsAndBookings();
      } else {
        toast.error(data.error || "Failed to create meeting room.");
      }
    } catch (err) {
      toast.error("Internal server error.");
    } finally {
      setCreatingRoom(false);
    }
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Tab filter
      if (bookingTab === "PENDING" && b.status !== "PENDING") return false;
      if (bookingTab === "APPROVED" && b.status !== "APPROVED") return false;
      if (bookingTab === "MY_BOOKINGS" && b.userId !== sessionData?.user?.id) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchRoom = b.room?.name.toLowerCase().includes(q);
        const matchUser = b.user?.name.toLowerCase().includes(q);
        if (!matchTitle && !matchRoom && !matchUser) return false;
      }
      return true;
    });
  }, [bookings, bookingTab, searchQuery, sessionData]);

  const isHr = sessionData?.user?.role === "HR";
  const pendingBookingsCount = bookings.filter(b => b.status === "PENDING").length;
  const approvedBookingsToday = bookings.filter(b => b.status === "APPROVED" && b.date === new Date().toISOString().slice(0, 10)).length;

  if (sessionLoading || !sessionData) return null;

  return (
    <div className="flex-grow flex flex-col space-y-6 font-sans text-slate-900 dark:text-white transition-colors duration-150 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Meeting Rooms & Suites</span>
            <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 font-extrabold uppercase px-2.5 py-0.5 rounded-full">
              Reservation Hub
            </span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
            Check live floor availability, reserve collaborative suites & manage HR approvals
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isHr && (
            <button
              onClick={() => setShowAddRoomModal(true)}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-900 dark:text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <Building2 className="h-4 w-4 text-indigo-500" />
              <span>Register Room</span>
            </button>
          )}

          <button
            onClick={() => setShowReserveModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Reserve Meeting Room</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Meeting Suites</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{rooms.length}</span>
            <Building2 className="h-6 w-6 text-indigo-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Across Campus Floors</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Available Suites</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {rooms.filter(r => r.status === "AVAILABLE").length}
            </span>
            <DoorOpen className="h-6 w-6 text-emerald-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Ready for Collaboration</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Pending Approvals</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{pendingBookingsCount}</span>
            <Clock className="h-6 w-6 text-amber-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Awaiting HR Review</div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-slate-100 dark:border-zinc-900 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Today's Sessions</span>
          <div className="flex justify-between items-end">
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{approvedBookingsToday}</span>
            <Video className="h-6 w-6 text-blue-500 opacity-75" />
          </div>
          <div className="text-[10px] text-slate-400 font-semibold">Approved Meetings Today</div>
        </div>
      </div>

      {/* Corporate Meeting Rooms Gallery */}
      <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-7 shadow-xs space-y-5">
        <div className="flex justify-between items-center border-b border-slate-50 dark:border-zinc-900 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-500" />
            Corporate Meeting Suites Gallery
          </h2>
          <span className="text-xs text-slate-400 font-semibold">
            {rooms.length} Suites Registered
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {rooms.map(room => (
            <div 
              key={room.id}
              className="p-5 rounded-2xl border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all group"
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-start">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                    room.status === "AVAILABLE" 
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400" 
                      : "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400"
                  }`}>
                    {room.status}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Up to {room.capacity} seats
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {room.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                    {room.floor}
                  </p>
                </div>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {room.amenities.map((am, i) => (
                    <span key={i} className="text-[9px] font-semibold bg-white dark:bg-zinc-950 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-zinc-800 text-slate-600 dark:text-zinc-400">
                      {am}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setReserveRoomId(room.id);
                  setShowReserveModal(true);
                }}
                disabled={room.status === "MAINTENANCE"}
                className="w-full bg-slate-200/70 hover:bg-zinc-950 hover:text-white dark:bg-zinc-800 dark:hover:bg-white dark:hover:text-zinc-950 font-bold py-2 px-3 rounded-xl text-xs cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {room.status === "MAINTENANCE" ? "Under Maintenance" : "Book This Suite"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Reservations Ledger & HR Approval Queue */}
      <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-3xl p-7 shadow-xs space-y-6">
        
        {/* Controls Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-50 dark:border-zinc-900 pb-4">
          <div className="relative flex items-center w-full sm:w-80 bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
            <Search className="h-3.5 w-3.5 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search meeting, room, organizer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs outline-none text-zinc-900 dark:text-white w-full font-medium"
            />
          </div>

          <div className="flex bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl gap-1 text-[11px] font-bold">
            <button
              onClick={() => setBookingTab("ALL")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                bookingTab === "ALL" 
                  ? "bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setBookingTab("PENDING")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                bookingTab === "PENDING" 
                  ? "bg-amber-600 text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Pending HR ({pendingBookingsCount})
            </button>
            <button
              onClick={() => setBookingTab("APPROVED")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                bookingTab === "APPROVED" 
                  ? "bg-emerald-600 text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Approved ({bookings.filter(b => b.status === "APPROVED").length})
            </button>
            <button
              onClick={() => setBookingTab("MY_BOOKINGS")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                bookingTab === "MY_BOOKINGS" 
                  ? "bg-indigo-600 text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              My Bookings
            </button>
          </div>
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold">Loading reservations...</div>
        ) : filteredBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-zinc-900 text-slate-400 uppercase text-[9px] font-black tracking-wider">
                  <th className="pb-3">Meeting & Room</th>
                  <th className="pb-3">Organizer</th>
                  <th className="pb-3">Date & Slot</th>
                  <th className="pb-3">Attendees</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-900">
                {filteredBookings.map(b => {
                  const isMe = b.userId === sessionData.user.id;
                  const isPending = b.status === "PENDING";

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                      <td className="py-4">
                        <div className="font-extrabold text-slate-900 dark:text-white">{b.title}</div>
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                          {b.room?.name} &bull; <span className="text-slate-400">{b.room?.floor}</span>
                        </div>
                        {b.description && (
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">
                            "{b.description}"
                          </p>
                        )}
                      </td>

                      <td className="py-4">
                        <div className="font-bold text-slate-900 dark:text-white">{b.user?.name}</div>
                        <div className="text-[10px] text-slate-400 font-semibold">{b.user?.role}</div>
                      </td>

                      <td className="py-4 font-mono font-bold text-slate-800 dark:text-zinc-200">
                        <div>{b.date}</div>
                        <div className="text-[10px] text-indigo-600 dark:text-indigo-400">{b.startTime} - {b.endTime}</div>
                      </td>

                      <td className="py-4 font-bold text-slate-700 dark:text-zinc-300">
                        {b.attendees} People
                      </td>

                      <td className="py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-1 ${
                          b.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400"
                            : b.status === "PENDING"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400"
                            : b.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400"
                            : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}>
                          {b.status}
                        </span>
                        {b.reviewNote && (
                          <div className="text-[9px] text-slate-400 mt-1 max-w-xs truncate">
                            Note: {b.reviewNote}
                          </div>
                        )}
                      </td>

                      <td className="py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {/* HR Decision Controls */}
                          {isHr && isPending && (
                            <>
                              <button
                                onClick={() => {
                                  setReviewBookingItem(b);
                                  setReviewStatus("APPROVED");
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-3 rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setReviewBookingItem(b);
                                  setReviewStatus("REJECTED");
                                }}
                                className="bg-slate-200 dark:bg-zinc-800 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-zinc-300 font-bold py-1 px-3 rounded-lg text-xs cursor-pointer transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Cancellation for Requester or HR */}
                          {(isMe || isHr) && b.status !== "CANCELLED" && b.status !== "REJECTED" && (
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer p-1 text-[11px] font-bold"
                              title="Cancel Reservation"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 dark:border-zinc-900 rounded-2xl text-xs">
            No meeting room reservations found.
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* MODAL: RESERVE MEETING ROOM                              */}
      {/* ======================================================== */}
      {showReserveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Reserve Corporate Suite
                </h3>
              </div>
              <button
                onClick={() => setShowReserveModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBookRoom} className="space-y-4">
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200/40 dark:border-indigo-900/40 text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-indigo-500" />
                <span>Fair Usage: Users can only hold 1 active room booking per time slot.</span>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Select Meeting Suite *
                </label>
                <select
                  value={reserveRoomId}
                  onChange={(e) => setReserveRoomId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                >
                  {rooms.map(r => (
                    <option key={r.id} value={r.id} disabled={r.status === "MAINTENANCE"}>
                      {r.name} ({r.floor}) - Cap: {r.capacity} {r.status === "MAINTENANCE" ? "[Maintenance]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Meeting Title / Purpose *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Sprint Planning or Client Architecture Review"
                  value={reserveTitle}
                  onChange={(e) => setReserveTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={reserveDate}
                    onChange={(e) => setReserveDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={reserveStartTime}
                    onChange={(e) => setReserveStartTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={reserveEndTime}
                    onChange={(e) => setReserveEndTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Expected Attendees
                </label>
                <input
                  type="number"
                  min={1}
                  value={reserveAttendees}
                  onChange={(e) => setReserveAttendees(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Agenda Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Equipment needed, meeting agenda, or visitor count..."
                  value={reserveDesc}
                  onChange={(e) => setReserveDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowReserveModal(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  {submittingBooking ? "Checking Availability..." : "Submit Reservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: HR APPROVE / REJECT BOOKING                       */}
      {/* ======================================================== */}
      {reviewBookingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Authorize Meeting Suite Reservation
              </h3>
              <button onClick={() => setReviewBookingItem(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Suite:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{reviewBookingItem.room?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Organizer:</span>
                <span className="font-bold text-slate-900 dark:text-white">{reviewBookingItem.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Time Window:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {reviewBookingItem.date} ({reviewBookingItem.startTime} - {reviewBookingItem.endTime})
                </span>
              </div>
            </div>

            <form onSubmit={handleReviewBooking} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Authorization Decision
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus("APPROVED")}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold cursor-pointer border transition-all ${
                      reviewStatus === "APPROVED"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800"
                    }`}
                  >
                    ✓ Approve Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus("REJECTED")}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold cursor-pointer border transition-all ${
                      reviewStatus === "REJECTED"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-slate-50 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800"
                    }`}
                  >
                    ✕ Reject Booking
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">
                  Feedback / Approval Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Approved. Keys with reception or Conflicting executive meeting..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setReviewBookingItem(null)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className={`font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs text-white ${
                    reviewStatus === "APPROVED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {submittingReview ? "Submitting..." : `Confirm ${reviewStatus}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REGISTER NEW MEETING SUITE (HR ONLY)              */}
      {/* ======================================================== */}
      {showAddRoomModal && isHr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-900 rounded-2xl shadow-xl max-w-md w-full p-6 text-left space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-zinc-900">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Register Corporate Meeting Suite</h3>
              <button onClick={() => setShowAddRoomModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Room Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ada Lovelace Executive Hub"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Floor Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Floor 4 (East Wing)"
                    value={newRoomFloor}
                    onChange={(e) => setNewRoomFloor(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min={2}
                    required
                    value={newRoomCapacity}
                    onChange={(e) => setNewRoomCapacity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-zinc-950 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-50 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="bg-slate-50 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 text-slate-500 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRoom}
                  className="bg-zinc-950 hover:bg-zinc-900 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold py-1.5 px-4 rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  {creatingRoom ? "Registering..." : "Register Suite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
