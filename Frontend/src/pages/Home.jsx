import Banner from "../components/Banner";
import Header from "../components/Header";
import SpecialityMenu from "../components/SpecialityMenu";
import TopDoctors from "../components/TopDoctors";
import AIChatWidget from "../components/ai-chat/AIChatWidget";


const Home = () => {
  return (
    <div>
      <Header />
      <SpecialityMenu />
      <TopDoctors />
      <Banner />
      <AIChatWidget />
    </div>
  );
};

export default Home;
