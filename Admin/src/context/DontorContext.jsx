import axios from "axios";
import { createContext, useCallback, useState } from "react";
import { toast } from "react-toastify";

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
  const backendUrl = "http://localhost:4000";
  const [dToken, setDToken] = useState(
    localStorage.getItem("dToken") ? localStorage.getItem("dToken") : ""
  );
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState([]);
  const [profileData, setProfileData] = useState(null);

  const getAppointments = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/doctor/appointments",
        {
          headers: { dToken },
        }
      );
      if (data.success) {
        setAppointments(data.appointments.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log("error:", error);
      toast.error(error);
    }
  };

  const completeAppointment = async (appointmentId) => {
    console.log("appointmentId:", appointmentId);
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/complete-appointment",
        { appointmentId },
        { headers: { dToken } }
      );
      console.log("data:", data);
      if (data.success) {
        console.log("data:", data);
        getAppointments();

        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log("error:", error);
      toast.error(error);
    }
  };
  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/cancel-appointment",
        { appointmentId },
        { headers: { dToken } }
      );
      if (data.success) {
        getAppointments();
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log("error:", error);
      toast.error(error);
    }
  };

  const getDashData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/dashboard", {
        headers: { dToken },
      });
      if (data.success) {
        setDashData(data.dashData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log("error:", error);
      toast.error(error);
    }
  };

  const getProfileData = useCallback(async () => {
    if (!dToken) return;

    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/profile", {
        headers: { dToken },
      });
      if (data.success) {
        setProfileData(data.profileData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log("error:", error);
      toast.error(error.message || "Failed to load profile");
    }
  }, [dToken, backendUrl]);

  const value = {
    dToken,
    setDToken,
    backendUrl,
    appointments,
    getAppointments,
    completeAppointment,
    cancelAppointment,
    dashData,
    getDashData,
    profileData,
    setProfileData,
    getProfileData,
  };

  return (
    <DoctorContext.Provider value={value}>
      {props.children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
