import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import RelatedDoctors from "../components/RelatedDoctors";
import { toast } from "react-toastify";
import axios from "axios";
import SlotSelector from "../components/SlotSelector";

const Appointment = () => {
  const { docId } = useParams();
  const { doctors, currencySymbol, token, backendUrl, clearAuth } =
    useContext(AppContext);
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  const [docInfo, setDocInfo] = useState(null);
  const [docSlots, setDocSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [slotTime, setSlotTime] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(false);

  const redirectToLogin = () => {
    toast.warn("Please login to book an appointment");
    navigate("/login", { state: { from: location.pathname } });
  };

  useEffect(() => {
    fetchDocInfo();
  }, [doctors, docId]);

  useEffect(() => {
    getAvailableSlots();
  }, [docInfo]);

  const fetchDocInfo = async () => {
    const docInfo = doctors.find((doc) => doc._id === docId);
    setDocInfo(docInfo);
  };

  const checkSlotAvailable = (docInfo, slotDate, slotTime) => {
    if (!docInfo || !docInfo.slots_booked) return true;
    return !docInfo.slots_booked?.[slotDate]?.includes(slotTime);
  };

  const getAvailableSlots = async () => {
    setDocSlots([]);

    const today = new Date();
    const generateSlotDate = (date) =>
      `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      const endTime = new Date(currentDate);
      endTime.setHours(21, 0, 0, 0);

      if (i === 0) {
        currentDate.setHours(Math.max(currentDate.getHours() + 1, 10));
        currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0);
      } else {
        currentDate.setHours(10, 0, 0, 0);
      }

      const timeSlots = [];

      while (currentDate < endTime) {
        const formattedTime = currentDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        const slotDate = generateSlotDate(currentDate);
        const isAvailable = checkSlotAvailable(
          docInfo,
          slotDate,
          formattedTime
        );

        if (isAvailable) {
          timeSlots.push({
            datetime: new Date(currentDate),
            time: formattedTime,
          });
        }

        currentDate.setMinutes(currentDate.getMinutes() + 30);
      }

      if (timeSlots.length === 0) {
        timeSlots.push({ datetime: new Date(currentDate), time: false });
      }

      setDocSlots((prev) => [...prev, timeSlots]);
    }
  };

  const bookAppointment = async () => {
    if (!token) {
      redirectToLogin();
      return;
    }

    if (!slotTime) {
      toast.error("Please select a slot time");
      return;
    }

    setBooking(true);
    try {
      const date = docSlots[slotIndex][0].datetime;
      const slotDate = `${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}`;

      const { data } = await axios.post(
        backendUrl + "/api/user/stripe/create-deposit-session",
        { docId, slotDate, slotTime },
        { headers: { token } }
      );

      if (data.success && data.url) {
        const payLabel = data.stripeCurrency
          ? `$${data.stripeAmount} USD`
          : `${currencySymbol}${data.depositAmountRs}`;
        toast.info(`Pay ${payLabel} deposit (10%) on Stripe to confirm booking`);
        window.location.href = data.url;
        return;
      }

      const message = data.message || "Unable to start payment";

      if (
        message.toLowerCase().includes("not authorized") ||
        message.toLowerCase().includes("login again")
      ) {
        clearAuth();
        redirectToLogin();
        return;
      }

      toast.error(message);
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || "Booking failed";

      if (
        message.toLowerCase().includes("not authorized") ||
        message.toLowerCase().includes("login again")
      ) {
        clearAuth();
        redirectToLogin();
        return;
      }

      toast.error(message);
    } finally {
      setBooking(false);
    }
  };

  const depositRs = docInfo
    ? Math.round(docInfo.fees * 0.1 * 100) / 100
    : 0;

  return (
    docInfo && (
      <div className="max-w-2xl mx-auto py-3 px-2 sm:px-4">
        {/* Doctor card — compact */}
        <div className="flex gap-3 sm:gap-4 items-start bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
          <img
            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg bg-primary shrink-0"
            src={docInfo.image}
            alt={docInfo.name}
          />

          <div className="flex-1 min-w-0">
            <p className="flex items-center gap-1.5 text-base sm:text-lg font-semibold text-gray-900 truncate">
              {docInfo.name}
              <img className="w-4 shrink-0" src={assets.verified_icon} alt="" />
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              {docInfo.degree} · {docInfo.speciality}
            </p>
            <span className="inline-block mt-1 text-[10px] sm:text-xs border px-2 py-0.5 rounded-full text-gray-500">
              {docInfo.experience}
            </span>
            <p className="text-xs text-gray-500 mt-2 line-clamp-2">
              {docInfo.about}
            </p>
            <p className="text-xs sm:text-sm font-medium text-gray-700 mt-2">
              Fee: {currencySymbol}
              {docInfo.fees}
              <span className="text-blue-600 font-normal ml-1">
                · Deposit {currencySymbol}
                {depositRs} (10%)
              </span>
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              Charged in USD on Stripe sandbox. Pay remaining 90% later in My
              Appointments.
            </p>
          </div>
        </div>

        {/* Booking slots — compact */}
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-2">Select date</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {docSlots.map((item, index) => (
              <button
                type="button"
                onClick={() => setSlotIndex(index)}
                className={`text-center py-2 px-3 min-w-[44px] rounded-lg text-xs shrink-0 transition ${
                  slotIndex === index
                    ? "bg-primary text-white"
                    : "border border-gray-200 text-gray-600 hover:border-primary"
                }`}
                key={index}
              >
                <p className="font-medium">
                  {item[0] && daysOfWeek[item[0].datetime.getDay()]}
                </p>
                <p>{item[0] && item[0].datetime.getDate()}</p>
              </button>
            ))}
          </div>

          <p className="text-sm font-medium text-gray-700 mt-3 mb-1">
            Select time
          </p>
          <SlotSelector
            docSlots={docSlots}
            slotIndex={slotIndex}
            slotTime={slotTime}
            setSlotTime={setSlotTime}
          />

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              type="button"
              onClick={bookAppointment}
              disabled={booking}
              className="bg-primary text-white text-xs sm:text-sm px-5 py-2 rounded-full disabled:opacity-60"
            >
              {booking ? "Opening Stripe..." : "Pay 10% & Book"}
            </button>
            {token && (
              <Link
                to="/chat"
                state={{ doctor: docInfo }}
                className="text-xs sm:text-sm px-4 py-2 rounded-full border border-green-500 text-green-600 hover:bg-green-50"
              >
                Message Doctor
              </Link>
            )}
          </div>

          {!token && (
            <p className="text-xs text-orange-600 mt-2">
              Login required to book an appointment.
            </p>
          )}
        </div>

        <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
      </div>
    )
  );
};

export default Appointment;
