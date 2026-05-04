"use client";

import { getToolName, type ReasoningUIPart, type UIMessage } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import equal from "fast-deep-equal";

import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2,
  PocketKnife,
  SparklesIcon,
  StopCircle,
} from "lucide-react";
import { SpinnerIcon } from "./icons";

interface ReasoningMessagePartProps {
  part: ReasoningUIPart;
  isReasoning: boolean;
}

export function ReasoningMessagePart({
  part,
  isReasoning,
}: ReasoningMessagePartProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: "auto",
      opacity: 1,
      marginTop: "1rem",
      marginBottom: 0,
    },
  };

  const memoizedSetIsExpanded = useCallback((value: boolean) => {
    setIsExpanded(value);
  }, []);

  useEffect(() => {
    memoizedSetIsExpanded(isReasoning);
  }, [isReasoning, memoizedSetIsExpanded]);

  return (
    <div className="flex flex-col">
      {isReasoning ? (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Reasoning</div>
          <div className="animate-spin">
            <SpinnerIcon />
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Reasoned for a few seconds</div>
          <button
            className={cn(
              "cursor-pointer rounded-full hover:bg-accent",
              {
                "bg-accent": isExpanded,
              },
            )}
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronUpIcon className="h-4 w-4" />
            )}
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="reasoning"
            className="text-sm text-muted-foreground flex flex-col gap-4 border-l border-border pl-3"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <Streamdown>{part.text}</Streamdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Surface every successful canon retrieval + warn when textual answer has no grounding. */
function AssistantCanonFooter({
  message,
  isLatestMessage,
  status,
}: {
  message: UIMessage;
  isLatestMessage: boolean;
  status: "error" | "submitted" | "streaming" | "ready";
}) {
  const { paths, assistantTextChars, ungrounded } = useMemo(() => {
    const parts = message.parts ?? [];
    const pathsSet = new Set<string>();
    let chars = 0;

    for (const part of parts) {
      if (part.type === "text" && typeof part.text === "string") {
        chars += part.text.length;
      }

      if (part.type !== "tool-readAummReference") continue;
      const tp = part as {
        state?: unknown;
        output?: unknown;
      };

      if (tp.state !== "output-available") continue;
      const out = tp.output as
        | { path?: unknown; content?: unknown; error?: unknown }
        | undefined;
      const p = typeof out?.path === "string" ? out.path : null;
      if (!p || out?.error !== undefined) continue;
      pathsSet.add(p);
    }

    const finalizedLatest =
      !isLatestMessage || status === "ready" || status === "error";

    const ungrounded =
      chars > 80 && pathsSet.size === 0 && finalizedLatest === true;

    return {
      paths: [...pathsSet].sort(),
      assistantTextChars: chars,
      ungrounded,
    };
  }, [message.parts, isLatestMessage, status]);

  const showSources = paths.length > 0;
  const showUngrounded = ungrounded;

  if (!showSources && !showUngrounded) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center pb-6 text-xs leading-relaxed border-b border-border/60">
      {showSources && (
        <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
          <span className="font-medium text-foreground/80">Canon sources:</span>
          {paths.map((basename) => (
            <span
              key={basename}
              title={basename}
              className="font-mono bg-secondary px-2 py-0.5 rounded-md border border-border"
            >
              {basename.replace(/^references\//, "")}
            </span>
          ))}
        </div>
      )}
      {showUngrounded && (
        <div className="inline-flex gap-1.5 items-center rounded-md border border-amber-700/35 bg-amber-500/10 px-2 py-1 text-amber-800 dark:border-amber-400/35 dark:bg-amber-600/15 dark:text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 opacity-85" aria-hidden />
          <span>Ungrounded — verify on&nbsp;</span>
          <a className="underline font-medium" href="https://aumm.fi">
            aumm.fi
          </a>
          <span className="opacity-85"> (~{assistantTextChars} chars, no corpus tool hit)</span>
        </div>
      )}
    </div>
  );
}

const PurePreviewMessage = ({
  message,
  isLatestMessage,
  status,
}: {
  message: UIMessage;
  isLoading: boolean;
  status: "error" | "submitted" | "streaming" | "ready";
  isLatestMessage: boolean;
}) => {
  return (
    <AnimatePresence key={message.id}>
      <motion.div
        className="w-full mx-auto group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        key={`message-${message.id}`}
        data-role={message.role}
      >
        <div
          className={cn(
            "flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-[85%]",
            "group-data-[role=user]/message:w-fit",
          )}
        >
          {message.role === "assistant" && (
            <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="">
                <SparklesIcon size={14} />
              </div>
            </div>
          )}

          <div className="flex flex-col w-full space-y-4">
            {message.parts?.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    <motion.div
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      key={`message-${message.id}-part-${i}`}
                      className="flex flex-row gap-2 items-start w-full pb-4"
                    >
                      <div
                        className={cn("flex flex-col gap-4", {
                          "bg-secondary text-secondary-foreground px-3 py-2 rounded-tl-xl rounded-tr-xl rounded-bl-xl":
                            message.role === "user",
                          "text-[calc(1rem+2px)] leading-relaxed":
                            message.role === "assistant",
                        })}
                      >
                        <Streamdown>{part.text}</Streamdown>
                      </div>
                    </motion.div>
                  );
                // Canon reference retrieval (aumm-skill)
                case "tool-readAummReference":
                  const { state } = part;

                  return (
                    <motion.div
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      key={`message-${message.id}-part-${i}`}
                      className="flex flex-col gap-2 p-2 mb-3 text-sm bg-muted rounded-md border border-border"
                    >
                      <div className="flex-1 flex items-center justify-center">
                        <div className="flex items-center justify-center w-8 h-8 bg-secondary rounded-full">
                          <PocketKnife className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium flex items-baseline gap-2">
                            {state === "input-streaming" ? "Calling" : "Called"}{" "}
                            <span className="font-mono bg-secondary px-2 py-1 rounded-md">
                              {getToolName(part)}
                            </span>
                          </div>
                          {(() => {
                            if (part.state !== "output-available") return null;
                            const out = part.output as
                              | {
                                  path?: unknown;
                                  error?: unknown;
                                }
                              | undefined;
                            const p =
                              typeof out?.path === "string" ? out.path : "";
                            return p ? (
                              <div className="text-xs mt-2 text-muted-foreground font-mono">
                                retrieved:{" "}
                                {out?.error !== undefined ? "(error payload)" : p}
                              </div>
                            ) : null;
                          })()}
                        </div>
                        <div className="w-5 h-5 flex items-center justify-center">
                          {state === "input-streaming" ? (
                            isLatestMessage && status !== "ready" ? (
                              <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
                            ) : (
                              <StopCircle className="h-4 w-4 text-red-500" />
                            )
                          ) : state === "output-available" ? (
                            <CheckCircle size={14} className="text-green-600" />
                          ) : null}
                        </div>
                      </div>
                    </motion.div>
                  );
                case "reasoning":
                  return (
                    <ReasoningMessagePart
                      key={`message-${message.id}-${i}`}
                      part={part}
                      isReasoning={
                        (message.parts &&
                          status === "streaming" &&
                          i === message.parts.length - 1) ??
                        false
                      }
                    />
                  );
                default:
                  return null;
              }
            })}
            {message.role === "assistant" && (
              <AssistantCanonFooter
                message={message}
                isLatestMessage={isLatestMessage}
                status={status}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const Message = memo(PurePreviewMessage, (prevProps, nextProps) => {
  if (prevProps.status !== nextProps.status) return false;
  if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;

  return true;
});
