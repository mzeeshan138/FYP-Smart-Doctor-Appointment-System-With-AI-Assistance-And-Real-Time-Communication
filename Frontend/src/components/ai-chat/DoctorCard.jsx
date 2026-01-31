import { useNavigate } from "react-router-dom";

export default function DoctorCard({ doctor }) {
  const navigate = useNavigate();

  return (
    <div className="border rounded-lg p-3 shadow-sm bg-white">
      <h4 className="font-semibold">{doctor.name}</h4>
      <p className="text-sm text-gray-500">{doctor.speciality}</p>
      <p className="text-sm">Experience: {doctor.experience} yrs</p>

      <button
        onClick={() => navigate(`/appointment/${doctor._id}`)}
        className="mt-2 w-full bg-green-600 text-white py-1 rounded"
      >
        Book Appointment
      </button>
    </div>
  );
}
