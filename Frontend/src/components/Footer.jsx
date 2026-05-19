import { assets } from "../assets/assets";
const Footer = () => {
  return (
    <div className="md:mx-10">
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        {/* --------------left section-------------- */}
        <div>
          <img className="mb-5 w-40" src={assets.logo} alt="" />
          <p className="w-full md:w-2/3 text-gray-600 leading-6">
            DoctorHub: Bridging the gap between doctors and patients with
            seamless appointment management, secure prescriptions, and
            personalized healthcare solutions. Your health, our priority.
          </p>
        </div>

        {/* --------------center section-------------- */}
        <div>
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li>Home</li>
            <li>About us</li>
            <li>Contact us</li>
            <li>Privacy policy</li>
          </ul>
        </div>

        {/* --------------right section-------------- */}
        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li> Tel: (123) 456‑7890 </li>
            <li>help@doctorhub.com</li>
          </ul>
        </div>
      </div>
      <div>
        

      {/* -----------FYP Team Section--------- */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-xl font-semibold text-gray-800 text-center mb-4">
          Final Year Project Team
        </h2>

        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition">
            <p className="font-semibold text-gray-800">
              Muhammad Zeeshan
            </p>
            <p className="text-sm text-gray-600">2K22-BSSE-106</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition">
            <p className="font-semibold text-gray-800">
              Muhammad Umar Farooq
            </p>
            <p className="text-sm text-gray-600">2K22-BSSE-115</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition">
            <p className="font-semibold text-gray-800">
              Ammad Ashfaque Rao
            </p>
            <p className="text-sm text-gray-600">2K22-BSSE-122</p>
          </div>
        </div>

        <div className="text-center mt-5">
          <p className="text-gray-700 font-medium">
            Supervised by Sir Irfan & Sir Zargham Abbas
          </p>

          <p className="text-gray-600 mt-2">
            Department of Computer Science
          </p>

          <p className="text-gray-500 text-sm">
            NFC IET Multan
          </p>
        </div>
      </div>
        <hr />
{/* -----------copy right text--------- */}
        <hr />
        <p className="py-5 text-sm text-center">
          Copyright © 2026 - All Right Reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;
