import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..");
const OUTPUT_FILE = resolve(PROJECT_ROOT, process.env.AI_TEST_OUTPUT ?? "aitesting.txt");
const ASSISTANT_PUBLIC_PATH = "/assistant/v1/chat";

const QUESTIONS = [
  "What is KULT GAMES?",
  "What can I do on the KULT GAMES platform?",
  "How do I find a game to play?",
  "What games are available on KULT GAMES?",
  "Compare games for me.",
  "Pick a game based on my vibe.",
  "Find my first game.",
  "What's trending on 0G?",
  "Which game is best for a short break?",
  "Which game should I play if I like puzzles?",
  "Which game should I play if I like racing?",
  "Which game should I play if I like action?",
  "Which game is good for beginners?",
  "Which game is better for competitive players?",
  "Which game has the fastest gameplay?",
  "Which game is best for strategy?",
  "Which game is best for reflex training?",
  "Which game should I play if I like arcade games?",
  "Compare Guess the AI and Highway Hustle.",
  "Compare Robo Wars and Warzone Warriors.",
  "Compare ZeroG Pool and ZeroDash.",
  "Compare Highway Hustle and Robo Wars.",
  "Tell me about Guess the AI.",
  "Tell me about Highway Hustle.",
  "Tell me about Robo Wars.",
  "Tell me about Warzone Warriors.",
  "Tell me about ZeroG Pool.",
  "Tell me about ZeroDash.",
  "What is the difference between ZeroG Pool and ZeroDash?",
  "What is the difference between Guess the AI and Robo Wars?",
  "Which game should I play if I want something calm?",
  "Which game should I play if I want something intense?",
  "Which game should I play if I want quick decision-making?",
  "Which game should I play if I want tactical combat?",
  "Which game should I play if I want precision and aim?",
  "Which game should I play if I want movement and dodging?",
  "Which games are arcade games?",
  "Which games are action games?",
  "Which games are puzzle games?",
  "Which games are racing games?",
  "Give me a ranked recommendation of games to try first.",
  "Give me a side-by-side comparison of the game categories.",
  "Give me a short summary of every game.",
  "Give me detailed information about every game.",
  "Recommend a game for someone new to Web3 gaming.",
  "Recommend a game for someone who likes fast matches.",
  "Recommend a game for someone who likes skill-based games.",
  "Recommend a game for someone who likes survival gameplay.",
  "Recommend a game for someone who likes robot battles.",
  "Recommend a game for someone who likes driving games.",
  "Which game has the most tactical vibe?",
  "Which game has the most casual vibe?",
  "Which game has the most competitive vibe?",
  "Which game has the most arcade vibe?",
  "Which game has the most puzzle vibe?",
  "Which game has the most racing vibe?",
  "What should I play if I only have five minutes?",
  "What should I play if I want to improve reaction speed?",
  "What should I play if I want to think carefully?",
  "What should I play if I want direct combat?",
  "What should I play if I want to compete with friends?",
  "What should I play if I want to chase high scores?",
  "How do categories help me choose a game?",
  "How should I choose between arcade and action games?",
  "How should I choose between racing and puzzle games?",
  "How should I choose between ZeroDash and Highway Hustle?",
  "How should I choose between Robo Wars and Warzone Warriors?",
  "How should I choose between Guess the AI and ZeroG Pool?",
  "Can you group the games by play style?",
  "Can you group the games by difficulty?",
  "Can you group the games by session length?",
  "Can you group the games by mood?",
  "Can you suggest a play order for all games?",
  "Can you suggest three games for a beginner?",
  "Can you suggest three games for an expert player?",
  "Can you suggest games for a chill mood?",
  "Can you suggest games for a high-energy mood?",
  "Can you suggest games for a tactical mood?",
  "Can you suggest games for a precision-focused player?",
  "Can you suggest games for someone who likes speed?",
  "Can you suggest games for someone who likes combat?",
  "Can you suggest games for someone who likes deduction?",
  "What are the strengths of Guess the AI?",
  "What are the strengths of Highway Hustle?",
  "What are the strengths of Robo Wars?",
  "What are the strengths of Warzone Warriors?",
  "What are the strengths of ZeroG Pool?",
  "What are the strengths of ZeroDash?",
  "What are the weaknesses or tradeoffs of Guess the AI?",
  "What are the weaknesses or tradeoffs of Highway Hustle?",
  "What are the weaknesses or tradeoffs of Robo Wars?",
  "What are the weaknesses or tradeoffs of Warzone Warriors?",
  "What are the weaknesses or tradeoffs of ZeroG Pool?",
  "What are the weaknesses or tradeoffs of ZeroDash?",
  "Give me a table comparing all games.",
  "Give me a recommendation if I like puzzle and strategy games.",
  "Give me a recommendation if I like action and arcade games.",
  "Give me a recommendation if I like speed and reflexes.",
  "Give me a recommendation if I like aim and precision.",
  "Give me a final top pick and explain why.",
];

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

