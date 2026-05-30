import { createContext, useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const currencySymbol = "Rs ";
  const backendUrl = "http://localhost:4000";
  const [isLoading, setIsLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [token, setToken] = useState(
    localStorage.getItem("token") ? localStorage.getItem("token") : ""
  );
  const [userData, setUserData] = useState(false);
  const interceptorsSetup = useRef(false);

  const clearAuth = () => {
    localStorage.removeItem("token");
    setToken("");
    setUserData(false);
  };

  const isAuthError = (message = "") => {
    const msg = message.toLowerCase();
    return (
      msg.includes("not authorized") ||
      msg.includes("login again") ||
      msg.includes("invalid credentials")
    );
  };

  const getDoctorsData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/list");

      if (data.success) {
        setDoctors(data.doctors);
      }
    } catch (error) {
      console.log("error:", error);
      toast.error(error.message);
    }
  };

  const loadUserProfileData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/get-profile", {
        headers: { token },
      });

      if (data.success) {
        setUserData(data.userData);
      } else {
        if (isAuthError(data.message)) {
          clearAuth();
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.log("error:", error);
      if (error.response?.status === 401 || isAuthError(error.message)) {
        clearAuth();
      }
    }
  };

  useEffect(() => {
    getDoctorsData();
  }, []);

  useEffect(() => {
    if (token) {
      loadUserProfileData();
    } else {
      setUserData(false);
    }
  }, [token]);

  useEffect(() => {
    if (interceptorsSetup.current) return;
    interceptorsSetup.current = true;

    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        setIsLoading(true);
        return config;
      },
      (error) => {
        setIsLoading(false);
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        setIsLoading(false);
        return response;
      },
      (error) => {
        setIsLoading(false);
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
      interceptorsSetup.current = false;
    };
  }, []);

  const value = {
    doctors,
    getDoctorsData,
    currencySymbol,
    token,
    setToken,
    backendUrl,
    userData,
    setUserData,
    loadUserProfileData,
    clearAuth,
    isLoading,
    setIsLoading,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
