import React, { useReducer, useRef, useCallback } from "react";
import { useSignaling } from "./useSignaling";
import { useKeyboard } from "./useKeyboard";
import useMouse from "./useMouse";
import useClipboard from "./useClipboard";

type RemoteDesktopProps = {
  url: string;
};

const initialState = {
  status: { text: "Disconnected", className: "disconnected" },
  remoteScreenSize: { width: 800, height: 600 },
};

function reducer(state: typeof initialState, action: any) {
  switch (action.type) {
    case "UPDATE_STATUS":
      return {
        ...state,
        status: { text: action.text, className: action.className },
      };
    case "UPDATE_REMOTE_SCREEN_DIMENTIONS":
      return {
        ...state,
        remoteScreenSize: {
          width: action.width,
          height: action.height,
        },
      };
    default:
      return state;
  }
}

const RemoteDesktop: React.FC<RemoteDesktopProps> = ({ url }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const videoRef = useRef<HTMLVideoElement>(null);

  const updateStatus = useCallback((text: string, className: string) => {
    dispatch({ type: "UPDATE_STATUS", text, className });
  }, []);

  const handleTrack = useCallback((event: RTCTrackEvent) => {
    if (videoRef.current) {
      if (event.streams && event.streams[0]) {
        videoRef.current.srcObject = event.streams[0];
      } else {
        const stream = new MediaStream();
        stream.addTrack(event.track);
        videoRef.current.srcObject = stream;
      }
    }
  }, []);

  const { sendMessage } = useSignaling({
    url,
    onStatusChange: updateStatus,
    onTrack: handleTrack,
    onDataChannelMessage: (e) => {
      console.log("Received message from data channel ", e);
    },
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  });

  useKeyboard(videoRef, sendMessage);
  useMouse(
    videoRef,
    sendMessage,
    state.remoteScreenSize.width,
    state.remoteScreenSize.height
  );
  useClipboard(videoRef, sendMessage);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6 p-4 bg-black rounded-lg">
          <video
            tabIndex={0}
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full max-w-2xl bg-black rounded-lg"
            onLoadedMetadata={(ev) => {
              dispatch({
                type: "UPDATE_REMOTE_SCREEN_DIMENTIONS",
                width: ev.currentTarget.videoWidth,
                height: ev.currentTarget.videoHeight,
              });
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(RemoteDesktop);
