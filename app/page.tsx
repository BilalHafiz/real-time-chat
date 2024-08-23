"use client";
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

type Message = {
  id: string;
  content: string;
  created_at: string;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const messageInputRef = useRef<HTMLInputElement>(null);
  const getMessages = async () => {
    const { data: messages } = await supabase.from('messages').select('*');
    if (messages) {
      setMessages(messages);
    }
  };

  useEffect(() => {
    getMessages()

    const setupMessagesSubscription = () => {
      const channel = supabase
        .channel('realtime:messages')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            setMessages((previous) => [...previous, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    getMessages();
    const messagesCleanup = setupMessagesSubscription();

    return () => {
      messagesCleanup();
    };
  }, []);


  const sendMessage = async (evt: React.FormEvent) => {
    evt.preventDefault();
    const content = messageInputRef.current?.value;

    if (content) {
      await supabase.from('messages').insert([{ content }]);
      getMessages()
      setNewMessage('');
      messageInputRef.current.value = '';
    }
  };



  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white p-4 shadow-lg rounded-lg h-96 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id} className="my-2">
            <p className="text-gray-800">{message.content}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex">
        <input
          type="text"
          className="flex-grow p-2 border rounded-lg text-black"
          value={newMessage}
          ref={messageInputRef}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage} className="ml-2 bg-blue-500 text-white p-2 rounded-lg">
          Send
        </button>
      </div>
    </div>
  );
}
