import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowRight, Send, User, X, Sparkles } from "lucide-react";
import "./Chatbot.css";

const quickQuestions = [
  "What training programs do you offer?",
  "Who is the founder of Av_eSAFE?",
  "How can I enroll?",
  "Tell me about Av_eSAFE products",
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi there! 👋 I'm EVA, your Av_eSAFE AI assistant. I can help you explore our training programs, products, and technology solutions. What would you like to know?",
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const greetingTimer = setTimeout(() => {
      setShowGreeting(false);
    }, 8000);

    return () => clearTimeout(greetingTimer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  const openChat = () => {
    setIsOpen(true);
    setShowGreeting(false);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const handleSend = async (text = input) => {
    const userMessage = text.trim();

    if (!userMessage || isLoading) return;

    const updatedMessages = [
      ...messages,
      {
        role: "user",
        content: userMessage,
      },
      {
        role: "assistant",
        content: "",
      },
    ];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    let assistantReply = "";

    try {
      const conversation = updatedMessages
        .filter(
          (message) =>
            ["user", "assistant"].includes(message.role) &&
            typeof message.content === "string"
        )
        .filter((message) => message.content.trim().length > 0);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          errorData.message || "Unable to connect to EVA AI."
        );
      }

      if (!response.body) {
        throw new Error("AI response stream is unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let streamFinished = false;

      const processEvent = (event) => {
        for (const line of event.split("\n")) {
          const trimmedLine = line.trim();

          if (!trimmedLine.startsWith("data:")) {
            continue;
          }

          const data = trimmedLine.slice(5).trim();

          if (data === "[DONE]") {
            streamFinished = true;
            return;
          }

          try {
            const parsed = JSON.parse(data);

            if (typeof parsed.content === "string") {
              assistantReply += parsed.content;

              setMessages((previousMessages) => {
                const updated = [...previousMessages];

                const lastMessage = updated[updated.length - 1];

                if (lastMessage?.role === "assistant") {
                  updated[updated.length - 1] = {
                    ...lastMessage,
                    content: assistantReply,
                  };
                }

                return updated;
              });
            }
          } catch {
            // Ignore malformed SSE chunks.
          }
        }
      };

      while (!streamFinished) {
        const { value, done } = await reader.read();

        if (done) {
          buffer += decoder.decode();
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        const events = buffer.split("\n\n");

        buffer = events.pop() || "";

        for (const event of events) {
          processEvent(event);

          if (streamFinished) break;
        }
      }

      if (!streamFinished && buffer.trim()) {
        processEvent(buffer);
      }

      reader.releaseLock();

      if (!assistantReply.trim()) {
        throw new Error("The AI returned an empty response.");
      }
    } catch (error) {
      console.error("EVA AI Chatbot Error:", error);

      setMessages((previousMessages) => {
        const updated = [...previousMessages];

        const lastMessage = updated[updated.length - 1];

        if (lastMessage?.role === "assistant") {
          updated[updated.length - 1] = {
            ...lastMessage,
            content:
              "I'm sorry, I'm unable to connect right now. Please try again in a moment.",
          };
        }

        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-container">
      {!isOpen && (
        <div className="chatbot-launcher-wrapper">
          {showGreeting && (
            <button
              type="button"
              className="chatbot-greeting-pill"
              onClick={openChat}
              aria-label="Ask EVA"
            >
              <span className="chatbot-greeting-hi">
                Hi! 👋
              </span>

              <span className="chatbot-greeting-text">
                Ask EVA
              </span>

              <ArrowRight
                size={17}
                className="chatbot-greeting-arrow"
              />
            </button>
          )}

          <button
            type="button"
            className="chatbot-launcher"
            onClick={openChat}
            aria-label="Open EVA AI chatbot"
          >
            <span className="chatbot-launcher-glow" />

            <span className="chatbot-orb-halo chatbot-orb-halo-one" />

            <span className="chatbot-orb-halo chatbot-orb-halo-two" />

            <span className="chatbot-orb-core">
              <span className="chatbot-orb-shine" />

              {/* Animated EVA Launcher */}
              <img
                src="/eva-assistant.svg"
                alt="EVA AI Assistant"
                className="eva-launcher-image"
              />
            </span>
          </button>
        </div>
      )}

      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}

          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div
                className="chatbot-avatar"
                aria-hidden="true"
              >
                <span className="chatbot-avatar-orb">
                  {/* EVA Logo in Header */}
                  <img
                    src="/eva-logo.png"
                    alt=""
                    className="eva-header-avatar"
                  />
                </span>
              </div>

              <div className="chatbot-header-details">
                <h3>EVA AI</h3>

                <span className="chatbot-status">
                  <span className="chatbot-status-dot" />

                  Your Av_eSAFE assistant
                </span>
              </div>
            </div>

            <button
              type="button"
              className="chatbot-close"
              onClick={closeChat}
              aria-label="Close chatbot"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}

          <div className="chatbot-messages">
            <div className="chatbot-date-label">
              <Sparkles size={14} />

              YOUR AI LEARNING PARTNER
            </div>

            {messages.map((message, index) => {
              const isEmptyStreamingMessage =
                isLoading &&
                message.role === "assistant" &&
                message.content === "" &&
                index === messages.length - 1;

              if (isEmptyStreamingMessage) return null;

              return (
                <div
                  key={index}
                  className={`chatbot-message ${
                    message.role === "user"
                      ? "user-message"
                      : "assistant-message"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="chatbot-message-avatar eva-message-avatar">
                      {/* EVA Logo beside Assistant Message */}
                      <img
                        src="/eva-logo.png"
                        alt="EVA"
                        className="eva-message-image"
                      />
                    </div>
                  ) : (
                    <div className="chatbot-message-avatar user-avatar">
                      <User size={17} />
                    </div>
                  )}

                  <div className="chatbot-message-content">
                    <ReactMarkdown>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              );
            })}

            {/* EVA Thinking Animation */}

            {isLoading &&
              messages[messages.length - 1]?.content === "" && (
                <div className="chatbot-message assistant-message">
                  <div className="chatbot-message-avatar eva-message-avatar">
                    {/* EVA Logo while Thinking */}
                    <img
                      src="/eva-logo.png"
                      alt="EVA"
                      className="eva-message-image"
                    />
                  </div>

                  <div
                    className="chatbot-message-content chatbot-typing-bubble"
                    role="status"
                    aria-label="EVA is thinking"
                  >
                    <div className="chatbot-typing-indicator">
                      <span className="chatbot-typing-dot" />

                      <span className="chatbot-typing-dot" />

                      <span className="chatbot-typing-dot" />
                    </div>
                  </div>
                </div>
              )}

            {/* Quick Questions */}

            {messages.length === 1 && (
              <div className="chatbot-quick-questions">
                <p>Try asking EVA:</p>

                {quickQuestions.map((question) => (
                  <button
                    type="button"
                    key={question}
                    className="chatbot-question"
                    onClick={() => handleSend(question)}
                    disabled={isLoading}
                  >
                    <span>{question}</span>

                    <ArrowRight size={15} />
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}

          <div className="chatbot-input-area">
            <form
              className="chatbot-input-form"
              onSubmit={(event) => {
                event.preventDefault();
                handleSend();
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                placeholder="Ask EVA anything..."
                aria-label="Type your message"
                disabled={isLoading}
              />

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>

            <p className="chatbot-footer-text">
              Powered by Av_eSAFE AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
}