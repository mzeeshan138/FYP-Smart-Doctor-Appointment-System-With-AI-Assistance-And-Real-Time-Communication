import { useContext, useEffect, useMemo, useState } from "react";
import { AdminContext } from "../../context/AdminContext";
import MoveUpOnRender from "../../components/MoveUpOnRender";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

const statusColor = (status) => {
  if (status === "green") return "text-green-600 bg-green-50";
  if (status === "warning") return "text-amber-600 bg-amber-50";
  if (status === "restricted") return "text-red-600 bg-red-50";
  if (status === "blocked") return "text-white bg-gray-800";
  return "text-gray-600 bg-gray-100";
};

const AllPatients = () => {
  const { aToken, patients, getAllPatients, deletePatient } =
    useContext(AdminContext);
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

  const handleDeletePatient = (user) => {
    const confirmed = window.confirm(
      `Delete patient "${user.name}" (${user.email})?\n\nRemoved: profile, appointments, conversations, messages.\nKept: Stripe payment records (for audit).`
    );
    if (confirmed) {
      deletePatient(user._id);
    }
  };

  return (
    <div className="w-full max-w-7xl m-5">
      <MoveUpOnRender id="admin-all-patients">
        <div className="bg-white rounded border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-b">
            <div>
              <p className="text-lg font-medium">All Patients</p>
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

          <div className="text-sm max-h-[80vh] min-h-[60vh] overflow-y-auto">
            <div className="hidden sm:grid grid-cols-[0.4fr_2fr_2fr_1fr_1fr_0.6fr] items-center py-3 px-6 border-b font-medium text-gray-700 bg-gray-50 sticky top-0">
              <p>#</p>
              <p>Patient</p>
              <p>Email</p>
              <p>Phone</p>
              <p>Status</p>
              <p>Action</p>
            </div>

            {filteredPatients.map((user, index) => (
              <div
                key={user._id}
                className="flex flex-wrap sm:grid sm:grid-cols-[0.4fr_2fr_2fr_1fr_1fr_0.6fr] gap-2 sm:gap-0 items-center text-gray-600 py-3 px-6 border-b hover:bg-gray-50"
              >
                <p className="max-sm:hidden text-gray-400">{index + 1}</p>
                <div className="flex items-center gap-2 min-w-[140px]">
                  <img
                    className="w-8 h-8 rounded-full object-cover"
                    src={user.image}
                    alt=""
                  />
                  <p className="capitalize font-medium text-gray-800">
                    {user.name}
                  </p>
                </div>
                <p className="text-xs sm:text-sm truncate">{user.email}</p>
                <p className="text-xs sm:text-sm">{user.phone || "—"}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded w-fit capitalize ${statusColor(
                    user.accountStatus
                  )}`}
                >
                  {user.accountStatus || "green"}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeletePatient(user)}
                  className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 w-fit"
                >
                  Delete
                </button>
              </div>
            ))}

            {filteredPatients.length === 0 && (
              <p className="p-8 text-center text-gray-400">
                {search.trim()
                  ? "No patients match your search"
                  : "No patients found"}
              </p>
            )}
          </div>
        </div>
      </MoveUpOnRender>
    </div>
  );
};

export default AllPatients;
