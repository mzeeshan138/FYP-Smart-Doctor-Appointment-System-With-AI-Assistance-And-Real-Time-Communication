import { useContext, useEffect } from "react";
import { DoctorContext } from "../../context/DontorContext";
import { AppContext } from "../../context/AppContext";
import { assets } from "../../assets/assets";

const getStripePaymentLabel = (item) => {
  if (item.cancelled) return null;
  if (item.payment) return { text: "Fully paid", className: "text-green-600 border-green-500" };
  if (item.depositPaid) {
    return {
      text: "Deposit paid (10%)",
      className: "text-blue-600 border-blue-500",
    };
  }
  return { text: "Awaiting payment", className: "text-orange-500 border-orange-400" };
};

const DoctorAppointments = () => {
  const { dToken, appointments, getAppointments, completeAppointment } =
    useContext(DoctorContext);
  const { calculateAge, slotDateFormat, currency } = useContext(AppContext);

  useEffect(() => {
    if (dToken) {
      getAppointments();
    }
  }, [dToken]);

  return (
    <div className="w-full max-w-6xl m-5">
      <p className="mb-3 text-lg font-medium">All Appointments</p>
      <div className="bg-white border rounded text-sm max-h-[80vh] min-h-[50vh] overflow-y-scroll">
        <div className="max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b">
          <p>#</p>
          <p>Patient</p>
          <p>Stripe payment</p>
          <p>Age</p>
          <p>Date & Time</p>
          <p>Fees</p>
          <p>Status</p>
          <p>Action</p>
        </div>
        {appointments.map((item, index) => {
          const paymentLabel = getStripePaymentLabel(item);

          return (
            <div
              className="flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50"
              key={index}
            >
              <p className="max-sm:hidden">{index + 1}</p>
              <div className="flex items-center gap-2">
                <img
                  className="w-8 h-8 rounded-full object-cover"
                  src={item?.userData?.image || assets.default_avatar}
                  alt="Patient"
                />
                <p>{item?.userData?.name}</p>
              </div>
              <div>
                {paymentLabel && (
                  <p
                    className={`text-xs inline border px-2 rounded-full ${paymentLabel.className}`}
                  >
                    {paymentLabel.text}
                  </p>
                )}
              </div>
              <p className="max-sm:hidden">{calculateAge(item.userData.dob)}</p>
              <p>
                {slotDateFormat(item.slotDate)}, {item.slotTime}
              </p>
              <p>
                {currency}
                {item.amount}
              </p>

              {item.cancelled ? (
                <p className="text-red-400 text-xs font-medium">Cancelled</p>
              ) : item.isCompleted ? (
                <p className="text-green-500 text-xs font-medium">Completed</p>
              ) : (
                <p className="text-gray-500 text-xs font-medium">Active</p>
              )}

              {item.cancelled ? (
                <span />
              ) : item.isCompleted ? (
                <span />
              ) : (
                <div className="flex">
                  <img
                    onClick={() => completeAppointment(item?._id)}
                    className="w-10 cursor-pointer"
                    src={assets.tick_icon}
                    alt="Complete"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DoctorAppointments;
