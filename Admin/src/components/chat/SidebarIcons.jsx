import { BsChatLeftText } from "react-icons/bs";
// import { MdCampaign } from "react-icons/md";
// import { IoSettingsOutline } from "react-icons/io5";

const SidebarIcons = () => {
  return (
    <div className="w-16 bg-[#202C33] text-gray-400 flex flex-col items-center py-5 gap-8">

      <BsChatLeftText
        size={22}
        className="hover:text-white cursor-pointer"
      />
{/* 
      <MdCampaign
        size={24}
        className="hover:text-white cursor-pointer"
      /> */}

      {/* <IoSettingsOutline
        size={24}
        className="hover:text-white cursor-pointer mt-auto"
      /> */}

    </div>
  );
};

export default SidebarIcons;