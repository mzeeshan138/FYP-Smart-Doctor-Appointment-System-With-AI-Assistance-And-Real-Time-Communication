import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate, useLocation } from "react-router-dom";

const SIGNUP_STEPS = {
  EMAIL: "email",
  VERIFY: "verify",
  REGISTER: "register",
};

const Login = () => {
  const { backendUrl, token, setToken } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const [state, setState] = useState("Login");
  const [signupStep, setSignupStep] = useState(SIGNUP_STEPS.EMAIL);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const resetSignupFlow = () => {
    setSignupStep(SIGNUP_STEPS.EMAIL);
    setVerificationCode("");
    setVerificationToken("");
    setName("");
    setPassword("");
  };

  const switchToLogin = () => {
    setState("Login");
    resetSignupFlow();
  };

  const switchToSignup = () => {
    setState("Sign Up");
    resetSignupFlow();
  };

  const handleSendCode = async (event) => {
    event?.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setSendingCode(true);
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/send-verification-code",
        { email: email.trim() }
      );

      if (data.success) {
        toast.success(data.message);
        setSignupStep(SIGNUP_STEPS.VERIFY);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();

    if (!verificationCode.trim()) {
      toast.error("Please enter the verification code");
      return;
    }

    setVerifyingCode(true);
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/verify-email-code",
        { email: email.trim(), code: verificationCode.trim() }
      );

      if (data.success) {
        toast.success(data.message);
        setVerificationToken(data.verificationToken);
        setSignupStep(SIGNUP_STEPS.REGISTER);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!verificationToken) {
      toast.error("Please verify your email before creating an account");
      setSignupStep(SIGNUP_STEPS.EMAIL);
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setRegistering(true);
    try {
      const { data } = await axios.post(backendUrl + "/api/user/register", {
        name: name.trim(),
        password,
        email: email.trim(),
        verificationToken,
      });

      if (data.success) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        toast.success(data.message || "Account created successfully");
        navigate(redirectTo);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setRegistering(false);
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoggingIn(true);
    try {
      const { data } = await axios.post(backendUrl + "/api/user/login", {
        password,
        email: email.trim(),
      });

      if (data.success) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        toast.success("Login successful");
        navigate(redirectTo);
      } else if (data.accountBanned) {
        toast.error(data.message, { autoClose: 8000 });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoggingIn(false);
    }
  };

  useEffect(() => {
    if (token) {
      navigate(redirectTo);
    }
  }, [token, navigate, redirectTo]);

  const renderSignupStep = () => {
    if (signupStep === SIGNUP_STEPS.EMAIL) {
      return (
        <form onSubmit={handleSendCode} className="w-full flex flex-col gap-3">
          <p className="text-zinc-500">
            Step 1 of 3 — Enter your email to receive a verification code
          </p>
          <div className="w-full">
            <p>Email</p>
            <input
              className="border border-zinc-300 rounded w-full p-2 mt-1"
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              placeholder="you@example.com"
              required
            />
          </div>
          <button
            type="submit"
            disabled={sendingCode}
            className="bg-primary text-white w-full py-2 rounded-md text-base disabled:opacity-60"
          >
            {sendingCode ? "Sending..." : "Send Verification Code"}
          </button>
        </form>
      );
    }

    if (signupStep === SIGNUP_STEPS.VERIFY) {
      return (
        <form onSubmit={handleVerifyCode} className="w-full flex flex-col gap-3">
          <p className="text-zinc-500">
            Step 2 of 3 — Enter the 6-digit code sent to{" "}
            <span className="font-medium text-zinc-700">{email}</span>
          </p>
          <div className="w-full">
            <p>Verification Code</p>
            <input
              className="border border-zinc-300 rounded w-full p-2 mt-1 tracking-widest text-center text-lg"
              type="text"
              inputMode="numeric"
              maxLength={6}
              onChange={(e) =>
                setVerificationCode(e.target.value.replace(/\D/g, ""))
              }
              value={verificationCode}
              placeholder="000000"
              required
            />
          </div>
          <button
            type="submit"
            disabled={verifyingCode}
            className="bg-primary text-white w-full py-2 rounded-md text-base disabled:opacity-60"
          >
            {verifyingCode ? "Verifying..." : "Verify Email"}
          </button>
          <button
            type="button"
            onClick={() => setSignupStep(SIGNUP_STEPS.EMAIL)}
            className="text-primary underline text-sm text-left"
          >
            Change email
          </button>
          <button
            type="button"
            onClick={handleSendCode}
            disabled={sendingCode}
            className="text-zinc-500 underline text-sm text-left disabled:opacity-60"
          >
            {sendingCode ? "Resending..." : "Resend code"}
          </button>
        </form>
      );
    }

    return (
      <form onSubmit={handleRegister} className="w-full flex flex-col gap-3">
        <p className="text-zinc-500">
          Step 3 of 3 — Complete your account details
        </p>
        <div className="w-full">
          <p>Full Name</p>
          <input
            className="border border-zinc-300 rounded w-full p-2 mt-1"
            type="text"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
          />
        </div>
        <div className="w-full">
          <p>Email</p>
          <input
            className="border border-zinc-300 rounded w-full p-2 mt-1 bg-zinc-100 cursor-not-allowed"
            type="email"
            value={email}
            readOnly
          />
        </div>
        <div className="w-full">
          <p>Password</p>
          <input
            className="border border-zinc-300 rounded w-full p-2 mt-1"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            minLength={8}
            required
          />
          <p className="text-xs text-zinc-400 mt-1">Minimum 8 characters</p>
        </div>
        <button
          type="submit"
          disabled={registering}
          className="bg-primary text-white w-full py-2 rounded-md text-base disabled:opacity-60"
        >
          {registering ? "Creating account..." : "Create Account"}
        </button>
      </form>
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center">
      <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[320px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg">
        <p className="text-2xl font-semibold">
          {state === "Sign Up" ? "Create Account" : "Login"}
        </p>

        {redirectTo !== "/" && (
          <p className="text-sm text-blue-600">
            Login or sign up to continue booking your appointment.
          </p>
        )}

        {state === "Sign Up" ? (
          <>
            <p>Verify your email first, then complete registration</p>
            {renderSignupStep()}
            <p>
              Already have an account?{" "}
              <span
                onClick={switchToLogin}
                className="text-primary underline cursor-pointer"
              >
                Login here
              </span>
            </p>
          </>
        ) : (
          <form onSubmit={onSubmitHandler} className="w-full flex flex-col gap-3">
            <p>Please log in to book appointment</p>
            <div className="w-full">
              <p>Email</p>
              <input
                className="border border-zinc-300 rounded w-full p-2 mt-1"
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                required
              />
            </div>
            <div className="w-full">
              <div className="flex items-center justify-between">
                <p>Password</p>
                <span
                  onClick={() => navigate("/forgot-password")}
                  className="text-primary underline cursor-pointer text-xs"
                >
                  Forgot password?
                </span>
              </div>
              <input
                className="border border-zinc-300 rounded w-full p-2 mt-1"
                type="password"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="bg-primary text-white w-full py-2 rounded-md text-base disabled:opacity-60"
            >
              {loggingIn ? "Logging in..." : "Login"}
            </button>
            <p>
              Create a new account?{" "}
              <span
                onClick={switchToSignup}
                className="text-primary underline cursor-pointer"
              >
                Click here
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
