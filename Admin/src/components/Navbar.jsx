import { useContext } from "react";
import { assets } from "../assets/assets";
import { AdminContext } from "../context/AdminContext";
import { DoctorContext } from "../context/DoctorContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { aToken, setAToken } = useContext(AdminContext);
  const { dToken, setDToken, setProfileData } = useContext(DoctorContext);
  const navigate = useNavigate();

  const logout = () => {
    if (aToken) {
      setAToken("");
      localStorage.removeItem("aToken");
    }
    if (dToken) {
      setDToken("");
      setProfileData(null);
      localStorage.removeItem("dToken");
    }
    navigate("/", { replace: true });
  };
  return (
    <div className="flex sticky top-0 bg-white/90 z-10 justify-between items-center px-4 py-2 sm:px-10 border-b bg-white">
      <div className="flex items-center gap-2 text-xs">
        <img
          className="w-96 sm:w-40 cursor-pointer"
          src={assets.admin_logo}
          alt=""
        />
        <p className="border px-2.5 py-0.5 rounded-full border-gray-600 text-gray-600">
          {aToken && !dToken ? "Admin" : "Doctor"}
        </p>
      </div>
      <button
        onClick={logout}
        className="bg-primary text-white text-sm px-10 py-2 rounded-full"
      >
        Logout
      </button>
    </div>
  );
};

export default Navbar;
