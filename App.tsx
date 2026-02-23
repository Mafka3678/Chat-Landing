
import React, { useState, useEffect, useRef } from 'react';
import { ChatStep, Message, LeadData } from './types';
import { getBotResponse } from './services/geminiService';
import ChatMessage from './components/ChatMessage';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<ChatStep>(ChatStep.WELCOME);
  const [leadData, setLeadData] = useState<LeadData>({});
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      setIsTyping(true);
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

    let nextStep = currentStep;
    const updatedLeadData = { ...leadData };

    // Логика переключения шагов
    switch (currentStep) {
      case ChatStep.WELCOME: nextStep = ChatStep.BENEFITS; break;
      case ChatStep.BENEFITS: nextStep = ChatStep.QUALIFICATION_NICHE; break;
      case ChatStep.QUALIFICATION_NICHE: 
        updatedLeadData.niche = messageText;
        nextStep = ChatStep.QUALIFICATION_BUDGET; 
        break;
      case ChatStep.QUALIFICATION_BUDGET:
        updatedLeadData.budget = messageText;
        nextStep = ChatStep.QUALIFICATION_PLANS;
        break;
      case ChatStep.QUALIFICATION_PLANS:
        updatedLeadData.plans = messageText;
        nextStep = ChatStep.CONTACT_COLLECTION;
        break;
      case ChatStep.CONTACT_COLLECTION:
        updatedLeadData.phone = messageText;
        nextStep = ChatStep.COMPLETED;
        break;
    }

    try {
      const botResponse = await getBotResponse(nextStep, messageText, updatedLeadData);
      
      setLeadData(updatedLeadData);
      setCurrentStep(nextStep);
      
      addMessage('bot', botResponse.text, botResponse.options);
      setIsTyping(false);
      
      if (nextStep === ChatStep.COMPLETED) {
        setIsSubmitted(true);
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
    [ChatStep.QUALIFICATION_BUDGET]: 65,
    [ChatStep.QUALIFICATION_PLANS]: 85,
    [ChatStep.CONTACT_COLLECTION]: 95,
    [ChatStep.COMPLETED]: 100,
  }[currentStep];

  return (
    <div className="chat-wrapper">
      <div className="main-card relative">
        <header className="px-8 py-6 flex items-center justify-between border-b border-gray-100 bg-white/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-xl shadow-indigo-200 float-anim">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="font-extrabold text-gray-900 text-lg leading-tight tracking-tight">Smart LeadGen</h1>
              <div className="flex items-center text-[10px] font-bold text-green-500 uppercase tracking-widest mt-0.5">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Online (AI)
              </div>
            </div>
          </div>
          <div className="flex -space-x-2">
            {[45,46,47].map(i => (
               <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-gray-200 overflow-hidden shadow-sm`}>
                  <img src={`https://i.pravatar.cc/100?img=${i}`} alt="team" className="w-full h-full object-cover" />
               </div>
            ))}
          </div>
        </header>

        <div className="absolute top-[88px] left-0 w-full h-1 bg-gray-50 z-20">
          <div 
            className="h-full bg-gradient-to-r from-indigo-600 to-violet-500 transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1)"
            style={{ width: `${progress}%` }}
          />
        </div>

        <main 
          ref={scrollRef}
          className="flex-grow overflow-y-auto px-8 py-10 space-y-4 hide-scrollbar bg-[#fdfdfd]"
        >
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
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

        <footer className="bg-white px-8 py-8 border-t border-gray-100 z-30">
          {!isSubmitted && (
            <div className="space-y-5">
              {!isTyping && !hasError && messages.length > 0 && messages[messages.length - 1].role === 'bot' && messages[messages.length - 1].options && (
                <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 hide-scrollbar">
                  {messages[messages.length - 1].options?.map((option, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleSend(option)} 
                      className="chip"
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
                      : "Введите ваше сообщение..."
                  }
                  className="w-full bg-gray-50 border-2 border-transparent rounded-[1.25rem] px-6 py-4.5 pr-16 text-[15px] font-medium focus:ring-4 focus:ring-indigo-600/5 focus:bg-white focus:border-indigo-600 transition-all outline-none placeholder:text-gray-400 disabled:opacity-50 text-gray-900 shadow-inner"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2 px-4 py-3 bg-indigo-600 text-white rounded-[1rem] hover:bg-indigo-700 disabled:bg-gray-200 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center active:scale-90"
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
