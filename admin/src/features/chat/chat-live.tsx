"use client";

import { useEffect } from "react";
import { resetChat, startChat } from "@/services/chat";

/** Keeps chat connected for the whole session so the unread badge and the open conversation update live. */
export function ChatLive() {
  useEffect(() => {
    const stop = startChat();
    return () => {
      stop();
      resetChat();
    };
  }, []);
  return null;
}
