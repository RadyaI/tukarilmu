"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, RotateCcw, Sparkles } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "model";
  text: string;
}

// ─── Persona / System Prompt ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `Kamu adalah asisten virtual dari website TukarIlmu. 
Tugasmu adalah menjawab pertanyaan singkat & jelas seputar website ini.
Gunakan bahasa yang ramah, santai, tapi tetap informatif.
Kalau ada yang nanya di luar topik website, arahkan balik dengan sopan.
Jawaban maksimal 3-4 kalimat agar tetap ringkas.

Tentang tukar ilmu:
- Aplikasi ini adalah platform tukar ilmu antar mahasiswa
- Mahasiswa bisa upload materi, membeli materi, dan request materi
- Keuntungan utamanya adalah fleksibilitas dalam menentukan harga
- saat ingin upload kita bisa menentukan apakah gratis atau berbayar dengan harga berapapun bahkan Rp.1000 pun bisa
- namun saat seandainya kita butuh materi dan belum ada yang membahas, kita bisa request dengan menentukan harga sendiri
- nah orang lain itu bisa mengambil request dan menerima hadiah/uangnya sesuai yang ditetapkan si peminta
`;

// ─── API Call ─────────────────────────────────────────────────────────────────
async function fetchAIReply(history: Message[]): Promise<string> {
  const res = await fetch("https://radya.my.id/api/chat/groq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      history,
      persona: "default",
      systemPrompt: SYSTEM_PROMPT,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.text ?? "";
}

// ─── Typing Indicator ────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.8s" }}
        />
      ))}
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
          <Bot size={14} className="text-white" />
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-br-sm"
            : "bg-white/90 text-gray-800 border border-gray-100 rounded-bl-sm"
        }`}
        style={{ wordBreak: "break-word" }}
      >
        {msg.text}
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ChatAI() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [appeared, setAppeared] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
      if (!appeared) {
        setAppeared(true);
        // greeting
        setMessages([
          {
            role: "model",
            text: "Halo! 👋 Ada yang bisa aku bantu seputar website Tukar Ilmu?",
          },
        ]);
      }
    }
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newHistory: Message[] = [...messages, { role: "user", text }];
    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const reply = await fetchAIReply(newHistory);
      setMessages((prev) => [...prev, { role: "model", text: reply }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("429")) {
        toast.error("Slow down ya, terlalu banyak request 😅");
      } else {
        toast.error("Gagal konek ke AI, coba lagi bentar lagi.");
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const reset = () => {
    setMessages([
      {
        role: "model",
        text: "Halo lagi! 👋 Percakapan direset. Ada yang mau ditanyain?",
      },
    ]);
    setInput("");
  };

  return (
    <>
      {/* Toast container — di luar portal biar aman */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            marginBottom: "88px",
            fontSize: "13px",
            borderRadius: "12px",
          },
        }}
      />

      {/* ── Floating wrapper — pointer-events-none biar ga nutup UI lain ── */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
        {/* ── Chat Panel ── */}
        <div
          className={`
            w-[340px] rounded-2xl shadow-2xl overflow-hidden
            border border-white/20
            transition-all duration-300 ease-out origin-bottom-right
            ${open
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-95 translate-y-4 pointer-events-none select-none"
            }
          `}
          aria-hidden={!open}
          style={{
            background: "linear-gradient(160deg, #f8f6ff 0%, #fdf4ff 100%)",
            boxShadow: "0 20px 60px -10px rgba(124, 58, 237, 0.25), 0 8px 20px -5px rgba(0,0,0,0.15)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #d946ef 100%)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-tight">Radya AI</p>
                <p className="text-white/70 text-[11px]">Tanya apa aja tentang website ini</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={reset}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                title="Reset chat"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
                title="Tutup"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex flex-col gap-3 p-4 overflow-y-auto"
            style={{
              height: "340px",
              scrollbarWidth: "thin",
              scrollbarColor: "#e9d5ff transparent",
            }}
          >
            {messages.map((msg, i) => (
              <Bubble key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex items-end gap-2">
                <div className="shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
                  <Bot size={14} className="text-white" />
                </div>
                <div className="bg-white/90 border border-gray-100 rounded-2xl rounded-bl-sm shadow-sm text-gray-500">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2 bg-white rounded-xl border border-violet-100 shadow-sm px-3 py-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Ketik pertanyaan..."
                disabled={loading}
                className="flex-1 text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none disabled:opacity-50"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="
                  w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                  bg-gradient-to-br from-violet-600 to-fuchsia-500
                  text-white shadow-sm
                  hover:from-violet-500 hover:to-fuchsia-400
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all active:scale-95
                "
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* ── FAB Button ── */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="
            pointer-events-auto
            w-14 h-14 rounded-full flex items-center justify-center
            shadow-lg hover:shadow-xl
            transition-all duration-200 active:scale-95 hover:scale-105
            relative overflow-hidden
          "
          style={{
            background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #d946ef 100%)",
            boxShadow: "0 8px 25px -5px rgba(124, 58, 237, 0.5)",
          }}
          aria-label={open ? "Tutup chat" : "Buka chat"}
        >
          {/* pulse ring */}
          {!open && (
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ background: "linear-gradient(135deg, #7c3aed, #d946ef)" }}
            />
          )}
          <span
            className="transition-all duration-200"
            style={{ transform: open ? "rotate(90deg) scale(0.85)" : "rotate(0deg) scale(1)" }}
          >
            {open ? (
              <X size={22} className="text-white" />
            ) : (
              <MessageCircle size={22} className="text-white" />
            )}
          </span>
        </button>
      </div>
    </>
  );
}