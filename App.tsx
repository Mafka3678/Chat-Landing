
import React, { useState, useEffect, useRef } from 'react';
import { ChatStep, Message, LeadData } from './types';
import { getBotResponse } from './services/geminiService';
import ChatMessage from './components/ChatMessage';

import { analytics } from './services/analytics';
import { validateNiche, validateBudget, validatePlans, validateName, validatePhone } from './services/validation';
import { CHAT_CONFIG } from './config';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<ChatStep>(ChatStep.WELCOME);
  const [leadData, setLeadData] = useState<LeadData>({});
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });
  const [botAvatar, setBotAvatar] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('botAvatar') || CHAT_CONFIG.botAvatarUrl || '';
    }
    return CHAT_CONFIG.botAvatarUrl || '';
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setBotAvatar(base64String);
        try {
          localStorage.setItem('botAvatar', base64String);
        } catch (e) {
          console.error("Failed to save avatar to localStorage", e);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    // Initialize analytics with a placeholder or env variable if available
    analytics.init(import.meta.env.VITE_GA_MEASUREMENT_ID);
    
    const initChat = async () => {
      setIsTyping(true);
      analytics.trackEvent('chat_start');
      try {
        const initialMsg = await getBotResponse(ChatStep.WELCOME, "Начни диалог", {});
        addMessage('bot', initialMsg.text, initialMsg.options);
      } catch (e) {
        setHasError(true);
      } finally {
        setIsTyping(false);
      }
    };
    initChat();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const addMessage = (role: 'bot' | 'user', content: string, options?: string[]) => {
    const newMsg: Message = {
      id: Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: new Date(),
      options
    };
    setMessages(prev => [...prev, newMsg]);
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue;
    if (!messageText.trim()) return;

    setHasError(false);
    addMessage('user', messageText);
    setInputValue('');
    setIsTyping(true);
    
    analytics.trackEvent('message_sent', { 
      step: currentStep, 
      message_length: messageText.length 
    });

    let nextStep = currentStep;
    const updatedLeadData = { ...leadData };
    let validationResult = { isValid: true, errorMessage: '' };

    // Логика переключения шагов
    switch (currentStep) {
      case ChatStep.WELCOME: 
        nextStep = ChatStep.BENEFITS; 
        break;
      case ChatStep.BENEFITS: 
        nextStep = ChatStep.QUALIFICATION_NICHE; 
        break;
      case ChatStep.QUALIFICATION_NICHE: 
        validationResult = validateNiche(messageText);
        if (validationResult.isValid) {
          updatedLeadData.niche = messageText;
          nextStep = ChatStep.QUALIFICATION_BUDGET; 
        }
        break;
      case ChatStep.QUALIFICATION_BUDGET:
        validationResult = validateBudget(messageText);
        if (validationResult.isValid) {
          updatedLeadData.budget = messageText;
          nextStep = ChatStep.QUALIFICATION_PLANS;
        }
        break;
      case ChatStep.QUALIFICATION_PLANS:
        validationResult = validatePlans(messageText);
        if (validationResult.isValid) {
          updatedLeadData.plans = messageText;
          nextStep = ChatStep.NAME_COLLECTION;
        }
        break;
      case ChatStep.NAME_COLLECTION:
        validationResult = validateName(messageText);
        if (validationResult.isValid) {
          updatedLeadData.name = messageText;
          nextStep = ChatStep.CONTACT_COLLECTION;
        }
        break;
      case ChatStep.CONTACT_COLLECTION:
        validationResult = validatePhone(messageText);
        if (validationResult.isValid) {
          updatedLeadData.phone = messageText;
          nextStep = ChatStep.COMPLETED;
        }
        break;
    }

    if (!validationResult.isValid) {
      setIsTyping(false);
      addMessage('bot', validationResult.errorMessage || "Пожалуйста, проверьте введенные данные.");
      return;
    }

    if (nextStep !== currentStep) {
      analytics.trackEvent('step_complete', { 
        step: currentStep, 
        next_step: nextStep 
      });
    }

    try {
      const botResponse = await getBotResponse(nextStep, messageText, updatedLeadData);
      
      setLeadData(updatedLeadData);
      setCurrentStep(nextStep);
      
      addMessage('bot', botResponse.text, botResponse.options);
      setIsTyping(false);
      
      if (nextStep === ChatStep.COMPLETED) {
        setIsSubmitted(true);
        analytics.trackEvent('lead_submitted', {
          niche: updatedLeadData.niche,
          budget: updatedLeadData.budget,
          name: updatedLeadData.name
        });
      }
    } catch (e) {
      setHasError(true);
      setIsTyping(false);
      addMessage('bot', "Техническая ошибка связи. Пожалуйста, проверьте соединение.");
    }
  };

  const progress = {
    [ChatStep.WELCOME]: 15,
    [ChatStep.BENEFITS]: 30,
    [ChatStep.QUALIFICATION_NICHE]: 45,
    [ChatStep.QUALIFICATION_BUDGET]: 60,
    [ChatStep.QUALIFICATION_PLANS]: 75,
    [ChatStep.NAME_COLLECTION]: 85,
    [ChatStep.CONTACT_COLLECTION]: 95,
    [ChatStep.COMPLETED]: 100,
  }[currentStep];

  return (
    <div className={`chat-wrapper ${theme}`}>
      <div className="main-card relative bg-white dark:bg-gray-900 transition-colors duration-300">
        <header className="px-8 py-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-none float-anim overflow-hidden cursor-pointer hover:opacity-80 transition-opacity relative group"
              onClick={handleAvatarClick}
              title="Click to upload custom avatar"
            >
              {botAvatar ? (
                <img src={botAvatar} alt={CHAT_CONFIG.botName} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/*"
              onChange={handleAvatarUpload}
            />
            <div>
              <h1 className="font-extrabold text-gray-900 dark:text-white text-lg leading-tight tracking-tight">{CHAT_CONFIG.botName}</h1>
              <div className="flex items-center text-[10px] font-bold text-green-500 uppercase tracking-widest mt-0.5">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Online (AI)
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            <div className="flex -space-x-2">
              {[45,46,47].map(i => (
                 <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 overflow-hidden shadow-sm`}>
                    <img src={`https://i.pravatar.cc/100?img=${i}`} alt="team" className="w-full h-full object-cover" />
                 </div>
              ))}
            </div>
          </div>
        </header>

        <div className="absolute top-[88px] left-0 w-full h-1 bg-gray-50 dark:bg-gray-800 z-20">
          <div 
            className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
            style={{ width: `${progress}%` }}
          />
        </div>

        <main 
          ref={scrollRef}
          className="flex-grow overflow-y-auto px-8 py-10 space-y-4 hide-scrollbar bg-[#fdfdfd] dark:bg-[#0f172a] transition-colors duration-300"
        >
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} botAvatar={botAvatar} />
          ))}
          
          {isTyping && (
            <div className="flex items-center space-x-2 text-gray-400 ml-14 py-4">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
            </div>
          )}

          {isSubmitted && (
            <div className="mt-8 p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2rem] text-white shadow-2xl shadow-indigo-200 message-animate">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold mb-4">Спасибо! 🚀</h3>
              <p className="text-indigo-100 text-sm leading-relaxed mb-6">
                Ваши ответы переданы и уже обрабатываются. Мы свяжемся с вами в ближайшее время.
              </p>
              <div className="space-y-3 bg-black/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm text-xs">
                <div className="flex justify-between"><span className="opacity-60">Имя:</span> <span className="font-bold">{leadData.name}</span></div>
                <div className="flex justify-between"><span className="opacity-60">Ниша:</span> <span className="font-bold">{leadData.niche}</span></div>
                <div className="flex justify-between"><span className="opacity-60">Бюджет:</span> <span className="font-bold">{leadData.budget}</span></div>
                <div className="flex justify-between"><span className="opacity-60">Телефон:</span> <span className="font-bold">{leadData.phone}</span></div>
              </div>
              <button 
                onClick={() => window.location.reload()}
                className="mt-8 w-full py-4 bg-white text-indigo-700 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-all active:scale-95 shadow-xl"
              >
                Начать новую консультацию
              </button>
            </div>
          )}
        </main>

        <footer className="bg-white dark:bg-gray-900 px-8 py-8 border-t border-gray-100 dark:border-gray-800 z-30 transition-colors duration-300">
          {!isSubmitted && (
            <div className="space-y-5">
              {!isTyping && !hasError && messages.length > 0 && messages[messages.length - 1].role === 'bot' && messages[messages.length - 1].options && (
                <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {messages[messages.length - 1].options?.map((option, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleSend(option)} 
                      className="chip dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {hasError && (
                <div className="text-center pb-2">
                   <button 
                    onClick={() => handleSend(messages[messages.length - 1]?.role === 'user' ? messages[messages.length - 1].content : undefined)} 
                    className="text-xs font-bold text-red-500 underline decoration-dotted"
                   >
                     Ошибка связи. Попробовать еще раз?
                   </button>
                </div>
              )}

              <div className="relative group flex items-center">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  disabled={isTyping}
                  placeholder={
                    currentStep === ChatStep.CONTACT_COLLECTION 
                      ? "Ваш номер телефона..." 
                      : currentStep === ChatStep.NAME_COLLECTION
                        ? "Ваше имя..."
                        : "Введите ваше сообщение..."
                  }
                  className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-[1.25rem] px-6 py-4.5 pr-16 text-[15px] font-medium focus:ring-4 focus:ring-indigo-600/5 dark:focus:ring-indigo-500/10 focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-600 dark:focus:border-indigo-500 transition-all outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 text-gray-900 dark:text-white shadow-inner dark:shadow-none"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2 px-4 py-3 bg-indigo-600 text-white rounded-[1rem] hover:bg-indigo-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 transition-all shadow-lg shadow-indigo-100 dark:shadow-none flex items-center justify-center active:scale-90"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};

export default App;
