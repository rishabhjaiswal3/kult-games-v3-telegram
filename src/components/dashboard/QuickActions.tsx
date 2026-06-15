import { ArrowRight } from "lucide-react";
import agentNexus from "@/assets/hybrid.mp4";
import iconTrain from "@/assets/icon-train.png";
import iconBattle from "@/assets/icon-battle.png";
import iconEarn from "@/assets/icon-earn.png";
import iconOwn from "@/assets/Own.png";

export function QuickActions() {
  const steps = [
    {
      n: "01",
      title: "CREATE",
      desc: "Create your AI Agent and choose its path.",
      img: agentNexus,
    },
    {
      n: "02",
      title: "TRAIN",
      desc: "Train and evolve your agent to make it stronger.",
      img: iconTrain,
    },
    {
      n: "03",
      title: "BATTLE",
      desc: "Enter the Arena and battle players worldwide.",
      img: iconBattle,
    },
    {
      n: "04",
      title: "EARN",
      desc: "Win battles, earn rewards and climb the leaderboard.",
      img: iconEarn,
    },
    { n: "05", title: "OWN", desc: "Your AI. Your NFT. Your legacy.", img: iconOwn },
  ];

  return (
    <section className="w-full pt-4 pb-2">
      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="h-px flex-1 max-w-20 bg-gradient-to-r from-transparent to-primary" />
        <h3 className="font-display text-2xl sm:text-3xl text-center uppercase tracking-wider">QUICK ACTIONS</h3>
        <div className="h-px flex-1 max-w-20 bg-gradient-to-l from-transparent to-primary" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 items-stretch">
        {steps.map((s, i) => (
          <div key={s.n} className="relative group">
            <div className="card-glass rounded-xl overflow-hidden h-full flex flex-col transition hover:border-primary/40 hover:shadow-[0_8px_32px_rgba(154,53,255,0.15)] bg-[#04080f]/80">
              <div className="aspect-square overflow-hidden bg-background/50">
                {s.img.endsWith(".mp4") ? (
                  <video
                    src={s.img}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <img
                    src={s.img}
                    alt={s.title}
                    loading="lazy"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
              </div>
              <div className="p-3 sm:p-4 text-center md:text-left flex-1">
                <div className="font-display text-xl text-primary glow-text">{s.n}</div>
                <div className="font-tech text-xs sm:text-sm mt-1 sm:mt-2 tracking-wider break-words uppercase">{s.title}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 leading-relaxed">{s.desc}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="hidden lg:block absolute top-1/3 -right-2.5 w-4 h-4 sm:w-5 sm:h-5 text-primary z-10 drop-shadow-[0_0_8px_rgba(154,53,255,0.8)]" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
