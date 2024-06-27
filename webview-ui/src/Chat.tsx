import React, { useState } from 'react';
import { PaperClipIcon } from '@heroicons/react/24/outline';

import { VSCodeWrapper } from './api/vscode-api';

const Chat: React.FunctionComponent<{
  vscodeAPI: Pick<VSCodeWrapper, 'postMessage' | 'onMessage'>;
}> = ({ vscodeAPI }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Welcome, I'm your Copilot and I'm here to help you get things done faster.\n\nI'm powered by AI, so surprises and mistakes are possible. Make sure to verify any generated code or suggestions, and share feedback so that we can learn and improve.",
      sender: 'bot'
    },
    {
      id: 2,
      text: 'Labore laboris nostrud et labore ea esse occaecat quis exercitation.',
      sender: 'user'
    }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { id: Date.now(), text: input, sender: 'user' }]);
      setInput('');
      // Here you would also send the message to your AI backend and get the response
    }
  };

  return (
    <div className="flex flex-col h-full vscode-dark text-white px-3 pb-4">
      <div className="flex-1 flex flex-col justify-start overflow-y-auto mb-4">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`py-4 px-2 border-b border-neutral-700 text-left ${
              message.sender === 'user' ? 'bg-neutral-800' : undefined
            }`}>
            <p className="text-sm font-medium text-neutral-300 mb-2">
              {message.sender === 'user' ? 'You' : 'Element AI'}
            </p>
            <p className="whitespace-pre-wrap">{message.text}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask ElementAI or type / for commands"
          className="flex-1 p-2 bg-neutral-800 text-white rounded-md border border-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button className="p-2 text-neutral-400">
          <PaperClipIcon className="w-5 h-5" />
        </button>
        <button
          onClick={handleSend}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none">
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;