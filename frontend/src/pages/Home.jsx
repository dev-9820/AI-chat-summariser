import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageSquare, Search, Download, Moon, Sun, Mic, 
  TrendingUp, Share2, Plus, X, Clock, 
  Sparkles, FileText, Archive, User, Bot, Menu,
  Bookmark, Calendar, BarChart3, Zap, ChevronRight
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000/api/chat';

const AIChatbot = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [queryResult, setQueryResult] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [bookmarkedMessages, setBookmarkedMessages] = useState(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [analysisDepth, setAnalysisDepth] = useState('basic');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [keywords, setKeywords] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/`);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      showNotification('Failed to load conversations', 'error');
    }
  };

  const fetchConversationDetails = async (conversationId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/`);
      const data = await response.json();
      if (data.success) {
        setSelectedConversation(data.conversation);
      }
    } catch (error) {
      console.error('Error fetching conversation details:', error);
    }
  };

  const startNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setActiveTab('chat');
    showNotification('Started new conversation!');
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    // Add user message immediately
    const userMsgObj = { 
      sender: 'user', 
      content: userMessage, 
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMsgObj]);

    // Add placeholder AI message with empty content
    const aiMsgPlaceholder = {
      sender: 'ai',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    setMessages(prev => [...prev, aiMsgPlaceholder]);

    try {
      const response = await fetch(`${API_BASE_URL}/send-message-stream/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: currentConversation?.id
        })
      });

      if (!response.ok) {
        throw new Error('Stream request failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessageContent = '';
      let conversationId = null;
      let aiMessageId = null;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'start') {
                conversationId = data.conversation_id;
                aiMessageId = data.ai_message_id;
                
                if (!currentConversation) {
                  setCurrentConversation({ id: conversationId });
                }
              } else if (data.type === 'chunk') {
                // Append chunk to AI message content
                aiMessageContent += data.content;
                
                // Update the last message (AI message) with new content
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage.sender === 'ai') {
                    lastMessage.content = aiMessageContent;
                    lastMessage.isStreaming = true;
                  }
                  return newMessages;
                });
              } else if (data.type === 'done') {
                // Mark streaming as complete
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage.sender === 'ai') {
                    lastMessage.content = data.full_content;
                    lastMessage.timestamp = new Date(data.timestamp);
                    lastMessage.isStreaming = false;
                  }
                  return newMessages;
                });
                showNotification('Message sent!');
              } else if (data.type === 'error') {
                showNotification('AI response error', 'error');
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  if (lastMessage.sender === 'ai') {
                    lastMessage.content = data.error;
                    lastMessage.isStreaming = false;
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('Failed to send message', 'error');
      
      // Remove the AI placeholder message on error
      setMessages(prev => prev.filter(m => !m.isStreaming));
    } finally {
      setLoading(false);
    }
  };

  const endConversation = async () => {
    if (!currentConversation) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/end-conversation/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: currentConversation.id })
      });

      const data = await response.json();
      
      if (data.success) {
        showNotification('Conversation ended & summarized!');
        setCurrentConversation(null);
        setMessages([]);
        fetchConversations();
        setActiveTab('history');
      }
    } catch (error) {
      console.error('Error ending conversation:', error);
      showNotification('Failed to end conversation', 'error');
    } finally {
      setLoading(false);
    }
  };

  const queryConversations = async () => {
    if (!queryInput.trim() || queryLoading) return;

    setQueryLoading(true);
    try {
      const keywordList = keywords ? keywords.split(',').map(k => k.trim()).filter(k => k) : [];
      
      const payload = {
        query: queryInput,
        analysis_depth: analysisDepth,
        ...(dateRange.start && { date_range_start: new Date(dateRange.start).toISOString() }),
        ...(dateRange.end && { date_range_end: new Date(dateRange.end).toISOString() }),
        ...(keywordList.length > 0 && { keywords: keywordList })
      };

      const response = await fetch(`${API_BASE_URL}/query-conversations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (data.success) {
        setQueryResult(data.result);
        showNotification('Query completed!');
      }
    } catch (error) {
      console.error('Error querying conversations:', error);
      showNotification('Failed to query conversations', 'error');
    } finally {
      setQueryLoading(false);
    }
  };

  const exportConversation = (conversation, format) => {
    if (!conversation) return;

    let content = '';
    const filename = `conversation_${conversation.id}_${Date.now()}`;

    if (format === 'json') {
      content = JSON.stringify(conversation, null, 2);
      downloadFile(content, `${filename}.json`, 'application/json');
    } else if (format === 'markdown') {
      content = `# ${conversation.title || 'Conversation'}\n\n`;
      content += `**Date:** ${new Date(conversation.start_timestamp).toLocaleString()}\n\n`;
      if (conversation.summary) {
        content += `## Summary\n${conversation.summary}\n\n`;
      }
      content += `## Messages\n\n`;
      conversation.messages?.forEach(msg => {
        content += `**${msg.sender.toUpperCase()}** (${new Date(msg.timestamp).toLocaleTimeString()}):\n${msg.content}\n\n`;
      });
      downloadFile(content, `${filename}.md`, 'text/markdown');
    }
    
    showNotification(`Exported as ${format.toUpperCase()}!`);
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareConversation = () => {
    if (!selectedConversation) return;
    const shareUrl = `${window.location.origin}/conversation/${selectedConversation.id}`;
    navigator.clipboard.writeText(shareUrl);
    showNotification('Share link copied to clipboard!');
  };

  const toggleVoiceInput = () => {
    if (!isRecording) {
      if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => setIsRecording(false);
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
        };
        
        recognition.start();
      } else {
        showNotification('Voice input not supported', 'error');
      }
    }
  };

  const calculateAnalytics = () => {
    const total = conversations.length;
    const active = conversations.filter(c => c.status === 'active').length;
    const ended = conversations.filter(c => c.status === 'ended').length;
    const totalMessages = conversations.reduce((sum, c) => sum + (c.message_count || 0), 0);
    const avgMessages = total > 0 ? (totalMessages / total).toFixed(1) : 0;

    return { total, active, ended, totalMessages, avgMessages };
  };

  const analytics = calculateAnalytics();

  const formatQueryAnswer = (answerText) => {
    if (!answerText) return null;

    const parts = answerText.split(/(\d+\.\s+\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      const numberedMatch = part.match(/^(\d+)\.\s+\*\*(.*?)\*\*\s*-\s*(.*)$/);
      if (numberedMatch) {
        const [, number, title, content] = numberedMatch;
        return (
          <div key={index} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-sky-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-sm font-bold text-white">{number}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-2">{title}</h4>
                <p className="text-white/70 text-sm leading-relaxed">{content}</p>
              </div>
            </div>
          </div>
        );
      }

      const boldProcessed = part.split(/(\*\*.*?\*\*)/g).map((segment, segIndex) => {
        if (segment.startsWith('**') && segment.endsWith('**')) {
          const boldText = segment.slice(2, -2);
          return (
            <span key={segIndex} className="font-semibold text-violet-300">
              {boldText}
            </span>
          );
        }
        return segment;
      });

      if (part.trim() && !part.match(/^\d+\./)) {
        return (
          <p key={index} className="text-white/80 leading-relaxed">
            {boldProcessed}
          </p>
        );
      }

      return null;
    }).filter(Boolean);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50'} transition-all duration-500 flex overflow-hidden`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-1/2 -right-1/2 w-full h-full rounded-full ${darkMode ? 'bg-sky-500/10' : 'bg-blue-200/30'} blur-3xl animate-pulse`}></div>
        <div className={`absolute -bottom-1/2 -left-1/2 w-full h-full rounded-full ${darkMode ? 'bg-blue-500/10' : 'bg-sky-200/30'} blur-3xl animate-pulse`} style={{animationDelay: '1s'}}></div>
      </div>

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-20'} transition-all duration-500 flex flex-col h-screen sticky top-0 z-40 relative`}>
        <div className="absolute inset-0 backdrop-blur-2xl bg-white/5 border-r border-white/10"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo & New Chat */}
          <div className="p-5">
            <button
              onClick={startNewConversation}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-violet-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 text-white rounded-2xl transition-all duration-300 shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              <div className="relative flex items-center justify-center gap-3 px-5 py-3.5">
                {sidebarOpen ? (
                  <>
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">New Chat</span>
                  </>
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </div>
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 px-3 space-y-2 overflow-y-auto">
            {[
              { id: 'chat', label: 'Chat', icon: MessageSquare, gradient: 'from-blue-500 to-cyan-500' },
              { id: 'history', label: 'History', icon: Archive, gradient: 'from-violet-500 to-sky-500' },
              { id: 'query', label: 'Query', icon: Search, gradient: 'from-pink-500 to-rose-500' },
              { id: 'analytics', label: 'Analytics', icon: BarChart3, gradient: 'from-amber-500 to-orange-500' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-white/10 shadow-lg shadow-sky-500/20'
                    : 'hover:bg-white/5'
                }`}
              >
                {activeTab === tab.id && (
                  <div className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} opacity-20`}></div>
                )}
                <div className="relative flex items-center gap-3 px-4 py-3.5">
                  <tab.icon className={`w-5 h-5 transition-all duration-300 ${
                    activeTab === tab.id ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                  }`} />
                  {sidebarOpen && (
                    <span className={`font-medium transition-all duration-300 ${
                      activeTab === tab.id ? 'text-white' : 'text-white/50 group-hover:text-white/80'
                    }`}>
                      {tab.label}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* User Section */}
          <div className="p-5 border-t border-white/10">
            <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-3 hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-sky-600 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">User</p>
                    <p className="text-white/50 text-xs truncate">Free Plan</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="relative z-30">
          <div className="absolute inset-0 backdrop-blur-2xl bg-white/5 border-b border-white/10"></div>
          <div className="relative flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2.5 rounded-xl backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300 text-white/70 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                {activeTab === 'chat' && 'Chat'}
                {activeTab === 'history' && 'History'}
                {activeTab === 'query' && 'Query'}
                {activeTab === 'analytics' && 'Analytics'}
              </h1>
            </div>
            
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300 text-amber-400 hover:text-amber-300"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-8 max-w-2xl mx-auto">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-sky-600 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                      <div className="relative w-24 h-24 bg-gradient-to-br from-violet-600 to-sky-600 rounded-3xl flex items-center justify-center shadow-2xl">
                        <Sparkles className="w-12 h-12 text-white" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-violet-200 to-sky-200 bg-clip-text text-transparent">
                        How can I help you today?
                      </h2>
                      <p className="text-lg text-white/60">
                        Start a conversation and I'll assist you with anything you need.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                          msg.sender === 'user' 
                            ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                            : 'bg-gradient-to-br from-violet-500 to-sky-600'
                        }`}>
                          {msg.sender === 'user' ? (
                            <User className="w-5 h-5 text-white" />
                          ) : (
                            <Bot className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className={`flex-1 max-w-[75%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                          <div className={`inline-block backdrop-blur-2xl rounded-3xl shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                            msg.sender === 'user'
                              ? 'bg-gradient-to-br from-blue-500/90 to-cyan-500/90 text-white rounded-br-md border border-blue-400/20'
                              : 'bg-white/10 text-white rounded-bl-md border border-white/10'
                          }`}>
                            <p className="px-6 py-4 text-sm leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                              {msg.isStreaming && (
                                <span className="inline-block w-1.5 h-4 bg-white/80 ml-1 animate-pulse"></span>
                              )}
                            </p>
                          </div>
                          {msg.timestamp && !msg.isStreaming && (
                            <p className="text-xs mt-2 text-white/40">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="relative z-20 p-6">
                <div className="absolute inset-0 backdrop-blur-2xl bg-white/5 border-t border-white/10"></div>
                <div className="relative max-w-4xl mx-auto space-y-4">
                  {currentConversation && (
                    <button
                      onClick={endConversation}
                      disabled={loading}
                      className="w-full backdrop-blur-xl bg-gradient-to-r from-rose-500/80 to-pink-500/80 hover:from-rose-500 hover:to-pink-500 text-white rounded-2xl px-5 py-3 transition-all duration-300 disabled:opacity-50 text-sm font-medium shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 hover:scale-[1.02] border border-rose-400/20"
                    >
                      End Conversation & Generate Summary
                    </button>
                  )}
                  <div className="flex gap-3">
                    <div className="flex-1 relative group">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Message AI Assistant..."
                        disabled={loading}
                        className="w-full px-6 py-4 pr-14 rounded-2xl backdrop-blur-2xl bg-white/10 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-violet-500/50 focus:bg-white/15 transition-all duration-300 shadow-xl"
                      />
                      <button
                        onClick={toggleVoiceInput}
                        className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-xl transition-all duration-300 ${
                          isRecording
                            ? 'text-rose-400 bg-rose-500/20 animate-pulse'
                            : 'text-white/40 hover:text-white/70 hover:bg-white/10'
                        }`}
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={loading || !inputMessage.trim()}
                      className="px-8 py-4 bg-gradient-to-r from-violet-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 text-white rounded-2xl transition-all duration-300 disabled:opacity-50 shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-105 flex items-center gap-2 disabled:hover:scale-100 border border-violet-400/20"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-white">Conversation History</h2>
                  <button
                    onClick={fetchConversations}
                    className="px-6 py-3 backdrop-blur-xl bg-white/10 hover:bg-white/15 text-white rounded-2xl transition-all duration-300 border border-white/10 shadow-lg hover:scale-105"
                  >
                    Refresh
                  </button>
                </div>

                {conversations.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-violet-500/20 rounded-full blur-2xl"></div>
                      <Archive className="relative w-20 h-20 text-white/30" />
                    </div>
                    <p className="text-white/60 text-xl mb-2">No conversations yet</p>
                    <p className="text-white/40">Start a new chat to see your history here</p>
                  </div>
                ) : (
                  <div className="grid gap-5">
                    {conversations.map(conv => (
                      <div
                        key={conv.id}
                        className="group backdrop-blur-xl bg-white/5 hover:bg-white/10 rounded-3xl border border-white/10 hover:border-white/20 p-6 transition-all duration-300 cursor-pointer hover:scale-[1.02] shadow-lg hover:shadow-xl"
                        onClick={() => {
                          fetchConversationDetails(conv.id);
                          setSelectedConversation(conv);
                        }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-lg mb-3">
                              {conv.title || `Conversation #${conv.id}`}
                            </h3>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-xl ${
                                conv.status === 'active'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-white/10 text-white/60 border border-white/10'
                              }`}>
                                {conv.status}
                              </span>
                              <span className="text-white/50 text-sm flex items-center gap-1.5">
                                <MessageSquare className="w-4 h-4" />
                                {conv.message_count || 0} messages
                              </span>
                              <span className="text-white/50 text-sm flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {new Date(conv.start_timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Query Tab */}
          {activeTab === 'query' && (
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto">
                                  <div className="text-center mb-10">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-sky-500 rounded-full blur-2xl opacity-50"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-violet-600 to-sky-600 rounded-2xl flex items-center justify-center shadow-xl">
                      <Search className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-violet-200 to-sky-200 bg-clip-text text-transparent mb-3">
                    Query Your Conversations
                  </h2>
                  <p className="text-white/60 text-lg">
                    Ask questions about your past conversations and get intelligent answers
                  </p>
                </div>

                <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 mb-6 shadow-xl">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-3">
                        Your Question
                      </label>
                      <textarea
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        placeholder="What did I discuss about travel last month?..."
                        rows="4"
                        className="w-full px-6 py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-violet-500/50 focus:bg-white/15 transition-all duration-300 resize-none shadow-inner"
                      />
                    </div>

                    <button
                      onClick={queryConversations}
                      disabled={queryLoading || !queryInput.trim()}
                      className="w-full px-8 py-5 bg-gradient-to-r from-violet-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 text-white rounded-2xl transition-all duration-300 disabled:opacity-50 font-medium shadow-xl shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.02] disabled:hover:scale-100 border border-violet-400/20"
                    >
                      {queryLoading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Analyzing Conversations...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <Search className="w-5 h-5" />
                          Search Conversations
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {queryResult && (
                  <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-xl">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-xl opacity-50"></div>
                        <div className="relative w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">AI Analysis Results</h3>
                        <p className="text-sm text-white/50">
                          Found insights from {queryResult.conversations_analyzed} conversations
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5 mb-8">
                      {formatQueryAnswer(queryResult.answer)}
                    </div>

                    {queryResult.relevant_conversations?.length > 0 && (
                      <div className="pt-8 border-t border-white/10">
                        <h4 className="font-semibold text-white mb-5 flex items-center gap-2 text-lg">
                          <MessageSquare className="w-5 h-5" />
                          Relevant Conversations
                        </h4>
                        <div className="grid gap-4">
                          {queryResult.relevant_conversations.map(conv => (
                            <div
                              key={conv.id}
                              onClick={() => fetchConversationDetails(conv.id)}
                              className="p-5 rounded-2xl backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-white mb-1">
                                    {conv.title}
                                  </h5>
                                  <p className="text-sm text-white/50">
                                    {conv.date}
                                  </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-white/30" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="h-full overflow-y-auto p-8">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold text-white mb-8">Analytics Dashboard</h2>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative backdrop-blur-xl bg-gradient-to-br from-blue-500/80 to-cyan-500/80 rounded-3xl p-6 border border-blue-400/20 shadow-xl hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <MessageSquare className="w-10 h-10 text-white/90" />
                        <span className="text-4xl font-bold text-white">{analytics.total}</span>
                      </div>
                      <p className="text-blue-100 text-sm font-medium">Total Conversations</p>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative backdrop-blur-xl bg-gradient-to-br from-emerald-500/80 to-teal-500/80 rounded-3xl p-6 border border-emerald-400/20 shadow-xl hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <Zap className="w-10 h-10 text-white/90" />
                        <span className="text-4xl font-bold text-white">{analytics.active}</span>
                      </div>
                      <p className="text-emerald-100 text-sm font-medium">Active Chats</p>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-sky-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative backdrop-blur-xl bg-gradient-to-br from-violet-500/80 to-sky-500/80 rounded-3xl p-6 border border-violet-400/20 shadow-xl hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <FileText className="w-10 h-10 text-white/90" />
                        <span className="text-4xl font-bold text-white">{analytics.ended}</span>
                      </div>
                      <p className="text-violet-100 text-sm font-medium">Completed</p>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                    <div className="relative backdrop-blur-xl bg-gradient-to-br from-amber-500/80 to-orange-500/80 rounded-3xl p-6 border border-amber-400/20 shadow-xl hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <TrendingUp className="w-10 h-10 text-white/90" />
                        <span className="text-4xl font-bold text-white">{analytics.avgMessages}</span>
                      </div>
                      <p className="text-amber-100 text-sm font-medium">Avg Messages</p>
                    </div>
                  </div>
                </div>

                {/* Additional Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-xl">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Conversation Status
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white/80">Active Conversations</span>
                          <span className="text-lg font-bold text-white">{analytics.active}</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-xl">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 shadow-lg"
                            style={{ width: `${analytics.total > 0 ? (analytics.active / analytics.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-white/80">Completed Conversations</span>
                          <span className="text-lg font-bold text-white">{analytics.ended}</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-xl">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-1000 shadow-lg"
                            style={{ width: `${analytics.total > 0 ? (analytics.ended / analytics.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-xl">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Quick Insights
                    </h3>
                    <div className="space-y-4">
                      <div className="backdrop-blur-xl bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition-all duration-300 border border-white/10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <MessageSquare className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-white/50">Total Messages</p>
                            <p className="text-lg font-bold text-white">{analytics.totalMessages}</p>
                          </div>
                        </div>
                      </div>
                      <div className="backdrop-blur-xl bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition-all duration-300 border border-white/10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-white/50">Average per Chat</p>
                            <p className="text-lg font-bold text-white">{analytics.avgMessages} messages</p>
                          </div>
                        </div>
                      </div>
                      <div className="backdrop-blur-xl bg-white/5 hover:bg-white/10 rounded-2xl p-4 transition-all duration-300 border border-white/10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Bookmark className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-white/50">Bookmarked</p>
                            <p className="text-lg font-bold text-white">{bookmarkedMessages.size} messages</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 backdrop-blur-xl rounded-2xl shadow-2xl animate-fade-in border ${
          notification.type === 'success' 
            ? 'bg-emerald-500/90 border-emerald-400/20 text-white' 
            : 'bg-rose-500/90 border-rose-400/20 text-white'
        }`}>
          <div className="px-6 py-4 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              notification.type === 'success' ? 'bg-white' : 'bg-white'
            } animate-pulse`}></div>
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Conversation Details Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-sky-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedConversation.title || `Conversation #${selectedConversation.id}`}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-white/50 mt-1">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {new Date(selectedConversation.start_timestamp).toLocaleDateString()}
                    </span>
                    <span>{selectedConversation.messages?.length || 0} messages</span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-xl ${
                      selectedConversation.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/10 text-white/60 border border-white/10'
                    }`}>
                      {selectedConversation.status}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-2.5 rounded-xl backdrop-blur-xl bg-white/5 hover:bg-white/10 transition-all duration-300 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Panel - Messages */}
              <div className="flex-1 border-r border-white/10 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Conversation
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {selectedConversation.messages?.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-white/20 mx-auto mb-4" />
                        <p className="text-white/40">No messages in this conversation</p>
                      </div>
                    ) : (
                      selectedConversation.messages?.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                            msg.sender === 'user' 
                              ? 'bg-gradient-to-br from-blue-500 to-cyan-500' 
                              : 'bg-gradient-to-br from-violet-500 to-sky-600'
                          }`}>
                            {msg.sender === 'user' ? (
                              <User className="w-5 h-5 text-white" />
                            ) : (
                              <Bot className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <div className={`flex-1 max-w-[80%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                            <div className={`inline-block backdrop-blur-2xl rounded-3xl shadow-lg ${
                              msg.sender === 'user'
                                ? 'bg-gradient-to-br from-blue-500/80 to-cyan-500/80 text-white rounded-br-md border border-blue-400/20'
                                : 'bg-white/10 text-white rounded-bl-md border border-white/10'
                            }`}>
                              <p className="px-6 py-4 text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              <p className={`px-6 pb-3 text-xs ${
                                msg.sender === 'user' ? 'text-blue-100' : 'text-white/40'
                              }`}>
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel - Summary */}
              <div className="w-96 flex-shrink-0 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/10">
                  <h4 className="font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Summary & Insights
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {selectedConversation.summary && (
                      <div className="backdrop-blur-xl bg-gradient-to-br from-violet-500/20 to-sky-500/20 border border-violet-400/30 rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-4">
                          <Bot className="w-5 h-5 text-violet-300" />
                          <h5 className="font-semibold text-white">AI Summary</h5>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed">
                          {selectedConversation.summary}
                        </p>
                      </div>
                    )}

                    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-5 border border-white/10">
                      <h5 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Stats
                      </h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white/60">Total Messages</span>
                          <span className="font-semibold text-white">
                            {selectedConversation.messages?.length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white/60">Started</span>
                          <span className="font-semibold text-white text-xs">
                            {new Date(selectedConversation.start_timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="backdrop-blur-xl bg-white/5 rounded-2xl p-5 border border-white/10">
                      <h5 className="font-semibold text-white mb-4">Quick Actions</h5>
                      <div className="space-y-2">
                        <button
                          onClick={shareConversation}
                          className="w-full flex items-center gap-3 px-4 py-3 backdrop-blur-xl bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-300 border border-white/10"
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                        <button
                          onClick={() => exportConversation(selectedConversation, 'json')}
                          className="w-full flex items-center gap-3 px-4 py-3 backdrop-blur-xl bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-300 border border-white/10"
                        >
                          <Download className="w-4 h-4" />
                          Export JSON
                        </button>
                        <button
                          onClick={() => exportConversation(selectedConversation, 'markdown')}
                          className="w-full flex items-center gap-3 px-4 py-3 backdrop-blur-xl bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-300 border border-white/10"
                        >
                          <FileText className="w-4 h-4" />
                          Export MD
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AIChatbot;