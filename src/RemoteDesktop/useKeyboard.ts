import React from "react";

export function useKeyboard(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  sendMessage: (message: any) => boolean
) {
  const eventHandlerFactory = React.useCallback(
    (eventType: string) => async (event: KeyboardEvent) => {
      event.preventDefault();

      const payload = {
        message_type: eventType,
        key: event.key,
        code: event.code,
      };

      if (!sendMessage(JSON.stringify(payload)))
        console.error(`Failed to send ${eventType} message`);
    },
    [sendMessage]
  );

  React.useEffect(() => {
    const container = videoRef.current;

    if (!container) return;

    const handleKeyDown = eventHandlerFactory("keydown");
    const handleKeyUp = eventHandlerFactory("keyup");
    const handleKeyPress = eventHandlerFactory("keypress");

    container.addEventListener("keydown", handleKeyDown);
    container.addEventListener("keyup", handleKeyUp);
    container.addEventListener("keypress", handleKeyPress);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("keyup", handleKeyUp);
      container.removeEventListener("keypress", handleKeyPress);
    };
  }, [eventHandlerFactory, videoRef]);
}
