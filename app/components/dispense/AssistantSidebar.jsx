"use client";
import {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from "react";
import api from "../../axios/axiosConfig";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Sparkles, SendHorizonal, X, Loader2 } from "lucide-react";

/* ── Markdown prose styling ─────────────────────────────────────────────── */
const mdComponents = {
  h1: ({ children }) => (
    <h3 className="mb-1 mt-3 text-sm font-bold">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mb-1 mt-3 text-sm font-bold">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-1 mt-2.5 text-[13px] font-semibold">{children}</h4>
  ),
  h4: ({ children }) => (
    <h5 className="mb-0.5 mt-2 text-xs font-semibold">{children}</h5>
  ),
  p: ({ children }) => <p className="mb-1.5 leading-relaxed">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  em: ({ children }) => <em className="text-muted-foreground">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  hr: () => <hr className="my-2.5 border-border" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto rounded-md border">
      <table className="w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
  th: ({ children }) => (
    <th className="px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-t px-2 py-1.5">{children}</td>,
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <pre className="my-2 overflow-x-auto rounded-md bg-muted p-2.5 text-xs">
          <code>{children}</code>
        </pre>
      );
    }
    return (
      <code className="rounded bg-muted px-1 py-0.5 text-[12px] font-medium">
        {children}
      </code>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-primary/40 pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),
};

/* ── Message bubble ─────────────────────────────────────────────────────── */
function MessageBubble({ message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm leading-relaxed text-primary-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message — render markdown
  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[90%] rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm ${
          message.error
            ? "border border-amber-300 bg-amber-50 text-amber-900"
            : "bg-muted text-foreground"
        }`}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

/* ── Sidebar ────────────────────────────────────────────────────────────── */
const AssistantSidebar = forwardRef(function AssistantSidebar(
  { open, onOpen, onClose, patient, basket },
  ref,
) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const sendQuestion = async (question, existingMessages) => {
    const msgs = existingMessages || messages;
    const next = [...msgs, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/api/ai/chat", {
        question,
        patientId: patient?._id || null,
        basket: basket.map((b) => ({ name: b.name, dosage: b.dosage })),
        history: msgs,
      });
      setMessages([...next, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages([
        ...next,
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

  useImperativeHandle(ref, () => ({
    askQuestion: (text) => {
      onOpen();
      setTimeout(() => sendQuestion(text, messages), 150);
    },
  }));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !loading) sendQuestion(input.trim());
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

      {/* Live context strip */}
      <div className="border-b bg-muted/50 px-4 py-2 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">
          {patient ? patient.fullName : "No patient selected"}
        </span>
        {" · "}
        {basket.length === 0
          ? "basket empty"
          : `${basket.length} drug${basket.length > 1 ? "s" : ""}: ${basket
              .map((b) => b.name)
              .join(", ")}`}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rosek-scroll px-4 py-4"
      >
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
                  onClick={() => sendQuestion(s)}
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
            <MessageBubble key={i} message={m} />
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
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
            onClick={() =>
              input.trim() && !loading && sendQuestion(input.trim())
            }
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
});

export default AssistantSidebar;
