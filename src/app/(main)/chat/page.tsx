'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, Loader2 } from 'lucide-react';
import ChatMarkdown from '@/components/Chat/ChatMarkDown';

type Message = {
  role: 'user' | 'assistant';
  message: string;
  created_at: string;
};

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<string>('');

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight
    }
  }, [messages]);
  console.log("This is in chat")

  useEffect(() => {
    // const func = async () => {
    //   const response = await fetch('/api/chat', {
    //     method: 'GET',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     }
    //   });
    //   const result = (await response.json()).data;
    //   setMessages(result);
    // }

    // console.log("Loading Chat page")
    // func()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const onMic = async () => {
    if (!isRecording) {
      // Start recording
      const startRecording = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm',
          });
          mediaRecorderRef.current = mediaRecorder;
          chunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              chunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = async () => {
            stream.getTracks().forEach((track) => track.stop());

            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }

            if (chunksRef.current.length > 0) {
              try {
                setIsProcessing(true);
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('audio', audioBlob);

                console.log('Sending audio for transcription:', {
                  size: audioBlob.size,
                  type: audioBlob.type,
                });

                const response = await fetch('/api/transcribe', {
                  method: 'POST',
                  body: formData,
                });

                const data = await response.json();
                if (!response.ok) {
                  throw new Error(data.error || 'Transcription failed');
                }

                if (data.text) {
                  handleSubmit(data.text);
                } else {
                  throw new Error('No transcription text received');
                }
              } catch (err) {
                console.error('Transcription error:', err);
                setError(err instanceof Error ? err.message : 'Failed to transcribe audio. Please try again.');
              } finally {
                setIsProcessing(false);
              }
            }

            setIsRecording(false);
          };

          mediaRecorder.start();
          setIsRecording(true);

          // Auto-stop recording after 2 minutes (Whisper API limit)
          timerRef.current = setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
          }, 120000); // 2 minutes
        } catch (error) {
          console.error('Recording error:', error);
          setError('Microphone access denied or not available.');
        }
      };

      // Call startRecording function
      startRecording();
    } else {
      // Stop recording
      const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      };

      stopRecording();
    }
  };

  const handleSubmit = async (message: string = input) => {
    if (!message.trim()) return;

    setInput('');
    setIsLoading(true);
    setCurrentStreamingMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const responseData = await response.json();

      // Add user message immediately
      const userMessage: Message = {
        role: 'user',
        message: message,
        created_at: new Date().toISOString()
      };

      // Add bot message from response
      const botMessage: Message = {
        role: 'assistant',
        message: responseData.message || '',
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, userMessage, botMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  function formatDate(dateString: string) {
    const date = new Date(dateString);

    // Get local date parts
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0]; // Yesterday's date as "YYYY-MM-DD"

    // Format time
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedTime = `${(hours % 12 || 12).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;

    // Determine the appropriate label
    if (date.toISOString().split('T')[0] === today) {
      return `Today ${formattedTime}`;
    } else if (date.toISOString().split('T')[0] === yesterdayStr) {
      return `Yesterday ${formattedTime}`;
    } else {
      return date.toISOString().split('T')[0].slice(5).replace('-', '/') + ` ${formattedTime}`; // Format MM-DD
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-xl font-semibold text-center text-gray-800">AI Assistant</h1>
        {error && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 rounded text-sm text-center">
            {error}
          </div>
        )}
        {isProcessing && (
          <div className="mt-2 p-2 bg-blue-100 text-blue-700 rounded text-sm text-center">
            Processing your audio...
          </div>
        )}
      </header>

      {/* Chat container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
        {messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mic className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-lg font-medium">Welcome to your AI Assistant</p>
            <p className="text-sm mt-2">Type a message or use voice input to get started</p>
          </div>
        ) : (
          <>
            {messages?.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                    }`}
                >
                  <ChatMarkdown content={message.message} />
                  <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatDate(message.created_at)}
                  </p>
                </div>
              </div>
            ))}
            {currentStreamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-white text-gray-800 rounded-bl-none shadow-sm">
                  <ChatMarkdown content={currentStreamingMessage} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input area */}
      <div className="bg-white p-4">
        <div className="flex justify-center gap-2">
          <button
            onClick={onMic}
            className={`p-2 rounded-full ${isRecording ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            disabled={isLoading}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
            placeholder="Type your message..."
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />

          <button
            onClick={() => handleSubmit()}
            disabled={isLoading || (!input.trim() && !isRecording)}
            className={`p-2 rounded-full ${isLoading || (!input.trim() && !isRecording)
              ? 'bg-gray-300 text-gray-500'
              : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div >
  );
}
