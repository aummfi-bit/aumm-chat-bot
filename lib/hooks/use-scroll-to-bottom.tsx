import { useEffect, useRef, type RefObject } from "react";

/** Beyond this distance from the bottom, streaming updates won't move the viewport. */
const NEAR_BOTTOM_PX = 120;

export function useScrollToBottom(
  messageCount: number,
): [RefObject<HTMLDivElement | null>, RefObject<HTMLDivElement | null>] {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  useEffect(() => {
    stickToBottomRef.current = true;
    const container = containerRef.current;
    if (!container) return;
    queueMicrotask(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [messageCount]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distFromBottom = scrollHeight - scrollTop - clientHeight;
      stickToBottomRef.current = distFromBottom <= NEAR_BOTTOM_PX;
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scrollIfSticking = () => {
      if (!stickToBottomRef.current) return;
      container.scrollTop = container.scrollHeight;
    };

    const observer = new MutationObserver(scrollIfSticking);
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, []);

  return [containerRef, endRef];
}
