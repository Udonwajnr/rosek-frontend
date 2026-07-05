"use client";
import { useState, useRef, useEffect } from "react";
import api from "../../axios/axiosConfig";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, SendHorizonal, X, Loader2 } from "lucide-react";

/**
 * Collapsible right-hand clinical assistant.
 * Receives the LIVE dispensing session state (patient + basket) as props,
 * so every question is answered with full awareness of the workspace.
 */
export default function AssistantSidebar({ open, onClose, patient, basket }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Keep the newest message in view
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const ask = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const nextMessages = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/api/ai/chat", {
        question,
        patientId: patient?._id || null,
        basket: basket.map((b) => ({ name: b.name, dosage: b.dosage })),
        history: messages, // everything before this question
      });
      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.answer },
      ]);
    } catch (err) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "The assistant is temporarily unavailable. Please rely on your standard clinical references.",
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  };

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-30 flex w-full max-w-sm flex-col border-l bg-background shadow-xl transition-transform duration-300 ease-in-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
      aria-hidden={!open}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">
              Clinical assistant
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Sees your current basket and patient
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close assistant"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Live context strip — proof the chat is synced with the workspace */}
      <div className="border-b bg-muted/50 px-4 py-2 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">
          {patient ? patient.fullName : "No patient selected"}
        </span>
        {" · "}
        {basket.length === 0
          ? "basket empty"
          : `${basket.length} drug${basket.length > 1 ? "s" : ""} in basket: ${basket
              .map((b) => b.name)
              .join(", ")}`}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !loading && (
          <div className="mt-8 space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Ask anything about the current prescription.
            </p>
            <div className="mx-auto max-w-[260px] space-y-2">
              {[
                "Is this combination safe for this patient?",
                "What should I counsel the patient on?",
                "Any dose adjustment for renal impairment?",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : m.error
                      ? "rounded-bl-sm border border-amber-300 bg-amber-50 text-amber-900"
                      : "rounded-bl-sm bg-muted text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Checking…
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Ask a clinical question…"
            className="max-h-28 min-h-[40px] flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            size="icon"
            onClick={ask}
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          AI support — final decisions rest with the pharmacist.
        </p>
      </div>
    </aside>
  );
}
