import { useContext, useEffect, useMemo, useState } from "react";
import { AdminContext } from "../../context/AdminContext";
import { AppContext } from "../../context/AppContext";
import MoveUpOnRender from "../../components/MoveUpOnRender";
import { useNavigate } from "react-router-dom";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

const DoctorsList = () => {
  const { doctors, aToken, getAllDoctors, changeAvailability, deleteDoctor } =
    useContext(AdminContext);
  const { currency } = useContext(AppContext);
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (aToken) {
      getAllDoctors();
    }
  }, [aToken]);

  const filteredDoctors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return doctors;

    return doctors.filter(
      (doc) =>
        doc.name?.toLowerCase().includes(q) ||
        doc.email?.toLowerCase().includes(q)
    );
  }, [doctors, search]);

  const handleDeleteDoctor = (doc) => {
    const confirmed = window.confirm(
      `Delete doctor "${doc.name}" (${doc.email})?`
    );
    if (confirmed) {
      deleteDoctor(doc._id);
    }
  };

  return (
    <div className="w-full max-w-7xl m-5">
      <MoveUpOnRender id="admin-doctorlist">
        <div className="bg-white rounded border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-b">
            <div>
              <p className="text-lg font-medium">All Doctors</p>
              <span className="text-xs text-gray-400">
                {filteredDoctors.length} doctor(s)
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

          <div className="text-sm max-h-[80vh] min-h-[60vh] overflow-y-auto overflow-x-auto">
            <div className="hidden lg:grid grid-cols-[0.4fr_2fr_2fr_1.2fr_0.8fr_0.8fr_1.4fr] items-center py-3 px-6 border-b font-medium text-gray-700 bg-gray-50 sticky top-0 min-w-[800px]">
              <p>#</p>
              <p>Doctor</p>
              <p>Email</p>
              <p>Speciality</p>
              <p>Fees</p>
              <p>Available</p>
              <p>Actions</p>
            </div>

            {filteredDoctors.map((item, index) => (
              <div
                key={item._id}
                className="flex flex-wrap lg:grid lg:grid-cols-[0.4fr_2fr_2fr_1.2fr_0.8fr_0.8fr_1.4fr] gap-2 lg:gap-0 items-center text-gray-600 py-3 px-6 border-b hover:bg-gray-50 min-w-[800px]"
              >
                <p className="max-lg:hidden text-gray-400">{index + 1}</p>
                <div className="flex items-center gap-2 min-w-[160px]">
                  <img
                    className="w-10 h-10 rounded-full object-cover bg-indigo-50"
                    src={item.image}
                    alt=""
                  />
                  <p className="capitalize font-medium text-gray-800">
                    {item.name}
                  </p>
                </div>
                <p className="text-xs lg:text-sm truncate">{item.email}</p>
                <p className="text-xs lg:text-sm">{item.speciality}</p>
                <p className="text-xs lg:text-sm">
                  {currency}
                  {item.fees}
                </p>
                <label className="flex items-center gap-1.5 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={item.available}
                    onChange={() => changeAvailability(item._id)}
                  />
                  <span className="text-xs">
                    {item.available ? "Yes" : "No"}
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/edit-doctor/${item._id}`)}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteDoctor(item)}
                    className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            {filteredDoctors.length === 0 && (
              <p className="p-8 text-center text-gray-400">
                {search.trim()
                  ? "No doctors match your search"
                  : "No doctors found"}
              </p>
            )}
          </div>
        </div>
      </MoveUpOnRender>
    </div>
  );
};

export default DoctorsList;
