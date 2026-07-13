import React, { useContext, useEffect } from "react";
import Login from "./pages/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppContext } from "./context/AppContext";
import { AdminContext } from "./context/AdminContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Navigate, Route, Routes } from "react-router-dom";
import DashBoard from "./pages/Admin/Dashboard";
import AllAppointments from "./pages/Admin/AllAppointments";
import AddDoctor from "./pages/Admin/AddDoctor";
import DoctorsList from "./pages/Admin/DoctorsList";
import { DoctorContext } from "./context/DontorContext";
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import DoctorAppointmets from "./pages/Doctor/DoctorAppointments";
import DoctorProfile from "./pages/Doctor/DoctorProfile";
import TopLoadingBar from "./components/TopLoadingBar";
import Chat from "./pages/Chat";
import EditDoctor from "./pages/Admin/EditDoctor";
import PatientBookingRestrictions from "./pages/Admin/PatientBookingRestrictions";
import AllPatients from "./pages/Admin/AllPatients";
import AllPayments from "./pages/Admin/AllPayments";

const App = () => {
  const { aToken, setAToken } = useContext(AdminContext);
  const { dToken, setDToken, setProfileData } = useContext(DoctorContext);
  const { isLoading } = useContext(AppContext);

  const isAdmin = Boolean(aToken) && !dToken;
  const isDoctor = Boolean(dToken) && !aToken;

  // Fix stale dual-token state from older sessions
  useEffect(() => {
    if (aToken && dToken) {
      const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
      const routePath =
        window.location.pathname.replace(basePath, "") || "/";
      const doctorPaths = [
        "/doctor-dashboard",
        "/doctor-appointments",
        "/doctor-profile",
        "/chat",
      ];
      if (doctorPaths.some((p) => routePath.startsWith(p))) {
        localStorage.removeItem("aToken");
        setAToken("");
      } else {
        localStorage.removeItem("dToken");
        setDToken("");
        setProfileData(null);
      }
    }
  }, [aToken, dToken, setAToken, setDToken, setProfileData]);

  if (!isAdmin && !isDoctor) {
    return (
      <div>
        {isLoading && <TopLoadingBar />}
        <Login />
        <ToastContainer />
      </div>
    );
  }

  return (
    <>
      {isLoading && <TopLoadingBar />}
      <div className="bg-[#F8F9FD] min-h-screen">
        <ToastContainer />
        <Navbar />
        <div className="flex items-start w-full">
          <Sidebar />

          <div className="flex-1 min-w-0 w-full">
            <Routes>
              <Route
                path="/"
                element={
                  isAdmin ? (
                    <Navigate to="/admin-dashboard" replace />
                  ) : (
                    <Navigate to="/doctor-dashboard" replace />
                  )
                }
              />

              {isAdmin && (
                <>
                  <Route path="/admin-dashboard" element={<DashBoard />} />
                  <Route path="/all-appointments" element={<AllAppointments />} />
                  <Route path="/add-doctor" element={<AddDoctor />} />
                  <Route path="/doctor-list" element={<DoctorsList />} />
                  <Route path="/all-patients" element={<AllPatients />} />
                  <Route path="/edit-doctor/:id" element={<EditDoctor />} />
                  <Route
                    path="/patient-restrictions"
                    element={<PatientBookingRestrictions />}
                  />
                  <Route path="/all-payments" element={<AllPayments />} />
                </>
              )}

              {isDoctor && (
                <>
                  <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
                  <Route
                    path="/doctor-appointments"
                    element={<DoctorAppointmets />}
                  />
                  <Route path="/doctor-profile" element={<DoctorProfile />} />
                  <Route path="/chat" element={<Chat />} />
                </>
              )}

              <Route
                path="*"
                element={
                  isAdmin ? (
                    <Navigate to="/admin-dashboard" replace />
                  ) : (
                    <Navigate to="/doctor-dashboard" replace />
                  )
                }
              />
            </Routes>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
