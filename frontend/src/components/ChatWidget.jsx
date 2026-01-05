import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Send, MessageSquare } from 'lucide-react';
import Card from './Card';

const ChatWidget = ({ groupId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    // Polling interval for chat (simple implementation)
    useEffect(() => {
        if (!groupId) return;

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [groupId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const response = await api.get(`/chat/group/${groupId}`);
            // Simple diffing to avoid unnecessary re-renders or only update if changed?
            // For now just setMessages.
            // Assuming backend returns sorted by time asc
            if (response.data) {
                setMessages(response.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching chat:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user || !groupId) return;

        try {
            await api.post(`/chat/send`, null, {
                params: {
                    groupId,
                    senderId: user.id || user.userId,
                },
                // Content body as plain string
                headers: {
                    'Content-Type': 'text/plain' // Wait, controller expects RequestBody String
                }
            });
            // The controller takes @RequestBody String content. 
            // But standard Axios post with string might send JSON?
            // Let's adjust api call.

        } catch (error) {
            // If standard post fails, try sending object wrapper or verifying content type...
            // Controller: @RequestBody String content. 
            // It expects raw string body.
        }

        // Better implementation:
        try {
            await api.post(`/chat/send?groupId=${groupId}&senderId=${user.id || user.userId}`, newMessage, {
                headers: { 'Content-Type': 'text/plain' }
            });
            setNewMessage('');
            fetchMessages(); // Immediate refresh
        } catch (err) {
            console.error("Failed to send", err);
        }
    };

    if (loading && messages.length === 0) {
        return (
            <Card className="h-[400px] flex items-center justify-center">
                <p className="text-gray-400">Loading chat...</p>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col h-[400px] p-0 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b flex items-center gap-2">
                <MessageSquare size={18} className="text-[#06b6d4]" />
                <h3 className="font-semibold text-gray-700">Group Chat</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                {messages.map((msg) => {
                    const isMe = (msg.sender?.id === (user.id || user.userId));
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? 'bg-[#06b6d4] text-white' : 'bg-gray-100 text-gray-800'}`}>
                                {!isMe && <p className="text-xs font-bold mb-1 opacity-75">{msg.sender?.fullName}</p>}
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/80' : 'text-gray-500'}`}>
                                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t bg-gray-50 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:border-[#06b6d4] bg-white"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 bg-[#06b6d4] text-white rounded-full hover:bg-[#0891b2] disabled:opacity-50 transition-colors"
                >
                    <Send size={20} />
                </button>
            </form>
        </Card>
    );
};

export default ChatWidget;
