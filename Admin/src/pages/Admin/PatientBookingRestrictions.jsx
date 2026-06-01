import { useContext, useEffect, useMemo, useState } from "react";
import { AdminContext } from "../../context/AdminContext";
import MoveUpOnRender from "../../components/MoveUpOnRender";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

const ACCOUNT_STATUSES = [
  { value: "green", label: "Green" },
  { value: "warning", label: "Warning" },
  { value: "restricted", label: "Restricted" },
  { value: "blocked", label: "Blocked" },
];

const statusColor = (status) => {
  if (status === "green") return "text-green-600 bg-green-50";
  if (status === "warning") return "text-amber-600 bg-amber-50";
  if (status === "restricted") return "text-red-600 bg-red-50";
  if (status === "blocked") return "text-white bg-gray-800";
  return "text-gray-600 bg-gray-100";
};

const statusBtnClass = (value, current) => {
  const base =
    "px-1.5 py-0.5 text-[10px] sm:text-xs rounded border transition-colors";
  if (value === current) {
    if (value === "blocked") return `${base} bg-gray-800 text-white border-gray-800`;
    if (value === "restricted") return `${base} bg-red-600 text-white border-red-600`;
    if (value === "warning") return `${base} bg-amber-500 text-white border-amber-500`;
    return `${base} bg-green-600 text-white border-green-600`;
  }
  if (value === "blocked") return `${base} border-gray-400 text-gray-700 hover:bg-gray-100`;
  return `${base} border-gray-200 text-gray-600 hover:bg-gray-50`;
};

const PatientBookingRestrictions = () => {
  const {
    aToken,
    patients,
    getAllPatients,
    applyBookingRestriction,
    liftBookingRestriction,
    updateUserAccountStatus,
  } = useContext(AdminContext);

  const [selectedUser, setSelectedUser] = useState(null);
  const [period, setPeriod] = useState("3_MONTHS");
  const [customDays, setCustomDays] = useState("");
  const [reason, setReason] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (aToken) {
      getAllPatients();
    }
  }, [aToken]);

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;

    return patients.filter(
      (user) =>
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q)
    );
  }, [patients, search]);

  const openApplyModal = (user) => {
    setSelectedUser(user);
    setPeriod("3_MONTHS");
    setCustomDays("");
    setReason("");
    setShowModal(true);
  };

  const handleApply = async () => {
    if (!selectedUser) return;

    const payload = {
      userId: selectedUser._id,
      period,
      reason,
    };

    if (customDays && Number(customDays) > 0) {
      payload.durationDays = Number(customDays);
    }

    const ok = await applyBookingRestriction(payload);
    if (ok) {
      setShowModal(false);
      setSelectedUser(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString();
  };

  return (
    <div className="w-full max-w-7xl m-5">
      <MoveUpOnRender id="admin-patient-restrictions">
        <div className="bg-white border rounded text-sm max-h-[80vh] min-h-[50vh] overflow-y-scroll overflow-x-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-b sticky top-0 bg-white z-10 min-w-[900px]">
            <div>
              <p className="text-lg font-medium">Patient Booking Restrictions</p>
              <span className="text-xs text-gray-400">
                {filteredPatients.length} patient(s)
              </span>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-3 py-2 text-sm border rounded focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="hidden lg:grid grid-cols-[1.8fr_1.8fr_0.8fr_2.2fr_0.6fr_1.2fr_1.4fr] items-center py-3 px-4 border-b font-medium text-gray-700 min-w-[900px]">
            <p>Patient</p>
            <p>Email</p>
            <p>Status</p>
            <p>Change status</p>
            <p>Booked</p>
            <p>Admin ban</p>
            <p>Booking ban</p>
          </div>

          {filteredPatients.map((user) => {
            const adminBan = user.bookingRestriction?.isRestricted;
            const banEnd = user.bookingRestriction?.restrictionEndDate;
            const currentStatus = user.accountStatus || "green";
            const canBook =
              user.bookingStatus?.canBookByAccountStatus !== false &&
              user.bookingStatus?.canBookByCooldown !== false &&
              !adminBan &&
              currentStatus !== "blocked";

            return (
              <div
                key={user._id}
                className="flex flex-wrap lg:grid lg:grid-cols-[1.8fr_1.8fr_0.8fr_2.2fr_0.6fr_1.2fr_1.4fr] gap-2 lg:gap-0 items-center text-gray-600 py-3 px-4 border-b hover:bg-gray-50 min-w-[900px]"
              >
                <div className="flex items-center gap-2 min-w-[120px]">
                  <img
                    className="w-8 h-8 rounded-full object-cover"
                    src={user.image}
                    alt=""
                  />
                  <p className="capitalize font-medium text-gray-800 text-sm">
                    {user.name}
                  </p>
                </div>
                <p className="text-xs truncate">{user.email}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded w-fit capitalize ${statusColor(
                    currentStatus
                  )}`}
                >
                  {currentStatus}
                </span>
                <div className="flex flex-wrap gap-1">
                  {ACCOUNT_STATUSES.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      disabled={currentStatus === value}
                      title={`Set status to ${label}`}
                      onClick={() => updateUserAccountStatus(user._id, value)}
                      className={statusBtnClass(value, currentStatus)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p>{user.totalBookedAppointments ?? 0}</p>
                <div className="text-xs">
                  {adminBan ? (
                    <>
                      <p className="text-red-500 font-medium">Active</p>
                      <p>Until {formatDate(banEnd)}</p>
                    </>
                  ) : (
                    <p className="text-green-600">None</p>
                  )}
                  {!canBook && !adminBan && currentStatus !== "blocked" && (
                    <p className="text-amber-600 mt-1">Cooldown</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {adminBan ? (
                    <button
                      type="button"
                      onClick={() => liftBookingRestriction(user._id)}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Lift ban
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openApplyModal(user)}
                      className="px-3 py-1 text-xs bg-primary text-white rounded hover:opacity-90"
                    >
                      Apply ban
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredPatients.length === 0 && (
            <p className="p-8 text-center text-gray-400">
              {search.trim()
                ? "No patients match your search"
                : "No patients found"}
            </p>
          )}
        </div>
      </MoveUpOnRender>

      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <h2 className="text-lg font-medium mb-1">Apply booking restriction</h2>
            <p className="text-sm text-gray-500 mb-4 capitalize">
              {selectedUser.name} ({selectedUser.email})
            </p>

            <label className="block text-sm font-medium mb-1">Period</label>
            <select
              className="w-full border rounded px-3 py-2 mb-3 text-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="2_MONTHS">2 months (60 days)</option>
              <option value="3_MONTHS">3 months (90 days)</option>
              <option value="6_MONTHS">6 months (180 days)</option>
            </select>

            <label className="block text-sm font-medium mb-1">
              Custom days (optional)
            </label>
            <input
              type="number"
              min="1"
              placeholder="Overrides period if set"
              className="w-full border rounded px-3 py-2 mb-3 text-sm"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
            />

            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea
              className="w-full border rounded px-3 py-2 mb-4 text-sm"
              rows={3}
              placeholder="Policy violation, no-shows, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="px-4 py-2 text-sm bg-primary text-white rounded"
              >
                Apply restriction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientBookingRestrictions;
