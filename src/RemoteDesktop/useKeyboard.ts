import React from "react";

export function useKeyboard(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  sendMessage: (message: any) => boolean
) {
  const eventHandlerFactory = React.useCallback(
    (eventType: string) => async (event: KeyboardEvent) => {
      if (!videoRef.current?.matches(":focus")) return;

      event.preventDefault();

      const payload = {
        message_type: eventType,
        key: event.key,
        code: event.code,
      };

      if (!sendMessage(JSON.stringify(payload)))
        console.error(`Failed to send ${eventType} message`);
    },
    [sendMessage, videoRef]
  );

  React.useEffect(() => {
    const container = videoRef.current;
    if (!container) return;

    container.focus();

    const handleKeyDown = eventHandlerFactory("keydown");
    const handleKeyUp = eventHandlerFactory("keyup");
    const handleKeyPress = eventHandlerFactory("keypress");

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, [eventHandlerFactory, videoRef]);
}
