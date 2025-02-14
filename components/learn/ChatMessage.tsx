'use client';

import { ChatMessageProps } from '@/types/learn';

export default function ChatMessage({ isLearner = false, avatar, messages }: ChatMessageProps) {
  const avatarStyle = {
    lineHeight: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  };

  const chatClass = isLearner ? 'chat-end' : 'chat-start';
  const bubbleClass = isLearner ? 'chat-bubble-ios-blue' : 'chat-bubble-ios-gray';
  const bgColor = isLearner ? '[#007AFF]' : '[#34C759]';

  return (
    <div className={`chat ${chatClass}`}>
      <div className="chat-image avatar">
        <div className={`w-10 h-10 rounded-full bg-${bgColor}/10`}>
          <div style={avatarStyle}>
            <span className="text-xl">{avatar}</span>
          </div>
        </div>
      </div>
      <div className={`chat-bubble ${bubbleClass}`}>
        {messages.map((message, index) => (
          <div key={index}>
            {message.text}
            {message.links && (
              <ul className="mt-2 space-y-2">
                {message.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      {link.title}
                    </a>
                    {link.description && (
                      <span> - {link.description}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 