"use client";
import React, { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Send,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Menu,
  Copy,
  RotateCcw,
  Coins,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import QuickStartCards from "@/components/QuickStartCards";
import PricingCards from "@/components/PricingCards";

// Type for message feedback
interface MessageFeedback {
  liked: boolean;
  disliked: boolean;
}

// Extended message type with feedback
interface Message {
  role: "assistant" | "user";
  content: string;
  id: string;
  isPricing?: boolean;
  feedback?: MessageFeedback;
}

const ChatUI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState(5);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus effect for textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Function to handle feedback
  const handleFeedback = (messageId: string, type: "like" | "dislike") => {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id === messageId) {
          return {
            ...message,
            feedback: {
              liked: type === "like" ? !message.feedback?.liked : false,
              disliked:
                type === "dislike" ? !message.feedback?.disliked : false,
            },
          };
        }
        return message;
      })
    );

    // Placeholder for feedback API call
    const feedbackData = {
      messageId,
      type,
      timestamp: new Date().toISOString(),
    };
    console.log("Feedback data to be sent to API:", feedbackData);
    // TODO: Implement API call to save feedback
  };

  const handleQuestionSelect = (question: string) => {
    setInput(question);
    handleFormSubmit(question);
  };

  const handleFormSubmit = async (selectedQuestion?: string) => {
    const messageContent = selectedQuestion || input;
    if (!messageContent.trim()) return;

    // Check credits and show pricing if 0
    if (credits <= 0) {
      // Only add pricing card if the last message isn't already a pricing card
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage?.isPricing) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "",
            id: `pricing-${Date.now()}`,
            isPricing: true,
          },
        ]);
      }
      return;
    }

    // Deduct credit
    setCredits((prev) => prev - 1);

    // Create user message
    const newMessageId = `msg-${Date.now()}`;
    const userMessage = {
      role: "user" as const,
      content: messageContent,
      id: newMessageId,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageContent,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Failed to get response");
      }

      // Create a new message for the assistant's response
      const assistantMessageId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "",
          id: assistantMessageId,
          feedback: { liked: false, disliked: false },
        },
      ]);

      // Set up SSE
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.content === "[DONE]") {
                  continue;
                }

                assistantMessage += data.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: assistantMessage }
                      : msg
                  )
                );
              } catch (e) {
                console.error("Error parsing SSE data:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error reading stream:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          id: `error-${Date.now()}`,
          feedback: { liked: false, disliked: false },
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        handleFormSubmit();
      }
    }
  };

  const copyToClipboard = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (err) {
      setError("Failed to copy to clipboard");
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setInput("");
    setError(null);
    setIsStreaming(false);
    setStreamingMessageId(null);
    setCredits(5);
    setCopiedMessageId(null);
  };

  // Function to handle any keypress on the window
  const handleWindowKeyPress = (e: KeyboardEvent) => {
    if (
      document.activeElement !== textareaRef.current &&
      e.key.length === 1 && // Only single characters
      !e.ctrlKey &&
      !e.altKey &&
      !e.metaKey // No modifier keys
    ) {
      if (textareaRef.current) {
        textareaRef.current.focus();
        setInput((prev) => prev + e.key);
      }
    }
  };

  // Add window keypress listener
  useEffect(() => {
    window.addEventListener("keypress", handleWindowKeyPress);
    return () => {
      window.removeEventListener("keypress", handleWindowKeyPress);
    };
  }, []);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-[100dvh] bg-white">
        {/* Header */}
        <div className="p-4 bg-white border-black/10">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center gap-2 pl-4">
              <Sparkles className="h-6 w-6 text-black" />
              <h1 className="text-left pl-2 text-black font-semibold">
                AI Dating Assistant
              </h1>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mx-4 mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Chat Area */}
        <ScrollArea className="flex-1 p-4 flex items-center justify-center">
          <div className="max-w-3xl w-full mx-auto">
            {messages.length === 0 && (
              <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
                <QuickStartCards onQuestionSelect={handleQuestionSelect} />
              </div>
            )}
            <div className="space-y-6">
              {messages.map((message) => (
                <Card
                  key={message.id}
                  className={cn(
                    "p-4 border border-black/10",
                    message.role === "assistant"
                      ? "bg-white"
                      : "bg-black text-white"
                  )}
                >
                  {message.isPricing ? (
                    <PricingCards />
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {message.role === "assistant"
                            ? "AI Assistant"
                            : "You"}
                        </span>
                      </div>

                      <div
                        className={cn(
                          "prose max-w-none text-sm",
                          message.role === "assistant"
                            ? "text-black"
                            : "text-white"
                        )}
                      >
                        {message.content}
                        {streamingMessageId === message.id && (
                          <span className="inline-block w-2 h-4 ml-1 bg-black animate-pulse" />
                        )}
                      </div>

                      {message.role === "assistant" && !message.isPricing && (
                        <div className="flex items-center gap-2 mt-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-8 w-8 hover:bg-black/5",
                                  message.feedback?.liked
                                    ? "bg-black text-white"
                                    : "text-black"
                                )}
                                onClick={() =>
                                  handleFeedback(message.id, "like")
                                }
                              >
                                <ThumbsUp className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Good response</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-8 w-8 hover:bg-black/5",
                                  message.feedback?.disliked
                                    ? "bg-black text-white"
                                    : "text-black"
                                )}
                                onClick={() =>
                                  handleFeedback(message.id, "dislike")
                                }
                              >
                                <ThumbsDown className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Bad response</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  "h-8 w-8 hover:bg-black/5",
                                  copiedMessageId === message.id
                                    ? "bg-black text-white"
                                    : "text-black"
                                )}
                                onClick={() =>
                                  copyToClipboard(message.content, message.id)
                                }
                              >
                                {copiedMessageId === message.id ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {copiedMessageId === message.id
                                  ? "Copied!"
                                  : "Copy message"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Credits Counter */}
        <div className="bg-white p-2">
          <div className="max-w-3xl mx-auto flex justify-end items-center gap-2">
            <Coins className="h-4 w-4 text-black" />
            <span className="text-sm text-black">
              {credits} credits remaining
            </span>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 border-black/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFormSubmit();
            }}
            className="max-w-3xl mx-auto"
          >
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message AI Assistant..."
                className="resize-none bg-white border-black/10 focus:border-black text-black placeholder:text-black/50 text-sm min-h-[44px] py-3 px-4"
                rows={1}
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    className="bg-black text-white hover:bg-black/90 h-11 w-11 flex-shrink-0"
                    size="icon"
                    disabled={!input.trim() || credits <= 0}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {credits <= 0
                      ? "No credits remaining"
                      : isStreaming
                      ? "Stop generating"
                      : "Send message"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ChatUI;
