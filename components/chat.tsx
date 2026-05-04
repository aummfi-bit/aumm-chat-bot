"use client";

import { defaultModel, modelID } from "@/ai/providers";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { Textarea } from "./textarea";
import { ProjectOverview } from "./project-overview";
import { ConversationStarters } from "./conversation-starters";
import { Messages } from "./messages";
import { Header } from "./header";
import { toast } from "sonner";

export default function Chat() {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<modelID>(defaultModel);
  const { sendMessage, messages, status, stop } = useChat({
    onError: (error) => {
      console.error("[useChat] transport / stream error:", error);
      const messageText =
        typeof error?.message === "string" && error.message.trim().length > 0
          ? error.message
          : "An error occurred. Check the browser console for details.";
      toast.error(messageText, {
        position: "top-center",
        richColors: true,
      });
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-dvh w-full flex-col pt-16">
      <Header />
      <div className="flex min-h-0 flex-1 flex-col">
        {messages.length === 0 ? (
          <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <ProjectOverview />
            </div>
          </div>
        ) : (
          <Messages messages={messages} isLoading={isLoading} status={status} />
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage({ text: input }, { body: { selectedModel } });
          setInput("");
        }}
        className="w-full shrink-0 bg-background px-4 pb-8 pt-3 sm:px-6 lg:px-8"
      >
        {messages.length === 0 && (
          <ConversationStarters
            disabled={isLoading}
            onSelect={(text) =>
              sendMessage({ text }, { body: { selectedModel } })
            }
          />
        )}
        <Textarea
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          handleInputChange={(e) => setInput(e.currentTarget.value)}
          input={input}
          isLoading={isLoading}
          status={status}
          stop={stop}
        />
      </form>
    </div>
  );
}
