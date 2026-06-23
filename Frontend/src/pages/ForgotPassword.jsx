import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const ForgotPassword = () => {
  const { backendUrl } = useContext(AppContext);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [limitUntil, setLimitUntil] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setSubmitting(true);
    setLimitUntil(null);

    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/forgot-password",
        { email: email.trim() }
      );

      if (data.success) {
        toast.success(data.message);
      } else {
        if (data.passwordResetLimitUntil) {
          setLimitUntil(data.passwordResetLimitUntil);
        }
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formattedLimitDate = limitUntil
    ? new Date(limitUntil).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-[80vh] flex items-center">
      <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[320px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg">
        <p className="text-2xl font-semibold">Forgot Password</p>
        <p>
          Enter your account email and we will send you a link to reset your
          password.
        </p>

        {formattedLimitDate && (
          <div className="w-full p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            Password reset is limited. You can request another reset after{" "}
            <span className="font-semibold">{formattedLimitDate}</span>.
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="w-full">
            <p>Email</p>
            <input
              className="border border-zinc-300 rounded w-full p-2 mt-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-primary text-white w-full py-2 rounded-md text-base disabled:opacity-60"
          >
            {submitting ? "Sending link..." : "Send Reset Link"}
          </button>
        </form>

        <p>
          Remember your password?{" "}
          <Link to="/login" className="text-primary underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
