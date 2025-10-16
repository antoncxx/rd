import { useEffect, useRef, useCallback } from "react";

interface SignalingHookOptions {
  url: string;
  onStatusChange?: (status: string, className: string) => void;
  onTrack?: (event: RTCTrackEvent) => void;
  onDataChannelMessage?: (message: string) => void;
  iceServers?: RTCIceServer[];
}

export function useSignaling({
  url,
  onStatusChange,
  onTrack,
  onDataChannelMessage,
  iceServers,
}: SignalingHookOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const defaultConfig: RTCConfiguration = {
    iceServers: iceServers || [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
    iceCandidatePoolSize: 10,
  };

  const updateStatus = useCallback(
    (status: string, className: string) => {
      if (onStatusChange) onStatusChange(status, className);
    },
    [onStatusChange]
  );

  const handleAnswer = useCallback(async (message: any) => {
    try {
      const pc = pcRef.current;
      if (!pc) return;

      await pc.setRemoteDescription(
        new RTCSessionDescription({
          type: "answer",
          sdp: message.sdp,
        })
      );
    } catch (error: any) {
      console.error(`Error handling answer: ${error.message}`);
    }
  }, []);

  const handleIceCandidate = useCallback(async (message: any) => {
    try {
      const pc = pcRef.current;
      if (!pc) return;

      const candidate = JSON.parse(message.candidate);
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error: any) {
      console.error(`Error adding ICE candidate: ${error.message}`);
    }
  }, []);

  const initializePeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(defaultConfig);
    pcRef.current = pc;

    pc.addTransceiver("video", { direction: "recvonly" });

    pc.ontrack = (event) => {
      onTrack && onTrack(event);
    };

    const dataChannel = pc.createDataChannel("chat");
    dataChannelRef.current = dataChannel;

    dataChannel.onopen = () => {};

    dataChannel.onmessage = (event) => {
      if (onDataChannelMessage) onDataChannelMessage(event.data);
    };

    dataChannel.onclose = () => {};

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        wsRef.current?.send(
          JSON.stringify({
            type: "ice",
            candidate: JSON.stringify(event.candidate),
          })
        );
      } else {
        console.error("ICE gathering complete");
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case "connecting":
          updateStatus("WebRTC Connecting...", "connecting");
          break;
        case "connected":
          updateStatus("WebRTC Connected!", "connected");
          break;
        case "disconnected":
          updateStatus("WebRTC Disconnected", "disconnected");
          break;
        case "failed":
          updateStatus("WebRTC Failed", "disconnected");
          break;
        case "closed":
          updateStatus("WebRTC Closed", "disconnected");
          break;
      }
    };

    pc.oniceconnectionstatechange = () => {};
  }, [updateStatus, onTrack, onDataChannelMessage]);

  const createOffer = useCallback(async () => {
    try {
      const pc = pcRef.current;
      if (!pc) return;

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      wsRef.current?.send(
        JSON.stringify({
          type: "offer",
          sdp: offer.sdp,
        })
      );
    } catch (error: any) {
      console.error(`Error creating offer: ${error.message}`);
    }
  }, []);

  const connect = useCallback(() => {
    if (!url) {
      updateStatus("Error: No server URL", "disconnected");
      return;
    }

    updateStatus("Connecting to signaling server...", "connecting");

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      updateStatus("Connected to Signaling Server", "connected");
      initializePeerConnection();

      setTimeout(() => {
        createOffer();
      }, 500);
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "answer") {
        await handleAnswer(message);
      } else if (message.type === "ice") {
        await handleIceCandidate(message);
      }
    };

    ws.onerror = (error) => {
      updateStatus("Connection Error", "disconnected");
    };

    ws.onclose = () => {
      updateStatus("Disconnected", "disconnected");
    };
  }, [
    url,
    updateStatus,
    initializePeerConnection,
    createOffer,
    handleAnswer,
    handleIceCandidate,
  ]);

  const sendMessage = useCallback((message: string) => {
    const dataChannel = dataChannelRef.current;

    if (message && dataChannel && dataChannel.readyState === "open") {
      dataChannel.send(message);
      return true;
    }

    return false;
  }, []);

  const disconnect = useCallback(() => {
    dataChannelRef.current?.close();
    pcRef.current?.close();
    wsRef.current?.close();
  }, []);

  useEffect(() => {
    if (url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url]);

  return {
    websocket: wsRef,
    peerConnection: pcRef,
    dataChannel: dataChannelRef,
    sendMessage,
    createOffer,
  };
}
