import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import MoveUpOnRender from "../components/MoveUpOnRender";

const MyAppointments = () => {
  const { backendUrl, token, currencySymbol, getDoctorsData, clearAuth } =
    useContext(AppContext);
  const [appointments, setAppointments] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const months = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const slotDateFormat = (slotDate) => {
    const dataArray = slotDate.split("_");
    return (
      dataArray[0] + " " + months[Number(dataArray[1])] + " " + dataArray[2]
    );
  };

  const getUserAppointments = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/appointments", {
        headers: { token },
      });

      if (data.success) {
        setAppointments(data.appointments.reverse());
      }
    } catch (error) {
      console.log("error:", error);
      toast.error(error.message);
    }
  };

  const verifyStripeReturn = async (sessionId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/stripe/verify-session",
        { sessionId },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
        getDoctorsData();
      } else {
        const message = data.message || "Payment verification failed";
        if (
          message.toLowerCase().includes("not authorized") ||
          message.toLowerCase().includes("login again")
        ) {
          clearAuth();
          navigate("/login", { state: { from: "/my-appointments" } });
        } else {
          toast.error(message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSearchParams({});
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/login", { state: { from: "/my-appointments" } });
      return;
    }
    getUserAppointments();
  }, [token]);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const cancelled = searchParams.get("payment");

    if (sessionId && token) {
      verifyStripeReturn(sessionId);
    } else if (cancelled === "cancelled") {
      toast.warn("Payment was cancelled");
      setSearchParams({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, token]);

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/cancle-appointment",
        { appointmentId },
        { headers: { token } }
      );
      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
        getDoctorsData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log("error:", error);
      toast.error(error.message);
    }
  };

  const payRemainingBalance = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/stripe/create-balance-session",
        { appointmentId },
        { headers: { token } }
      );

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleNavigation = (docId) => {
    navigate(`/appointment/${docId}`);
  };

  const getBalanceAmount = (item) =>
    item.balanceAmount ||
    Math.round((item.amount - (item.depositAmount || 0)) * 100) / 100;

  return (
    <div>
      <p className="pb-3 mt-12 font-medium text-zinc-700 border-b">
        My appointments
      </p>

      <MoveUpOnRender id="my-appointments">
        {appointments.length === 0 && (
          <p className="text-zinc-500 py-8 text-center">No appointments yet.</p>
        )}

        {appointments.map((item, index) => (
          <div
            className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b"
            key={index}
          >
            <div onClick={() => handleNavigation(item?.docData?._id)}>
              <img
                className="w-32 bg-indigo-50 cursor-pointer"
                src={item?.docData?.image}
                alt=""
              />
            </div>
            <div className="flex-1 text-sm text-zinc-500">
              <p className="text-neutral-800 font-semibold">
                {item?.docData?.name}
              </p>
              <p>{item?.docData?.speciality}</p>
              <p className="text-zinc-700 font-medium mt-1">Address:</p>
              <p className="text-xs">{item?.docData?.address?.line1}</p>
              <p className="text-xs mt-1">
                <span className="text-sm text-neutral-700 font-medium">
                  Date & Time:{" "}
                </span>
                {slotDateFormat(item?.slotDate)} | {item.slotTime}
              </p>
              <p className="text-xs mt-1">
                <span className="text-sm text-neutral-700 font-medium">
                  Fee:{" "}
                </span>
                {currencySymbol}
                {item.amount}
                {item.depositPaid && (
                  <span className="text-green-600 ml-2">
                    (Deposit paid: {currencySymbol}
                    {item.depositAmount || Math.round(item.amount * 0.1 * 100) / 100})
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-col gap-2 justify-end">
              {!item.cancelled && item.payment && !item.isCompleted && (
                <button className="text-sm text-green-600 border-green-500 text-center sm:min-w-48 py-2 border bg-green-50">
                  Fully Paid
                </button>
              )}

              {!item.cancelled &&
                item.depositPaid &&
                !item.balancePaid &&
                !item.payment &&
                !item.isCompleted && (
                  <>
                    <button className="text-sm text-blue-600 border-blue-400 text-center sm:min-w-48 py-2 border bg-blue-50">
                      Deposit Paid (10%)
                    </button>
                    <button
                      onClick={() => payRemainingBalance(item._id)}
                      className="text-sm text-white bg-primary text-center sm:min-w-48 py-2 rounded hover:opacity-90 transition"
                    >
                      Pay Remaining ({currencySymbol}
                      {getBalanceAmount(item)})
                    </button>
                  </>
                )}

              {!item.cancelled && !item.depositPaid && !item.isCompleted && (
                <button className="text-sm text-orange-500 border-orange-400 text-center sm:min-w-48 py-2 border">
                  Awaiting deposit payment
                </button>
              )}

              {!item.cancelled && !item.isCompleted && (
                <button
                  onClick={() => cancelAppointment(item._id)}
                  className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border hover:bg-red-600 hover:text-white transition duration-300"
                >
                  Cancel Appointment
                </button>
              )}

              {item.cancelled && !item.isCompleted && (
                <button className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500">
                  Appointment cancelled
                </button>
              )}

              {item.isCompleted && (
                <button className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500">
                  Completed
                </button>
              )}
            </div>
          </div>
        ))}
      </MoveUpOnRender>
    </div>
  );
};

export default MyAppointments;
