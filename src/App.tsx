import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';
import { Video, PhoneOff } from 'lucide-react';

const App: React.FC = () => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [peer, setPeer] = useState<Peer.Instance | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
    console.log('Connecting to server:', serverUrl);
    const newSocket = io(serverUrl, { transports: ['websocket'] });
    setSocket(newSocket);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch((error) => console.error('Error accessing media devices:', error));

    return () => {
      newSocket.disconnect();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // ... rest of the component remains the same
};

export default App;