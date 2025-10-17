# Remote Desktop Client - Technical Specification

## Overview

A React component providing browser-based remote desktop functionality via WebRTC. Streams video from a remote server and transmits keyboard, mouse, and clipboard events for remote control.

## Core Component

### `RemoteDesktop`

```tsx
import RemoteDesktop from "./RemoteDesktop";

<RemoteDesktop url="ws://${SESSION_TOKEN}.wallguard.server.net/wallguard/gateway/rd" />;
```

**Props:**

- `url` (string, required): WebSocket signaling server endpoint

**Behavior:**

- Establishes WebRTC connection through WebSocket signaling
- Renders remote desktop video stream
- Captures and transmits all user input (keyboard, mouse, clipboard)
- Auto-scales video maintaining aspect ratio

## Integration Requirements

### 1. Signaling Server

Your backend must implement a WebSocket endpoint that handles:

**Incoming Messages (Client → Server):**

```json
{ "type": "offer", "sdp": "<sdp-string>" }
{ "type": "ice", "candidate": "<ice-candidate-json>" }
```

**Outgoing Messages (Server → Client):**

```json
{ "type": "answer", "sdp": "<sdp-string>" }
{ "type": "ice", "candidate": "<ice-candidate-json>" }
```

### 2. WebRTC Video Track

Server must provide a video track through the peer connection. Client configures as receive-only (`recvonly` transceiver).

### 3. Data Channel Processing

All control events are sent via WebRTC data channel (name: `"chat"`) as JSON strings:

**Keyboard Events:**

```json
{
  "message_type": "keydown" | "keyup" | "keypress",
  "key": "a",
  "code": "KeyA"
}
```

**Mouse Events:**

```json
{
  "message_type": "mousemove" | "mousedown" | "mouseup",
  "button": "left" | "right" | "middle" | "back" | "forward",
  "x": 1920,
  "y": 1080
}
```

**Clipboard Events:**

```json
{
  "message_type": "clipboard",
  "content": "clipboard text"
}
```

## Technical Details

### Connection Flow

1. Client connects to WebSocket signaling server
2. Client creates RTCPeerConnection with video transceiver
3. Client generates SDP offer and sends via WebSocket
4. Server responds with SDP answer
5. ICE candidates exchanged bidirectionally
6. WebRTC peer connection established
7. Video stream received and rendered
8. Data channel opens for control messages

### Coordinate Transformation

Mouse coordinates are automatically transformed from local video element dimensions to remote screen dimensions. The system handles:

- Aspect ratio differences
- Video scaling and letterboxing
- Pixel-perfect accuracy with boundary clamping

Algorithm accounts for:

```
scale = min(displayWidth / remoteWidth, displayHeight / remoteHeight)
offset = (displaySize - scaledRemoteSize) / 2
remoteCoord = (clientCoord - offset) / scale
```

### Dependencies

```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0"
}
```

Styling uses Tailwind CSS utility classes.

### Browser Requirements

- **WebRTC Support**: Chrome 80+, Firefox 75+, Safari 14+, Edge 80+
- **HTTPS**: Required in production for WebRTC and clipboard access
- **Permissions**: Clipboard read permission for clipboard sync

## API Reference

### `useSignaling` Hook

Custom hook managing WebRTC connection lifecycle.

**Parameters:**

```typescript
{
  url: string;
  onStatusChange?: (status: string, className: string) => void;
  onTrack?: (event: RTCTrackEvent) => void;
  onDataChannelMessage?: (message: string) => void;
  iceServers?: RTCIceServer[];  // Optional, defaults to Google STUN
}
```

**Returns:**

```typescript
{
  sendMessage: (message: string) => boolean;
  websocket: RefObject<WebSocket>;
  peerConnection: RefObject<RTCPeerConnection>;
  dataChannel: RefObject<RTCDataChannel>;
  createOffer: () => Promise<void>;
}
```

**Default ICE Servers:**

```javascript
[
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];
```

### Connection States

| State        | Trigger                     | CSS Class      |
| ------------ | --------------------------- | -------------- |
| Disconnected | Initial/connection lost     | `disconnected` |
| Connecting   | WebSocket/WebRTC connecting | `connecting`   |
| Connected    | Active connection           | `connected`    |

## Security Considerations

1. **Use WSS in Production**: Secure WebSocket required
2. **Validate Input**: Server must sanitize all control messages
3. **HTTPS Required**: WebRTC requires secure context
4. **TURN Servers**: May be needed for restrictive networks

## Known Limitations

- **Clipboard**: Requires user permission, triggers on video focus only
- **Keyboard**: Only works when video element has focus
- **Network**: UDP traffic must be allowed for WebRTC
- **Latency**: Typical range 50-200ms depending on network
- **Browser Storage**: Not used; all state is in-memory

## Example Integration

```tsx
import { RemoteDesktop } from "@/components/RemoteDesktop";

function DesktopViewer({ sessionId }: { sessionId: string }) {
  const signalingUrl = `wss://api.example.com/desktop/${sessionId}`;

  return (
    <div className="desktop-container">
      <RemoteDesktop url={signalingUrl} />
    </div>
  );
}
```

## Troubleshooting

| Issue                 | Solution                                                            |
| --------------------- | ------------------------------------------------------------------- |
| Video not displaying  | Verify server sends video track; check WebRTC state in DevTools     |
| Mouse coordinates off | Ensure video metadata loads correctly (remote dimensions)           |
| Keyboard not working  | Click video element to focus; check data channel state              |
| Connection fails      | Verify signaling URL; check STUN/TURN accessibility; review console |

## Support

For WebRTC debugging, enable chrome://webrtc-internals/ in Chrome or about:webrtc in Firefox.
