import Footer from "@/components/Footer";
import { HomePage } from "@/components/home/HomePage";
import { isTelegramMiniApp } from "@/lib/telegramMiniApp";

const Index = () => {
  const telegramMode = isTelegramMiniApp();

  return (
    <div
      className={`min-w-0 mx-auto w-full max-w-full ${
        telegramMode
          ? "telegram-arena-page px-0 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
          : "px-4 py-5 sm:px-6 lg:px-8"
      }`}
    >
      <HomePage />
      <Footer />
    </div>
  );
};

export default Index;
