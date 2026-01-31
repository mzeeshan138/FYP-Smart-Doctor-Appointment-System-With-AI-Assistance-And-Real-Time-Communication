import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types"; // ✅ Import PropTypes

export default function DoctorCard({ doctor }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center border rounded-lg p-3 shadow-sm bg-white hover:shadow-lg transition-shadow space-x-3">
      <img
        src={doctor.image}
        alt={doctor.name}
        className="w-16 h-16 rounded-full object-cover border"
      />
      <div className="flex-1">
        <h4 className="font-semibold">{doctor.name}</h4>
        <p className="text-sm text-gray-500">{doctor.speciality}</p>
        <p className="text-sm">Experience: {doctor.experience}</p>
        <p className="text-sm text-gray-600">Fees: ${doctor.fees}</p>
      </div>
      <button
        onClick={() => navigate(`/appointment/${doctor._id}`)}
        className="bg-green-600 text-white py-1 px-3 rounded hover:bg-green-700 transition-colors"
      >
        Book
      </button>
    </div>
  );
}

// ✅ PropTypes validation to fix ESLint warnings
DoctorCard.propTypes = {
  doctor: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string,       // ESLint warning for doctor.image fixed
    speciality: PropTypes.string,
    experience: PropTypes.string,
    fees: PropTypes.number,
  }).isRequired,
};