const parseDotEnv = (filePath) => {
  if (!existsSync(filePath)) return {};

  const values = {};
  const text = readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^([\w.-]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    values[key] = rawValue.replace(/^["']|["']$/g, "");
  }
  return values;
};

const env = {
  ...parseDotEnv(resolve(PROJECT_ROOT, ".env")),
  ...process.env,
};

const getChatUrl = () => {
  if (env.KULT_AI_CHAT_URL) return env.KULT_AI_CHAT_URL;
  if (env.VITE_KULT_AI_API_URL) return env.VITE_KULT_AI_API_URL;
  if (env.VITE_API_URL) return `${trimTrailingSlash(env.VITE_API_URL)}${ASSISTANT_PUBLIC_PATH}`;
  return "https://kult-browser-rust-l2lwg.ondigitalocean.app/assistant/v1/chat";
};

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

const decodeSsePayload = (payload) => payload.replace(/\\n/g, "\n");

const readErrorMessage = async (response) => {
  const fallback = `KULT AI request failed with ${response.status}.`;
  const contentType = response.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const payload = await response.json();
      return payload?.detail || payload?.error || payload?.message || fallback;
    }

    const text = (await response.text()).trim();
    return text || fallback;
  } catch {
    return fallback;
  }
};

const streamChatReply = async ({ chatUrl, question, userId, sessionId }) => {
  const response = await fetch(chatUrl, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: userId,
      session_id: sessionId,
      query: question,
      context: {},
    }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (!response.body) {
    throw new Error("KULT AI returned an empty response stream.");
  }

  const nextSessionId = response.headers.get("x-session-id") ?? sessionId;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let reply = "";
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

      let boundaryIndex = buffer.indexOf("\n\n");
      while (boundaryIndex !== -1) {
        const rawEvent = buffer.slice(0, boundaryIndex);
        buffer = buffer.slice(boundaryIndex + 2);

        const dataLines = rawEvent
          .split("\n")
          .filter((line) => line.startsWith("data:"))
          .map((line) => (line.startsWith("data: ") ? line.slice(6) : line.slice(5)));

        for (const payload of dataLines) {
          if (payload === "[DONE]") {
            return { reply, sessionId: nextSessionId };
          }

          reply += decodeSsePayload(payload);
        }

        boundaryIndex = buffer.indexOf("\n\n");
      }

      if (done) break;
    }
  } finally {
    reader.releaseLock();
  }

  return { reply, sessionId: nextSessionId };
};

const main = async () => {
  const chatUrl = getChatUrl();
  const limit = Number.parseInt(env.AI_TEST_LIMIT ?? `${QUESTIONS.length}`, 10);
  const delayMs = Number.parseInt(env.AI_TEST_DELAY_MS ?? "250", 10);
  const onlyQuestionNumber = Number.parseInt(env.AI_TEST_ONLY ?? "", 10);
  const selectedQuestions = Number.isFinite(onlyQuestionNumber)
    ? QUESTIONS.slice(onlyQuestionNumber - 1, onlyQuestionNumber)
    : QUESTIONS.slice(0, Number.isFinite(limit) ? limit : QUESTIONS.length);
  const questionOffset = Number.isFinite(onlyQuestionNumber) ? onlyQuestionNumber - 1 : 0;
  const userId = `ai-testing-${Date.now()}`;
  const startedAt = new Date().toISOString();
  const lines = [
    "KULT AI Chatbot Testing Responses",
    `Generated at: ${startedAt}`,
    `Chat endpoint: ${chatUrl}`,
    `Question count: ${selectedQuestions.length}`,
    "",
  ];

  await mkdir(dirname(OUTPUT_FILE), { recursive: true });

  for (const [index, question] of selectedQuestions.entries()) {
    const questionNumber = questionOffset + index + 1;
    const sessionId = `${userId}-q${questionNumber}`;
    console.log(`[${questionNumber}/${selectedQuestions.length}] ${question}`);

    lines.push("=".repeat(88));
    lines.push(`Q${questionNumber}. ${question}`);
    lines.push("");
    lines.push("Answer:");

    try {
      const { reply } = await streamChatReply({
        chatUrl,
        question,
        userId,
        sessionId,
      });
      lines.push(reply.trim() || "[Empty response]");
    } catch (error) {
      lines.push(`[ERROR] ${error instanceof Error ? error.message : String(error)}`);
    }

    lines.push("");
    await writeFile(OUTPUT_FILE, `${lines.join("\n")}\n`, "utf8");
    if (delayMs > 0 && questionNumber < selectedQuestions.length) {
      await sleep(delayMs);
    }
  }

  console.log(`Done. Wrote ${selectedQuestions.length} responses to ${OUTPUT_FILE}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
