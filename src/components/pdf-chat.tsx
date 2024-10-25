"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileIcon, SendIcon, UploadIcon, User, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image"
import Logo from "./ai-planet.svg"

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT;

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: string;
}

export default function PDFChat() {
  const [file, setFile] = useState<File | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isChatReady, setIsChatReady] = useState(false);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    } else {
      alert("Please select a valid PDF file.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_ENDPOINT}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setChatId(data.chat_id);
      setIsChatReady(true);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatId || !inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    // Add user message to chat history immediately
    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setChatHistory((prev) => [...prev, newUserMessage]);

    setIsAiResponding(true);

    try {
      const response = await fetch(`${API_ENDPOINT}/chat/${chatId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage }),
      });

      if (!response.ok) throw new Error("Chat request failed");

      const data = await response.json();

      // Add AI response to chat history
      const newAiMessage: ChatMessage = {
        role: "ai",
        content: data.response,
        timestamp: new Date().toISOString(),
      };
      setChatHistory((prev) => [...prev, newAiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsAiResponding(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="flex flex-col h-screen w-full mx-auto">
      <header className="flex justify-between items-center p-4 border-b shadow-xl">
        <div className="text-2xl font-bold">
          <Image
            src={Logo}
            height={40}
            alt={"AI-Planet Logo"}
          />
        </div>
        <div className="flex items-center gap-2">
          {file && (
            <div className="flex items-center gap-2 text-green-500">
              <div className="p-[3px] rounded border-[1px] border-green-500">
                <FileIcon className="w-5 h-5" />
              </div>
              <span className="text-sm truncate max-w-[150px]">
                {file.name}
              </span>
            </div>
          )}
          <Input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />
          <Button
            variant="outline"
            className="border-black gap-4"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isChatReady}
          >
            <UploadIcon className="w-4 h-4" />
            <span className="hidden md:block">
            {file ? "Change PDF" : "Upload PDF"}
            </span>
          </Button>
          {file && !isChatReady && (
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Start Chat"}
            </Button>
          )}
        </div>
      </header>

      
      <ScrollArea className="container max-w-3xl mx-auto flex-grow p-4" ref={chatAreaRef}>
        {chatHistory.map((message, index) => (
          <div key={index} className="my-4">
            <div className="flex mb-2">
              <Avatar className="mr-2 mt-1">
                <AvatarFallback>
                  {message.role === "user" ? <User /> : <Bot />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <div className="bg-white p-2 rounded-lg">
                  {message.role === "user" ? (
                    <p>{message.content}</p>
                  ) : (
                    <ReactMarkdown className="prose prose-sm max-w-none">
                      {message.content}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isAiResponding && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">AI is thinking...</span>
          </div>
        )}
      </ScrollArea>

      <div className="container max-w-3xl mx-auto p-4 border-t">
        <div className="relative">
          <Input
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={!isChatReady || isAiResponding}
            className="pr-10"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isChatReady || !inputMessage.trim() || isAiResponding}
            className="absolute right-0 top-0 bottom-0 rounded-l-none"
          >
            <SendIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>


    </div>
  );
}
