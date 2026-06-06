import Banner from "../components/Banner";
import Header from "../components/Header";
import SpecialityMenu from "../components/SpecialityMenu";
import TopDoctors from "../components/TopDoctors";
// Old AI chat (FastAPI) — uncomment to use sklearn chatbot instead of Gemini
// import AIChatWidget from "../components/ai-chat/AIChatWidget";
import GeminiChatWidget from "../components/gemini-chat/GeminiChatWidget";


const Home = () => {
  return (
    <div>
      <Header />
      <SpecialityMenu />
      <TopDoctors />
      <Banner />
      {/* <AIChatWidget /> */}
      <GeminiChatWidget />
    </div>
  );
};

export default Home;
