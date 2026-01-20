import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import api from '../../utils/axios';
import { FaPaperPlane, FaTrash, FaRobot, FaUser, FaBars, FaXmark, FaPlus, FaLightbulb, FaGavel, FaFileContract, FaScaleUnbalanced } from 'react-icons/fa6';
import { useAuth } from '../../context/AuthContext';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.9); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
`;

// Layout
const ChatPageLayout = styled.div`
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  background: var(--bg-dark);
  position: relative;
  overflow: hidden;
`;

// Sidebar
const Sidebar = styled.div`
  width: ${props => props.$isOpen ? '280px' : '0'};
  background: rgba(32, 33, 35, 0.95);
  border-right: 1px solid rgba(255,255,255,0.05);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  flex-shrink: 0;
  backdrop-filter: blur(10px);
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const CloseSidebarBtn = styled.button`
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  transition: color 0.2s;
  &:hover { color: white; }
`;

const NewChatBtn = styled.button`
  width: 100%;
  background: var(--primary);
  border: none;
  color: white;
  padding: 0.8rem;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(108, 93, 211, 0.3);

  &:hover {
    background: var(--primary-hover);
    transform: translateY(-2px);
  }
`;

const HistoryList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
`;

const HistoryItem = styled.div`
  padding: 1rem;
  border-radius: 10px;
  cursor: pointer;
  color: ${props => props.$active ? 'white' : 'rgba(255,255,255,0.6)'};
  background: ${props => props.$active ? 'rgba(255,255,255,0.08)' : 'transparent'};
  border: 1px solid ${props => props.$active ? 'rgba(255,255,255,0.1)' : 'transparent'};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;

  &:hover {
    background: rgba(255,255,255,0.05);
    color: white;
    .delete-btn { opacity: 1; }
  }
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: #ff4d4d;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.2s;
  padding: 4px;
  &:hover { color: #ff3333; }
`;

// Main Chat Area
const MainChatArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden; 
  height: 100%;
  background: radial-gradient(circle at top right, rgba(108, 93, 211, 0.05), transparent 40%),
              radial-gradient(circle at bottom left, rgba(25, 195, 125, 0.05), transparent 40%);
`;

const ToggleBtn = styled.button`
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 100;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: ${props => props.$isOpen ? 'none' : 'flex'};
  align-items: center;
  justify-content: center;
  
  &:hover { background: rgba(255,255,255,0.1); }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 2rem;
  padding-bottom: 140px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
`;

const WelcomeScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  animation: ${fadeIn} 0.5s ease-out;

  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #fff 0%, #a0e6ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  p { color: var(--text-secondary); margin-bottom: 3rem; }
`;

const SuggestionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  max-width: 800px;
  width: 100%;
`;

const SuggestionCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1.5rem;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: var(--primary);
    transform: translateY(-3px);
  }

  h4 { color: white; margin: 0; font-size: 1rem; }
  span { color: var(--text-secondary); font-size: 0.85rem; }
  svg { color: var(--primary); font-size: 1.2rem; margin-bottom: 0.5rem; }
`;

const MessageBubble = styled.div`
  display: flex;
  gap: 1rem;
  align-self: ${props => props.$isBot ? 'flex-start' : 'flex-end'};
  max-width: 85%;
  flex-direction: ${props => props.$isBot ? 'row' : 'row-reverse'};
  animation: ${fadeIn} 0.3s ease-out;
