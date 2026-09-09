'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
    "What's your AI engineering experience?",
    'What projects have you built?',
    'Are you currently open to work?',
];

export default function Twin() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    session_id: sessionId || undefined,
                }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();

            if (!sessionId) {
                setSessionId(data.session_id);
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            // Refocus the input after message is sent
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleSuggestedQuestion = (question: string) => {
        setInput(question);
        inputRef.current?.focus();
    };

    // Check if avatar exists
    const [hasAvatar, setHasAvatar] = useState(false);
    useEffect(() => {
        // Check if avatar.png exists
        fetch('/avatar.png', { method: 'HEAD' })
            .then(res => setHasAvatar(res.ok))
            .catch(() => setHasAvatar(false));
    }, []);

    const avatar = (sizeClasses: string, iconClasses: string) => (
        <div className={`rounded-full flex items-center justify-center bg-zinc-900 border-2 border-zinc-200 overflow-hidden flex-shrink-0 ${sizeClasses}`}>
            {hasAvatar ? (
                <img src="/avatar.png" alt="Digital Twin Avatar" className="w-full h-full object-cover" />
            ) : (
                <Bot className={`text-white ${iconClasses}`} />
            )}
        </div>
    );

    return (
        <div className="flex flex-col flex-1">
            {messages.length === 0 ? (
                /* Hero */
                <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
                    <div className="mb-6">{avatar('w-20 h-20', 'w-10 h-10')}</div>

                    <h1 className="font-serif text-3xl sm:text-4xl text-zinc-900 leading-snug max-w-xl">
                        I&apos;m Laura&apos;s digital twin.
                    </h1>
                    <p className="mt-4 text-lg text-zinc-600 max-w-xl">
                        Ask me anything about my background or work - I&apos;ll answer as faithfully as I can.
                    </p>
                    <p className="mt-2 text-sm text-zinc-400 max-w-md">
                        I know Laura&apos;s background, projects, and skills.
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-xl">
                        {SUGGESTED_QUESTIONS.map((question) => (
                            <button
                                key={question}
                                onClick={() => handleSuggestedQuestion(question)}
                                className="px-4 py-2 text-sm rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-100 transition-colors"
                            >
                                {question}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                /* Messages */
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="max-w-2xl mx-auto space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${
                                    message.role === 'user' ? 'justify-end' : 'justify-start'
                                }`}
                            >
                                {message.role === 'assistant' && avatar('w-8 h-8', 'w-5 h-5')}

                                <div
                                    className={`max-w-[70%] rounded-md p-3 ${
                                        message.role === 'user'
                                            ? 'bg-zinc-900 text-white'
                                            : 'bg-white border border-zinc-200 text-zinc-800'
                                    }`}
                                >
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                    <p className="text-xs mt-1 font-mono text-zinc-400">
                                        {message.timestamp.toLocaleTimeString()}
                                    </p>
                                </div>

                                {message.role === 'user' && (
                                    <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                {avatar('w-8 h-8', 'w-5 h-5')}
                                <div className="bg-white border border-zinc-200 rounded-md p-3">
                                    <div className="flex space-x-2">
                                        <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce" />
                                        <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce delay-100" />
                                        <div className="w-2 h-2 bg-zinc-300 rounded-full animate-bounce delay-200" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="w-full max-w-2xl mx-auto px-4 pb-6 pt-2">
                <div className="flex items-center gap-2 bg-white border border-zinc-300 rounded-full pl-5 pr-2 py-2 shadow-sm focus-within:ring-2 focus-within:ring-amber-300 focus-within:border-amber-300 transition-shadow">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Message Laura's twin..."
                        className="flex-1 bg-transparent focus:outline-none text-zinc-900 placeholder:text-zinc-400"
                        disabled={isLoading}
                        autoFocus
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
