import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Payment() {
  const { id, appointmentId } = useParams();
  const [doctor, setDoctor] = useState({});
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  const HandleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        `http://localhost:4000/api/user/appointments/payment/${appointmentId}`,
        formData
      );

      console.log("Response:", res);
      alert("Payment Submitted successfully!");
      setFormData({});
      navigate("/my-appointments");
    } catch (error) {
      console.error("Upload Error:", error);
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  const fetch = async () => {
    try {
      const res = await axios.get(
        `http://localhost:4000/api/doctor/getSingleDoctor/${id}`
      );
      setDoctor(res.data.doctor);
    } catch (error) {
      alert(error);
    }
  };
  useEffect(() => {
    fetch();
  }, []);
  return (
    <div>
      <h1 className="text-3xl border-b-2 border-primary w-max py-2">
        Pay online via Raast
      </h1>
      <p className="my-2">
        Pay online throught raast ID made on Doctor's number and show the paid
        receipt at the time of appointment
      </p>

      <p className="font-bold mt-4 text-2xl">Payment Details:</p>
      <p>
        Pay on the above raast ID. and upload the screenshot soo it can be
        reviewed.
      </p>
      <div className="flex mt-4 gap-2">
        <p className="font-bold">Doctor's Name: </p>
        <p> {doctor?.name} </p>
      </div>

      <div className="flex gap-2">
        <p className="font-bold"> Doctor's Raast Account: </p>
        <p> {doctor?.phone || "Phone not provided, You have to pay cash"} </p>
      </div>

      <p className="font-bold text-2xl my-5">Upload Data Here</p>
      <form onSubmit={HandleSubmit} className="flex gap-2">
        <input
          type="text"
          name="name"
          placeholder="Enter Sender's Name"
          className="border-2 border-primary rounded-md px-2 py-1"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <input
          type="text"
          name="amount"
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="border-2 border-primary rounded-md px-2 py-1"
          placeholder="Amount"
        />

        <input
          type="text"
          name="amount"
          onChange={(e) => setFormData({ ...formData, tid: e.target.value })}
          className="border-2 border-primary rounded-md px-2 py-1"
          placeholder="Transaction ID"
        />
        <button
          type="submit"
          className="ml-10 bg-primary text-white p-2 rounded-lg"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
