import React, { useReducer, useRef, useCallback } from "react";
import { useSignaling } from "./useSignaling";
import { useKeyboard } from "./useKeyboard";

type RemoteDesktopProps = {
  url: string;
};

const initialState = {
  status: { text: "Disconnected", className: "disconnected" },
  logs: [] as Array<{ timestamp: string; message: string }>,
  messages: [] as Array<{ sender: string; message: string; id: number }>,
  messageInput: "",
  isConnected: false,
  canCreateOffer: false,
  canSendMessage: false,
};

function reducer(state: typeof initialState, action: any) {
  switch (action.type) {
    case "UPDATE_STATUS":
      return {
        ...state,
        status: { text: action.text, className: action.className },
      };
    // case "ADD_LOG":
    //   return {
    //     ...state,
    //     logs: [
    //       ...state.logs,
    //       { timestamp: action.timestamp, message: action.message },
    //     ],
    //   };
    // case "ADD_MESSAGE":
    //   return {
    //     ...state,
    //     messages: [
    //       ...state.messages,
    //       { sender: action.sender, message: action.message, id: Date.now() },
    //     ],
    //   };
    case "SET_MESSAGE_INPUT":
      return { ...state, messageInput: action.value };
    case "CLEAR_MESSAGE_INPUT":
      return { ...state, messageInput: "" };
    case "SET_CONNECTED":
      return { ...state, isConnected: action.value };
    case "SET_CAN_CREATE_OFFER":
      return { ...state, canCreateOffer: action.value };
    case "SET_CAN_SEND_MESSAGE":
      return { ...state, canSendMessage: action.value };
    case "RESET":
      return initialState;
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

  const { websocket, peerConnection, dataChannel, sendMessage } = useSignaling({
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

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6 p-4 bg-black rounded-lg">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full max-w-2xl bg-black rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(RemoteDesktop);
