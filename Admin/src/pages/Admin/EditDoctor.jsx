import { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AdminContext } from "../../context/AdminContext";
import MoveUpOnRender from "../../components/MoveUpOnRender";
import { assets } from "../../assets/assets";

const initialValues = {
  name: "",
  email: "",
  password: "",
  experience: "1 Year",
  fees: "",
  about: "",
  speciality: "General physician",
  degree: "",
  address1: "",
  address2: "",
};

const EditDoctor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { backendUrl, aToken, updateDoctor } = useContext(AdminContext);

  const [docImg, setDocImg] = useState(null);
  const [doctorData, setDoctorData] = useState(initialValues);
  const [loading, setLoading] = useState(true);

  // ================= FETCH DOCTOR =================
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const { data } = await axios.get(
          backendUrl + "/api/admin/all-doctors",
          { headers: { aToken } }
        );

        const doctor = data.doctors.find((d) => d._id === id);

        if (doctor) {
          setDoctorData({
            name: doctor.name,
            email: doctor.email,
            password: "",
            experience: doctor.experience,
            fees: doctor.fees,
            about: doctor.about,
            speciality: doctor.speciality,
            degree: doctor.degree,
            address1: doctor.address?.line1 || "",
            address2: doctor.address?.line2 || "",
          });

          setDocImg(doctor.image); // existing image URL
        }

        setLoading(false);
      } catch (error) {
        toast.error(error.message);
      }
    };

    fetchDoctor();
  }, [id]);

  // ================= INPUT CHANGE =================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDoctorData({ ...doctorData, [name]: value });
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("doctorId", id);

    // new image only if user changes it
    if (docImg && typeof docImg !== "string") {
      formData.append("image", docImg);
    }

    formData.append("name", doctorData.name);
    formData.append("email", doctorData.email);
    formData.append("password", doctorData.password);
    formData.append("experience", doctorData.experience);
    formData.append("fees", Number(doctorData.fees));
    formData.append("about", doctorData.about);
    formData.append("speciality", doctorData.speciality);
    formData.append("degree", doctorData.degree);

    formData.append(
      "address",
      JSON.stringify({
        line1: doctorData.address1,
        line2: doctorData.address2,
      })
    );

    await updateDoctor(formData);
    navigate("/doctor-list");
  };

  if (loading) return <p className="m-5">Loading...</p>;

  return (
    <MoveUpOnRender id="admin-editdoctor">
      <form onSubmit={handleSubmit} className="m-5 w-full">
        <p className="mb-3 text-lg font-medium">Edit Doctor</p>

        <div className="bg-white px-8 py-8 border rounded w-full max-w-4xl max-h-[100vh] overflow-y-scroll">

          {/* ================= IMAGE ================= */}
          <div className="flex items-center gap-4 mb-8 text-gray-500">
            <label htmlFor="doc-img">
              <img
                className="w-16 bg-gray-100 rounded-full cursor-pointer"
                src={
                  docImg
                    ? typeof docImg === "string"
                      ? docImg
                      : URL.createObjectURL(docImg)
                    : assets.upload_area
                }
                alt=""
              />
            </label>

            <input
              onChange={(e) => setDocImg(e.target.files[0])}
              type="file"
              id="doc-img"
              hidden
            />

            <p>
              Change Doctor <br /> picture
            </p>
          </div>

          {/* ================= FORM (SAME AS ADD DOCTOR) ================= */}
          <div className="flex flex-col lg:flex-row items-start gap-10 text-gray-600">

            {/* LEFT SIDE */}
            <div className="w-full lg:flex-1 flex flex-col gap-4">

              <div className="flex flex-col gap-1">
                <p>Doctor name</p>
                <input
                  className="border rounded px-3 py-2"
                  name="name"
                  value={doctorData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex flex-col gap-1">
                <p>Doctor Email</p>
                <input
                  className="border rounded px-3 py-2"
                  name="email"
                  value={doctorData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex flex-col gap-1">
                <p>Password (leave empty if unchanged)</p>
                <input
                  className="border rounded px-3 py-2"
                  type="password"
                  name="password"
                  value={doctorData.password}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex flex-col gap-1">
                <p>Experience</p>
                <select
                  className="border rounded px-3 py-2"
                  name="experience"
                  value={doctorData.experience}
                  onChange={handleInputChange}
                >
                  <option>1 Year</option>
                  <option>2 Year</option>
                  <option>3 Year</option>
                  <option>4 Year</option>
                  <option>5 Year</option>
                  <option>6 Year</option>
                  <option>7 Year</option>
                  <option>8 Year</option>
                  <option>9 Year</option>
                  <option>10 Year</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <p>Fees</p>
                <input
                  className="border rounded px-3 py-2"
                  type="number"
                  name="fees"
                  value={doctorData.fees}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="w-full lg:flex-1 flex flex-col gap-4">

              <div className="flex flex-col gap-1">
                <p>Speciality</p>
                <select
                  className="border rounded px-3 py-2"
                  name="speciality"
                  value={doctorData.speciality}
                  onChange={handleInputChange}
                >
                  <option>General physician</option>
                  <option>Gynecologist</option>
                  <option>Dermatologist</option>
                  <option>Pediatricians</option>
                  <option>Neurologist</option>
                  <option>Gastroenterologist</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <p>Education</p>
                <input
                  className="border rounded px-3 py-2"
                  name="degree"
                  value={doctorData.degree}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex flex-col gap-1">
                <p>Address</p>
                <input
                  className="border rounded px-3 py-2"
                  name="address1"
                  value={doctorData.address1}
                  onChange={handleInputChange}
                />
                <input
                  className="border rounded px-3 py-2"
                  name="address2"
                  value={doctorData.address2}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {/* ================= ABOUT ================= */}
          <div>
            <p className="mt-4 mb-2">About Doctor</p>
            <textarea
              className="w-full px-4 pt-2 border rounded"
              rows={5}
              name="about"
              value={doctorData.about}
              onChange={handleInputChange}
            />
          </div>

          {/* ================= BUTTONS ================= */}
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="bg-primary px-10 py-3 text-white rounded-full"
            >
              Save Changes
            </button>

            <button
              type="button"
              onClick={() => navigate("/doctor-list")}
              className="bg-gray-400 px-10 py-3 text-white rounded-full"
            >
              Cancel
            </button>
          </div>

        </div>
      </form>
    </MoveUpOnRender>
  );
};

export default EditDoctor;