`;

const Avatar = styled.div`
  width: 35px;
  height: 35px;
  border-radius: 8px;
  background: ${props => props.$isBot ? 'linear-gradient(135deg, #19c37d, #0d8a59)' : 'linear-gradient(135deg, #6c5dd3, #4a40a2)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
`;

const Content = styled.div`
  background: ${props => props.$isBot ? 'rgba(255,255,255,0.03)' : 'var(--primary)'};
  border: 1px solid ${props => props.$isBot ? 'rgba(255,255,255,0.05)' : 'transparent'};
  padding: 1rem 1.5rem;
  border-radius: ${props => props.$isBot ? '0 16px 16px 16px' : '16px 0 16px 16px'};
  color: ${props => props.$isBot ? 'var(--text-main)' : 'white'};
  line-height: 1.6;
  font-size: 1rem;
  white-space: pre-wrap;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  position: relative;
`;

const InputArea = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 2rem;
  background: linear-gradient(to top, var(--bg-dark) 50%, transparent);
  display: flex;
  justify-content: center;
`;

const InputWrapper = styled.div`
  width: 100%;
  max-width: 800px;
  background: rgba(40, 42, 55, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 0.8rem;
  display: flex;
  align-items: flex-end; 
  gap: 0.8rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  transition: all 0.3s;

  &:focus-within {
    border-color: var(--primary);
    box-shadow: 0 10px 40px rgba(108, 93, 211, 0.2);
  }
`;

const TextArea = styled.textarea`
  flex: 1;
  background: transparent;
  border: none;
  color: white;
  font-size: 1rem;
  font-family: inherit;
  resize: none;
  max-height: 150px;
  padding: 0.5rem;
  line-height: 1.5;

  &:focus { outline: none; }
  &::placeholder { color: rgba(255,255,255,0.3); }
`;

const SendButton = styled.button`
  background: var(--primary);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: var(--primary-hover);
    transform: scale(1.05);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: default;
    background: rgba(255,255,255,0.1);
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 4px 8px;
  
  span {
    width: 6px;
    height: 6px;
    background: rgba(255,255,255,0.4);
    border-radius: 50%;
    animation: ${pulse} 1.4s infinite ease-in-out both;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
  }
`;

const ChatPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [deleteId, setDeleteId] = useState(null);

  const resizeInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    resizeInput();
  }, [input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/api/chat/sessions');
        console.log("Sessions API Response:", res.data); // DEBUG
        if (res.data && Array.isArray(res.data.data)) {
          setSessions(res.data.data);
        } else {
          console.error("Invalid sessions data format:", res.data);
          setSessions([]);
        }
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setSessions([]);
      }
    };
    fetchSessions();
  }, []);

  const loadSession = async (id) => {
    try {
      setLoading(true);
      setCurrentSessionId(id);
      const res = await api.get(`/api/chat/session/${id}`);
      console.log("Load Session Response:", res.data); // DEBUG
      if (res.data && res.data.data && Array.isArray(res.data.data.messages)) {
        setMessages(res.data.data.messages);
      } else {
        console.warn("Invalid session detail format:", res.data);
        setMessages([]);
      }
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    } catch (err) {
      console.error("Error loading session:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInput('');
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSend = async (val = input) => {
    if (!val.trim()) return;
    const userMsg = val;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // FIX: Endpoint is /api/chat/send, not /message
      const res = await api.post('/api/chat/send', {
        message: userMsg,
        sessionId: currentSessionId
      });

      console.log("Send Message Response:", res.data); // DEBUG

      const responseData = res.data.data; // Access nested data object

      if (responseData && responseData.sessionId && !currentSessionId) {
        setCurrentSessionId(responseData.sessionId);
        setSessions(prev => [{ _id: responseData.sessionId, title: userMsg.substring(0, 30) + '...' }, ...prev]);
      }

      if (responseData && responseData.response) {
        setMessages(prev => [...prev, { role: 'bot', content: responseData.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'bot', content: "Received empty response from server." }]);
      }
    } catch (err) {
      console.error('Chat Error:', err);
      setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = (e, id) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  // Modal Component Inside Render (Simple for now to avoid scope issues)
  const DeleteModal = () => (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#282a37',
        padding: '2rem',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)'
      }}>
        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Delete Conversation?</h3>
        <p style={{ color: '#ccc', marginBottom: '1.5rem', lineHeight: '1.5' }}>
          This action cannot be undone. Are you sure you want to delete this chat permanently?
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={() => setDeleteId(null)}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'white',
              cursor: 'pointer'
            }}>
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: '#ff4d4d',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/api/chat/session/${deleteId}`);
      setSessions(prev => prev.filter(s => s._id !== deleteId));
      if (currentSessionId === deleteId) handleNewChat();
    } catch (err) { console.error(err); }
    setDeleteId(null);
  };

  const suggestions = [
    { icon: <FaGavel />, title: "Explain Case Law", text: "Summarize the Kesavananda Bharati case." },
    { icon: <FaFileContract />, title: "Draft Agreement", text: "Draft a simple freelance consulting agreement." },
    { icon: <FaScaleUnbalanced />, title: "Legal Advice", text: "What are the rights of a tenant in India?" },
    { icon: <FaLightbulb />, title: "IPC Section", text: "Explain Section 420 of IPC with examples." }
  ];

  return (
    <ChatPageLayout>
      {deleteId && <DeleteModal />}

      <Sidebar $isOpen={isSidebarOpen}>
        <SidebarHeader>
          <NewChatBtn onClick={handleNewChat}>
            <FaPlus /> New Chat
          </NewChatBtn>
          <CloseSidebarBtn onClick={() => setIsSidebarOpen(false)}>
            <FaXmark size={18} />
          </CloseSidebarBtn>
        </SidebarHeader>
        <HistoryList>
          {sessions.map(s => (
            <HistoryItem key={s._id} $active={currentSessionId === s._id} onClick={() => loadSession(s._id)}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
              <DeleteBtn className="delete-btn" onClick={(e) => deleteSession(e, s._id)}><FaTrash size={12} /></DeleteBtn>
            </HistoryItem>
          ))}
        </HistoryList>
      </Sidebar>

      <MainChatArea>
        {!isSidebarOpen && (
          <ToggleBtn $isOpen={false} onClick={() => setIsSidebarOpen(true)}>
            <FaBars />
          </ToggleBtn>
        )}

        <MessagesContainer>
          {messages.length === 0 && !loading && (
            <WelcomeScreen>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                <FaRobot />
              </div>
              <h1>Hello, {user?.name || 'Counselor'}</h1>
              <p>How can Lawyer.AI assist you today?</p>
              <SuggestionsGrid>
                {suggestions.map((s, i) => (
                  <SuggestionCard key={i} onClick={() => handleSend(s.text)}>
                    {s.icon}
                    <h4>{s.title}</h4>
                    <span>{s.text}</span>
                  </SuggestionCard>
                ))}
              </SuggestionsGrid>
            </WelcomeScreen>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} $isBot={msg.role === 'bot'}>
              <Avatar $isBot={msg.role === 'bot'}>
                {msg.role === 'bot' ? <FaRobot size={18} /> : (user?.name?.[0] || <FaUser size={14} />)}
              </Avatar>
              <Content $isBot={msg.role === 'bot'}>
                {msg.content}
              </Content>
            </MessageBubble>
          ))}

          {loading && (
            <MessageBubble $isBot={true}>
              <Avatar $isBot={true}><FaRobot size={18} /></Avatar>
              <Content $isBot={true}>
                <TypingIndicator><span></span><span></span><span></span></TypingIndicator>
              </Content>
            </MessageBubble>
          )}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        <InputArea>
          <InputWrapper>
            <TextArea
              ref={inputRef}
              rows={1}
              placeholder="Ask a legal question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
            <SendButton onClick={() => handleSend()} disabled={!input.trim() || loading}>
              <FaPaperPlane />
            </SendButton>
          </InputWrapper>
        </InputArea>

      </MainChatArea>

    </ChatPageLayout>
  );
};

export default ChatPage;
