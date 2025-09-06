import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface ChatMessage {
  id: string;
  content: string;
  isFromUser: boolean;
  createdAt: string;
}

export default function Chatbot() {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/chat/messages"],
    enabled: isAuthenticated,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/chat/messages", { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setMessage("");
      setIsTyping(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      setIsTyping(false);
    },
  });

  // WebSocket connection
  useEffect(() => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log("WebSocket connected");
      setSocket(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_response') {
          queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    };
    
    ws.onclose = () => {
      console.log("WebSocket disconnected");
      setSocket(null);
    };
    
    return () => {
      ws.close();
    };
  }, [isAuthenticated, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || sendMessageMutation.isPending) return;

    const messageContent = message.trim();
    setIsTyping(true);
    
    // Send via WebSocket if available
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'chat',
        content: messageContent,
        userId: user?.id,
      }));
    }
    
    sendMessageMutation.mutate(messageContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return messageDate.toLocaleDateString();
  };

  if (!isAuthenticated && !isLoading) {
    return null; // Will redirect
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-foreground">Chat with Mindful AI</h2>
            <p className="mt-2 text-muted-foreground">Your personal mental wellness companion</p>
          </div>
          
          {messagesLoading ? (
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-primary mb-4 block">smart_toy</span>
                <h3 className="text-lg font-semibold text-foreground mb-2">Start a conversation</h3>
                <p className="text-muted-foreground mb-4">
                  Hi! I'm here to help you with mental health support and guidance. How are you feeling today?
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8" data-testid="chat-messages">
              {messages.map((msg: ChatMessage) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-4 ${msg.isFromUser ? 'justify-end' : ''}`}
                  data-testid={`message-${msg.id}`}
                >
                  {!msg.isFromUser && (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary">smart_toy</span>
                    </div>
                  )}
                  <div className={msg.isFromUser ? 'order-2' : ''}>
                    <p className={`text-sm font-semibold ${msg.isFromUser ? 'text-right' : ''} text-foreground`}>
                      {msg.isFromUser ? 'You' : 'Mindful AI'}
                    </p>
                    <div className={`mt-1 chat-message rounded-xl px-4 py-3 ${
                      msg.isFromUser 
                        ? 'rounded-tr-none bg-primary text-primary-foreground' 
                        : 'rounded-tl-none bg-muted'
                    }`}>
                      <p className={`text-base ${msg.isFromUser ? 'text-primary-foreground' : 'text-foreground'}`}>
                        {msg.content}
                      </p>
                    </div>
                    <p className={`text-xs text-muted-foreground mt-1 ${msg.isFromUser ? 'text-right' : ''}`}>
                      {getTimeAgo(msg.createdAt)}
                    </p>
                  </div>
                  {msg.isFromUser && user?.profileImageUrl && (
                    <div 
                      className="w-10 h-10 rounded-full bg-cover bg-center flex-shrink-0"
                      style={{ backgroundImage: `url(${user.profileImageUrl})` }}
                    />
                  )}
                  {msg.isFromUser && !user?.profileImageUrl && (
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-primary-foreground">person</span>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-start gap-4" data-testid="typing-indicator">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary">smart_toy</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Mindful AI</p>
                    <div className="mt-1 chat-message rounded-xl rounded-tl-none bg-muted px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Input */}
      <div className="border-t border-border bg-card p-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Input 
              className="pr-14"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendMessageMutation.isPending}
              data-testid="input-chat-message"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              className="absolute inset-y-0 right-0 rounded-l-none"
              data-testid="button-send-message"
            >
              <span className="material-symbols-outlined">send</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            This AI assistant is for general guidance only and not a replacement for professional mental health care.
          </p>
        </div>
      </div>
    </div>
  );
}
