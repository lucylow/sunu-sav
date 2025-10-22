// frontend/src/components/ai/ChatAssistant.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import aiClient from '../../ai/mockAiClient.js';

interface ChatAssistantProps {
  userId: string;
}

interface Message {
  who: 'me' | 'ai';
  text: string;
  ts: string;
}

export default function ChatAssistant({ userId }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('fr');
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const send = async (msg: string) => {
    if (!msg.trim()) return;
    
    setMessages(m => [...m, { who: 'me', text: msg, ts: new Date().toISOString() }]);
    setText('');
    
    try {
      const reply = await aiClient.chat({ userId, message: msg, language: selectedLanguage });
      setMessages(m => [...m, { who: 'ai', text: reply.text, ts: reply.timestamp }]);
      speak(reply.text, selectedLanguage);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(m => [...m, { 
        who: 'ai', 
        text: 'Sorry, I encountered an error. Please try again.', 
        ts: new Date().toISOString() 
      }]);
    }
  };

  // Voice: Web Speech API (browser) fallback
  async function startListen() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice not supported in this browser');
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SpeechRecognition();
    r.lang = selectedLanguage === 'wo' ? 'wo' : (selectedLanguage === 'fr' ? 'fr-FR' : 'en-US');
    r.onresult = (ev: any) => {
      const transcript = ev.results[0][0].transcript;
      setText(transcript);
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.start();
    recognitionRef.current = r;
    setListening(true);
  }

  function stopListen() { 
    recognitionRef.current?.stop(); 
    setListening(false); 
  }

  function speak(text: string, language: string) {
    if (!('speechSynthesis' in window)) return;
    
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'wo' ? 'wo' : (language === 'fr' ? 'fr-FR' : 'en-US');
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    (window as any).speechSynthesis.cancel();
    (window as any).speechSynthesis.speak(utterance);
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(text);
    }
  };

  const quickQuestions = {
    fr: [
      "Combien dois-je cette semaine?",
      "Quel est mon score de crédit?",
      "Comment rejoindre un groupe?"
    ],
    wo: [
      "Ñaata laa joxe ci ayu-benn bi?",
      "Lan laa am ci credit score?",
      "Nan laa dugg ci tontine group?"
    ],
    en: [
      "How much do I owe this week?",
      "What's my credit score?",
      "How do I join a group?"
    ]
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            AI Assistant
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-xs px-2 py-1 rounded border"
            >
              <option value="fr">🇫🇷 Français</option>
              <option value="wo">🇸🇳 Wolof</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Messages */}
        <div 
          className="space-y-3 max-h-64 overflow-y-auto border rounded-lg p-3"
          style={{ minHeight: '200px' }}
        >
          {messages.length === 0 && (
            <div className="text-center text-sm text-gray-500 py-4">
              <p>Ask me anything about your tontine!</p>
              <div className="mt-3 space-y-2">
                {quickQuestions[selectedLanguage as keyof typeof quickQuestions].map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start"
                    onClick={() => setText(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.who === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  m.who === 'me'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{m.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs opacity-70">
                    {new Date(m.ts).toLocaleTimeString()}
                  </span>
                  {m.who === 'ai' && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedLanguage}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask in ${selectedLanguage === 'wo' ? 'Wolof' : selectedLanguage === 'fr' ? 'French' : 'English'}...`}
              className="flex-1"
            />
            <Button
              variant={listening ? "destructive" : "outline"}
              size="sm"
              onClick={() => listening ? stopListen() : startListen()}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => speak(messages[messages.length - 1]?.text || '', selectedLanguage)}
              disabled={!messages.length || isSpeaking}
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button
              onClick={() => send(text)}
              disabled={!text.trim()}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {listening && (
            <div className="text-center text-sm text-blue-600">
              <Mic className="h-4 w-4 inline mr-1" />
              Listening...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
