import { useContext, useEffect, useState } from "react";
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
  const daysOfWeek = ["SUN", "MON", "TUE", "WEND", "THE", "FRI", "SAT"];

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
      const headers = { token };

      const validateRes = await axios.post(
        backendUrl + "/api/user/validate-booking",
        { docId, slotDate, slotTime },
        { headers }
      );

      if (!validateRes.data.success) {
        toast.error(validateRes.data.message);
        return;
      }

      const { data } = await axios.post(
        backendUrl + "/api/user/stripe/create-deposit-session",
        { docId, slotDate, slotTime },
        { headers }
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
      <div>
        {/* Doctor details — full width layout */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <img
              className="bg-primary w-full sm:max-w-72 rounded-lg"
              src={docInfo.image}
              alt={docInfo.name}
            />
          </div>

          <div className="flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[80px] sm:mt-0">
            <p className="flex items-center gap-2 text-2xl font-medium text-gray-900">
              {docInfo.name}
              <img className="w-5" src={assets.verified_icon} alt="" />
            </p>
            <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
              <p>
                {docInfo.degree} - {docInfo.speciality}
              </p>
              <button
                type="button"
                className="py-0.5 px-2 border text-xs rounded-full"
              >
                {docInfo.experience}
              </button>
            </div>

            <div>
              <p className="flex items-center gap-1 text-sm font-medium text-gray-900 mt-3">
                About <img src={assets.info_icon} alt="" />
              </p>
              <p className="text-sm text-gray-500 max-w-[700px] mt-1">
                {docInfo.about}
              </p>
            </div>

            <p className="text-gray-500 font-medium mt-4">
              Appointment fee:{" "}
              <span className="text-gray-600">
                {currencySymbol}
                {docInfo.fees}
              </span>
            </p>
            <p className="text-sm text-blue-600 mt-2">
              10% deposit ({currencySymbol}
              {depositRs}) via Stripe to book. Pay remaining 90% later in My
              Appointments.
            </p>
          </div>
        </div>

        {/* Booking slots — aligned with doctor image column */}
        <div className="sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700">
          <p>Booking slots</p>
          <div className="flex gap-3 items-center w-full overflow-x-scroll mt-4">
            {docSlots.length > 0 &&
              docSlots.map((item, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setSlotIndex(index)}
                  className={`text-center py-6 min-w-16 rounded-full cursor-pointer transition ${
                    slotIndex === index
                      ? "bg-primary text-white"
                      : "border border-gray-200"
                  }`}
                >
                  <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                  <p>{item[0] && item[0].datetime.getDate()}</p>
                </button>
              ))}
          </div>

          <SlotSelector
            docSlots={docSlots}
            slotIndex={slotIndex}
            slotTime={slotTime}
            setSlotTime={setSlotTime}
          />

          <button
            type="button"
            onClick={bookAppointment}
            disabled={booking}
            className="bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-5 disabled:opacity-60"
          >
            {booking ? "Redirecting to payment..." : "Pay 10% & Book Appointment"}
          </button>

          {token && (
            <Link
              to="/chat"
              state={{ doctor: docInfo }}
              className="inline-block ml-4 bg-green-500 text-white text-sm font-light px-10 py-3 rounded-full my-5"
            >
              Message Doctor
            </Link>
          )}

          {!token && (
            <p className="text-sm text-orange-600 mb-4">
              You must login before booking an appointment.
            </p>
          )}
        </div>

        <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
      </div>
    )
  );
};

export default Appointment;
