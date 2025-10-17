import { useEffect } from "react";

export default function useClipboard(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  sendMessage: (message: any) => boolean
) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    async function handler() {
      const text = await navigator.clipboard.readText();

      const message = {
        message_type: "clipboard",
        content: text,
      };

      if (!sendMessage(JSON.stringify(message)))
        console.error(`Failed to send "clipboard" message`);
    }

    video.addEventListener("focus", handler);

    return () => {
      video.removeEventListener("focus", handler);
    };
  }, [videoRef, sendMessage]);
}
