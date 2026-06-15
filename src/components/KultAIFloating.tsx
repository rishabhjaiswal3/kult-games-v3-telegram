import { motion, AnimatePresence } from "framer-motion";
import { Send, X, User, Loader2, Sparkles, MessageSquare, GitCompare, Gamepad2, ArrowRight, Shield } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import KultAIMessageContent from "@/components/KultAIMessageContent";
import { KultAiBotAvatar } from "@/components/KultAiBotAvatar";
import { useKultAIChat } from "@/hooks/useKultAIChat";
import chatbotBackgroundVideo from "@/assets/SC_1-3.mp4";

const quickPrompts = [
  { icon: Sparkles, text: "Find my first game" },
  { icon: MessageSquare, text: "Pick based on my vibe" },
  { icon: GitCompare, text: "Compare games for me" },
  { icon: Gamepad2, text: "What's trending on 0G?" },
];

const KultAIFloating = () => {
  const [open, setOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { error, input, isStreaming, isWaitingForFirstChunk, messages, sendMessage, setInput, computeSessionId } = useKultAIChat();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage();
  };

  return (
    <>
      {/* Floating launcher — gradient bezel + glass + ambient glow */}
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setOpen(true)}
            aria-label="Open KULT AI chat"
            className="group fixed bottom-28 right-5 z-50 h-16 w-16 outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-6 sm:right-6"
          >
            {/* Soft breathing halo */}
            <motion.div
              className="pointer-events-none absolute -inset-3 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, hsl(278 88% 58% / 0.42) 0%, hsl(198 92% 68% / 0.15) 42%, transparent 68%)",
              }}
              animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.85, 0.5] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Cyan → purple gradient ring (bezel) */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neon-cyan via-neon-purple to-[hsl(285_72%_38%)] p-[2.5px] shadow-[0_14px_44px_hsl(278_88%_42%/0.42),0_0_24px_hsl(198_92%_68%/0.12)] transition-shadow duration-300 group-hover:shadow-[0_18px_50px_hsl(278_88%_48%/0.5),0_0_32px_hsl(198_92%_68%/0.22)]">
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(ellipse_90%_90%_at_28%_18%,hsl(268_34%_24%/0.98),hsl(268_26%_9%/0.99))] ring-1 ring-inset ring-white/15 backdrop-blur-[2px]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[46%] rounded-t-full bg-gradient-to-b from-white/[0.09] to-transparent" />
                <div className="pointer-events-none absolute -bottom-1/4 left-1/2 h-1/2 w-[120%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,hsl(278_88%_55%/0.15),transparent_70%)] opacity-80" />
                <KultAiBotAvatar
                  className="relative z-10 h-10 w-10 object-contain drop-shadow-[0_2px_14px_hsl(198_92%_68%/0.4)] transition-transform duration-300 group-hover:scale-[1.05]"
                  alt="KULT AI"
                />
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] rounded-2xl overflow-hidden border border-primary/20 flex flex-col"
            style={{
              maxHeight: "min(620px, calc(100vh - 6rem))",
              background: "linear-gradient(180deg, hsl(265 48% 10%) 0%, hsl(220 45% 8%) 100%)",
              boxShadow: "0 25px 60px -12px hsl(270 82% 25% / 0.38), 0 0 0 1px hsl(278 100% 75% / 0.12), 0 0 40px hsl(270 82% 58% / 0.12), inset 0 1px 0 0 hsl(278 100% 82% / 0.08)",
            }}
          >
            <video
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              src={chatbotBackgroundVideo}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden="true"
            />
            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-border/40 flex-shrink-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[hsl(278_100%_70%/0.12)] via-[hsl(270_82%_52%/0.08)] to-transparent" />
              <div className="flex items-center gap-3 relative z-10">
                <KultAiBotAvatar className="h-10 w-10 shrink-0" alt="KULT AI" />
                <div>
                  <span className="text-sm font-display font-bold text-foreground tracking-wide block" style={{ textShadow: "0 0 18px hsl(270 82% 58% / 0.3)" }}>KULT AI</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(278_100%_82%)]" style={{ boxShadow: "0 0 6px hsl(278 100% 82%)" }} />
                    <span className="text-[10px] text-muted-foreground">Powered by 0G Compute</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="relative z-10 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/50">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="relative z-10 flex-1 min-h-0 overflow-y-auto scrollbar-none">
              <div className="p-5 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="mx-auto mb-4 flex justify-center"
                    >
                      <KultAiBotAvatar className="h-14 w-14" alt="" />
                    </motion.div>
                    <p className="text-base font-display font-bold text-foreground mb-1">Hey there! 👋</p>
                    <p className="text-xs text-muted-foreground mb-6">Ask me anything about KULT games</p>
                    <div className="space-y-2.5">
                      {quickPrompts.map((p, i) => (
                        <motion.button
                          key={p.text}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + i * 0.05 }}
                          onClick={() => void sendMessage(p.text)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-[16px] bg-muted/20 hover:bg-[hsl(278_100%_70%/0.08)] border border-border/30 hover:border-[hsl(278_100%_70%/0.28)] hover:shadow-[0_0_10px_hsl(270_82%_58%/0.12)] transition-all text-left group"
                        >
                          <div className="w-8 h-8 rounded-[16px] bg-[hsl(278_100%_70%/0.12)] flex items-center justify-center group-hover:bg-[hsl(278_100%_70%/0.18)] transition-colors flex-shrink-0">
                            <p.icon className="w-4 h-4 text-[hsl(278_100%_82%)]" />
                          </div>
                          <span className="text-xs text-foreground font-medium">{p.text}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[hsl(278_100%_82%)] ml-auto transition-colors group-hover:translate-x-0.5 transform" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "ai" && (
                      <div className="mt-0.5 flex shrink-0 items-center">
                        <KultAiBotAvatar className="h-7 w-7" alt="" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed break-words ${
                        msg.role === "user"
                          ? "btn-eye text-white rounded-br-md whitespace-pre-wrap shadow-[0_2px_15px_hsl(270_82%_58%/0.25)]"
                          : "bg-muted/40 text-foreground border border-border/30 rounded-bl-md"
                      }`}
                    >
                      {msg.role === "ai" ? <KultAIMessageContent text={msg.text} /> : msg.text}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 mt-0.5 border border-border/30">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}

                {isWaitingForFirstChunk && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                    <div className="flex shrink-0 items-center">
                      <KultAiBotAvatar className="h-7 w-7" alt="" />
                    </div>
                    <div className="bg-muted/40 border border-border/30 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                      <motion.div className="w-1.5 h-1.5 rounded-full bg-[hsl(278_100%_82%/0.7)]" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                      <motion.div className="w-1.5 h-1.5 rounded-full bg-[hsl(278_100%_82%/0.7)]" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
                      <motion.div className="w-1.5 h-1.5 rounded-full bg-[hsl(278_100%_82%/0.7)]" animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* 0G Compute session proof */}
            {computeSessionId && (
              <div className="relative z-10 px-4 py-2 border-t border-border/20 flex items-center gap-2 flex-shrink-0">
                <Shield className="w-3 h-3 text-sky-400 shrink-0" />
                <span className="text-[9px] font-mono text-muted-foreground/60 truncate">
                  0G session: {computeSessionId}
                </span>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="relative z-10 p-4 border-t border-border/40 flex-shrink-0">
              {error && (
                <p className="mb-3 text-xs text-destructive/80">
                  {error}
                </p>
              )}
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask KULT AI..."
                  className="flex-1 bg-muted/30 rounded-xl px-4 py-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:shadow-[0_0_10px_hsl(195_100%_50%/0.1)] border border-border/30 focus:border-primary/30 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="w-10 h-10 btn-eye flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default KultAIFloating;
