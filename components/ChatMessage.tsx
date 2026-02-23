
import React from 'react';
import { Message } from '../types';
import { CHAT_CONFIG } from '../config';

interface ChatMessageProps {
  message: Message;
  botAvatar?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, botAvatar }) => {
  const isBot = message.role === 'bot';
  const avatarUrl = botAvatar || CHAT_CONFIG.botAvatarUrl;

  return (
    <div className={`flex w-full mb-6 message-animate ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        {isBot && (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 mr-3 shadow-lg shadow-blue-200 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={CHAT_CONFIG.botName} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>
        )}
        <div 
          className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed relative
            ${isBot 
              ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 shadow-sm rounded-tl-none' 
              : 'bg-gray-900 dark:bg-indigo-600 text-white shadow-md rounded-tr-none font-medium'
            }`}
        >
          {message.content.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
          ))}
          <div className={`text-[10px] mt-1.5 opacity-40 font-medium ${isBot ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-indigo-200'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
