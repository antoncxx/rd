import { useCallback, useEffect } from "react";

export default function useMouse(
  canvasRef: React.RefObject<HTMLVideoElement | null>,
  sendMessage: (message: any) => boolean,
  remoteScreenWidth: number,
  remoteScreenHeight: number
) {
  type MouseEventType = "mousemove" | "mousedown" | "mouseup";
  const eventHandlerFactory = useCallback(
    (eventType: MouseEventType) => (event: MouseEvent) => {
      const videoElement = canvasRef.current;
      if (!videoElement) return;

      const { x, y } = getCursorCoordinates(
        videoElement,
        event,
        remoteScreenWidth,
        remoteScreenHeight
      );

      const payload = {
        message_type: eventType,
        button: getButtonName(event),
        x,
        y,
      };

      if (!sendMessage(JSON.stringify(payload)))
        console.error(`Failed to send ${eventType} message`);
    },
    [canvasRef, sendMessage, remoteScreenWidth, remoteScreenHeight]
  );

  useEffect(() => {
    const videoElement = canvasRef.current;
    if (!videoElement) return;

    const handleMouseMove = eventHandlerFactory("mousemove");
    const handleMouseDown = eventHandlerFactory("mousedown");
    const handleMouseUp = eventHandlerFactory("mouseup");

    videoElement.addEventListener("mousemove", handleMouseMove);
    videoElement.addEventListener("mousedown", handleMouseDown);
    videoElement.addEventListener("mouseup", handleMouseUp);

    return () => {
      videoElement.removeEventListener("mousemove", handleMouseMove);
      videoElement.removeEventListener("mousedown", handleMouseDown);
      videoElement.removeEventListener("mouseup", handleMouseUp);
    };
  }, [eventHandlerFactory, canvasRef]);
}

function getButtonName(event: MouseEvent) {
  switch (event.button) {
    case 0:
      return "left";
    case 1:
      return "middle";
    case 2:
      return "right";
    case 3:
      return "back";
    case 4:
      return "forward";
    default:
      return "unknown";
  }
}

function getCursorCoordinates(
  videoElement: HTMLVideoElement,
  event: MouseEvent,
  remoteScreenWidth: number,
  remoteScreenHeight: number
) {
  const rect = videoElement.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  const scale = Math.min(w / remoteScreenWidth, h / remoteScreenHeight);

  const drawWidth = remoteScreenWidth * scale;
  const drawHeight = remoteScreenHeight * scale;

  const offsetX = (w - drawWidth) / 2;
  const offsetY = (h - drawHeight) / 2;

  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const rawX = (mouseX - offsetX) / scale;
  const rawY = (mouseY - offsetY) / scale;

  const clampedX = Math.max(0, Math.min(remoteScreenWidth, rawX));
  const clampedY = Math.max(0, Math.min(remoteScreenHeight, rawY));

  const x = Math.round(clampedX);
  const y = Math.round(clampedY);

  return { x, y };
}
