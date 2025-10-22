import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Send, Volume2, VolumeX } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/hooks/useLanguage';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  language: string;
}

interface ChatAssistantProps {
  userId?: string;
  className?: string;
}

export default function ChatAssistant({ userId, className = '' }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isOpen, setIsOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<any>(null);
  
  const { t } = useLanguage();

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = selectedLanguage === 'wolof' ? 'fr' : selectedLanguage;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }

    if ('speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
    }
  }, [selectedLanguage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageMutation = trpc.ai.chat.sendMessage.useMutation({
    onSuccess: (response) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: response.message,
        isUser: false,
        timestamp: new Date(),
        language: response.language
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Speak the response
      if (synthesisRef.current && selectedLanguage !== 'en') {
        speakText(response.message);
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date(),
        language: 'en'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const speakText = (text: string) => {
    if (synthesisRef.current) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage === 'wolof' ? 'fr' : selectedLanguage;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      synthesisRef.current.speak(utterance);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
      language: selectedLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    sendMessageMutation.mutate({
      message: inputMessage,
      language: selectedLanguage,
      userId: userId
    });
  };

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const languageOptions = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'wolof', name: 'Wolof', flag: '🇸🇳' }
  ];

  const quickQuestions = [
    "How much do I owe this week?",
    "What's my credit score?",
    "Show me my savings projection",
    "How do I join a tontine group?",
    "What are Lightning payments?"
  ];

  const quickQuestionsWolof = [
    "Ñaata laa joxe ci ayu-benn bi?",
    "Lan laa am ci credit score?",
    "Wone ma savings projection bi",
    "Nan laa dugg ci tontine group?",
    "Lan laa Lightning payments?"
  ];

  const quickQuestionsFr = [
    "Combien dois-je cette semaine?",
    "Quel est mon score de crédit?",
    "Montrez-moi ma projection d'épargne",
    "Comment rejoindre un groupe tontine?",
    "Que sont les paiements Lightning?"
  ];

  const getQuickQuestions = () => {
    switch (selectedLanguage) {
      case 'wolof': return quickQuestionsWolof;
      case 'fr': return quickQuestionsFr;
      default: return quickQuestions;
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 z-50 rounded-full h-14 w-14 shadow-lg ${className}`}
        size="lg"
      >
        <Volume2 className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 z-50 w-96 h-[500px] shadow-xl ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{t('aiAssistant')}</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="text-xs px-2 py-1 rounded border"
            >
              {languageOptions.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              ×
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col h-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.length === 0 && (
            <div className="text-center text-sm text-gray-500 py-4">
              <p>{t('askMeAnything')}</p>
              <div className="mt-3 space-y-2">
                {getQuickQuestions().map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start"
                    onClick={() => setInputMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.isUser
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {!message.isUser && (
                    <Badge variant="secondary" className="text-xs">
                      {message.language}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {sendMessageMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('typeYourMessage')}
              className="flex-1"
            />
            <Button
              variant={isListening ? "destructive" : "outline"}
              size="sm"
              onClick={handleVoiceInput}
              disabled={!recognitionRef.current}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => speakText(messages[messages.length - 1]?.text || '')}
              disabled={!messages.length || isSpeaking}
            >
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || sendMessageMutation.isPending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {isListening && (
            <div className="text-center text-sm text-blue-600">
              <Mic className="h-4 w-4 inline mr-1" />
              {t('listening')}...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
