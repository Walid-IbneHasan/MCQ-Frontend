// lib/providers/exam-websocket-provider.tsx - Fixed WebSocket
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useAuth } from "../../hooks/use-auth";
import { useToastContext } from "./toast-provider";

interface ExamWebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  joinExamSession: (sessionId: string) => void;
  leaveExamSession: () => void;
}

const ExamWebSocketContext = createContext<ExamWebSocketContextType | null>(
  null
);

export function useExamWebSocket() {
  const context = useContext(ExamWebSocketContext);
  if (!context) {
    throw new Error(
      "useExamWebSocket must be used within ExamWebSocketProvider"
    );
  }
  return context;
}

interface ExamWebSocketProviderProps {
  children: React.ReactNode;
}

export function ExamWebSocketProvider({
  children,
}: ExamWebSocketProviderProps) {
  const { user } = useAuth();
  const { toast } = useToastContext();
  const [isConnected, setIsConnected] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    // Don't connect if user is not authenticated or doesn't have access token
    if (!user?.id || !user?.accessToken) {
      console.log("WebSocket: User not authenticated, skipping connection");
      return;
    }

    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      // Note: WebSocket endpoint might not be implemented yet in your backend
      // This is optional for exam creation functionality
      const wsUrl =
        process.env.NODE_ENV === "production"
          ? `wss://${window.location.host}/ws/exam/`
          : `ws://127.0.0.1:8000/ws/exam/`;

      console.log("WebSocket: Attempting to connect to:", wsUrl);
      ws.current = new WebSocket(`${wsUrl}?token=${user.accessToken}`);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);

        // Only attempt to reconnect if it's not a clean close and user is still authenticated
        if (
          event.code !== 1000 &&
          reconnectAttempts.current < maxReconnectAttempts &&
          user?.accessToken
        ) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
          console.log(
            `WebSocket: Reconnecting in ${delay}ms (attempt ${
              reconnectAttempts.current + 1
            })`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case "exam_timer_update":
        // Timer updates will be handled by polling in the component
        break;

      case "exam_auto_submit":
        toast({
          title: "Time's Up!",
          description: "Your exam is being automatically submitted.",
          variant: "destructive",
        });
        break;

      case "exam_session_expired":
        toast({
          title: "Session Expired",
          description: "Your exam session has expired.",
          variant: "destructive",
        });
        break;

      case "notification":
        toast({
          title: data.title || "Notification",
          description: data.message,
          variant: data.variant || "default",
        });
        break;

      default:
        console.log("Unknown WebSocket message type:", data.type);
    }
  };

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket not connected, cannot send message");
    }
  };

  const joinExamSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    sendMessage({
      type: "join_exam_session",
      session_id: sessionId,
    });
  };

  const leaveExamSession = () => {
    if (currentSessionId) {
      sendMessage({
        type: "leave_exam_session",
        session_id: currentSessionId,
      });
      setCurrentSessionId(null);
    }
  };

  // Only attempt to connect when user is authenticated
  useEffect(() => {
    if (user?.id && user?.accessToken) {
      // Small delay to avoid immediate connection attempts
      const timer = setTimeout(() => {
        connect();
      }, 1000);

      return () => {
        clearTimeout(timer);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (ws.current) {
          ws.current.close(1000, "Component unmounting");
        }
      };
    }
  }, [user?.id, user?.accessToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveExamSession();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  const value: ExamWebSocketContextType = {
    isConnected,
    sendMessage,
    joinExamSession,
    leaveExamSession,
  };

  return (
    <ExamWebSocketContext.Provider value={value}>
      {children}
    </ExamWebSocketContext.Provider>
  );
}
