import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, MessageSquare, Search, Trash2, Download, Moon, Sun, Mic, 
  BookmarkPlus, TrendingUp, Share2, Plus, X, ChevronDown, Clock, 
  Sparkles, FileText, Archive, User, Bot, Menu, Settings, 
  Bookmark, Filter, Calendar, BarChart3, Zap
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
  const [showShareModal, setShowShareModal] = useState(false);
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

    setMessages(prev => [...prev, { sender: 'user', content: userMessage, timestamp: new Date() }]);

    try {
      const response = await fetch(`${API_BASE_URL}/send-message/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          conversation_id: currentConversation?.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        if (!currentConversation) {
          setCurrentConversation({ id: data.conversation_id });
        }

        setMessages(prev => {
          const filtered = prev.filter(m => m.sender !== 'user' || m.content !== userMessage);
          return [
            ...filtered,
            { ...data.user_message, sender: 'user' },
            { ...data.ai_response, sender: 'ai' }
          ];
        });
        
        showNotification('Message sent!');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('Failed to send message', 'error');
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

  const toggleBookmark = (messageId) => {
    setBookmarkedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const shareConversation = () => {
    if (!selectedConversation) return;
    const shareUrl = `${window.location.origin}/conversation/${selectedConversation.id}`;
    navigator.clipboard.writeText(shareUrl);
    showNotification('Share link copied to clipboard!');
    setShowShareModal(false);
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

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} transition-colors duration-300 flex`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-20'} ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} transition-all duration-300 flex flex-col h-screen sticky top-0`}>
        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all duration-200 shadow-lg"
          >
            {sidebarOpen ? (
              <>
                <Plus className="w-5 h-5" />
                <span className="font-medium">New Chat</span>
              </>
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-2">
          {[
            { id: 'chat', label: 'Chat', icon: MessageSquare },
            { id: 'history', label: 'History', icon: Archive },
            { id: 'query', label: 'Query', icon: Search },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? darkMode
                    ? 'bg-gray-700 text-white shadow-lg'
                    : 'bg-white text-gray-900 shadow-lg border'
                  : darkMode
                    ? 'text-gray-400 hover:bg-gray-750 hover:text-white'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">{tab.label}</span>}
            </button>
          ))}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-750">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">User</p>
                <p className="text-gray-400 text-xs truncate">Free Plan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border-b border-gray-200 sticky top-0 z-40`}>
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {activeTab === 'chat' && 'Chat'}
                {activeTab === 'history' && 'History'}
                {activeTab === 'query' && 'Query Conversations'}
                {activeTab === 'analytics' && 'Analytics'}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full mx-auto">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        How can I help you today?
                      </h2>
                      <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Start a conversation and I'll assist you with anything you need.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        msg.sender === 'user' 
                          ? 'bg-blue-500' 
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}>
                        {msg.sender === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className={`flex-1 max-w-[80%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                        <div className={`inline-block px-4 py-3 rounded-2xl ${
                          msg.sender === 'user'
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : darkMode
                              ? 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
                              : 'bg-gray-50 text-gray-900 rounded-bl-none border'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {msg.timestamp && (
                          <p className={`text-xs mt-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="max-w-3xl mx-auto">
                  {currentConversation && (
                    <button
                      onClick={endConversation}
                      disabled={loading}
                      className="w-full mb-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm font-medium shadow-lg"
                    >
                      End Conversation & Generate Summary
                    </button>
                  )}
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Message AI Assistant..."
                        disabled={loading}
                        className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      />
                      <button
                        onClick={toggleVoiceInput}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                          isRecording
                            ? 'text-red-500 animate-pulse'
                            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={loading || !inputMessage.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 shadow-lg flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Conversation History</h2>
                  <button
                    onClick={fetchConversations}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Refresh
                  </button>
                </div>

                {conversations.length === 0 ? (
                  <div className="text-center py-12">
                    <Archive className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No conversations yet</p>
                    <p className="text-gray-400 dark:text-gray-500">Start a new chat to see your history here</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {conversations.map(conv => (
                      <div
                        key={conv.id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => {
                          fetchConversationDetails(conv.id);
                          setShowShareModal(true);
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                              {conv.title || `Conversation #${conv.id}`}
                            </h3>
                            <div className="flex items-center gap-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                conv.status === 'active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                              }`}>
                                {conv.status}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {conv.message_count || 0} messages
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(conv.start_timestamp).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchConversationDetails(conv.id);
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                fetchConversationDetails(conv.id);
                                setTimeout(() => exportConversation(selectedConversation, 'json'), 500);
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
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
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Query Your Conversations
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Ask questions about your past conversations and get intelligent answers
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Your Question
                      </label>
                      <textarea
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        placeholder="What did I discuss about travel last month?..."
                        rows="4"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                      />
                    </div>

                    <button
                      onClick={queryConversations}
                      disabled={queryLoading || !queryInput.trim()}
                      className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50 font-medium shadow-lg"
                    >
                      {queryLoading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Analysis Results</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Found insights from {queryResult.conversations_analyzed} conversations
                        </p>
                      </div>
                    </div>

                    <div className="prose prose-lg max-w-none dark:prose-invert">
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">
                        {formatQueryAnswer(queryResult.answer)}
                      </div>
                    </div>

                    {/* Relevant Conversations */}
                    {queryResult.relevant_conversations?.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Relevant Conversations
                        </h4>
                        <div className="grid gap-3">
                          {queryResult.relevant_conversations.map(conv => (
                            <div
                              key={conv.id}
                              onClick={() => fetchConversationDetails(conv.id)}
                              className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-all duration-200 hover:shadow-md bg-gray-500 dark:bg-gray-750"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                                    {conv.title}
                                  </h5>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {conv.date}
                                  </p>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-270" />
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
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Analytics Dashboard</h2>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <MessageSquare className="w-8 h-8 opacity-90" />
                      <span className="text-3xl font-bold">{analytics.total}</span>
                    </div>
                    <p className="text-blue-100 text-sm mt-2">Total Conversations</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <Zap className="w-8 h-8 opacity-90" />
                      <span className="text-3xl font-bold">{analytics.active}</span>
                    </div>
                    <p className="text-green-100 text-sm mt-2">Active Chats</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <FileText className="w-8 h-8 opacity-90" />
                      <span className="text-3xl font-bold">{analytics.ended}</span>
                    </div>
                    <p className="text-purple-100 text-sm mt-2">Completed</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                      <TrendingUp className="w-8 h-8 opacity-90" />
                      <span className="text-3xl font-bold">{analytics.avgMessages}</span>
                    </div>
                    <p className="text-orange-100 text-sm mt-2">Avg Messages</p>
                  </div>
                </div>

                {/* Additional Analytics Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Conversation Status</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Active Conversations</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full transition-all duration-500"
                              style={{ width: `${analytics.total > 0 ? (analytics.active / analytics.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                            {analytics.active}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300">Completed Conversations</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${analytics.total > 0 ? (analytics.ended / analytics.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                            {analytics.ended}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Insights</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-750 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-800" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-black">
                            {analytics.totalMessages} total messages
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-750 rounded-lg">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-800" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-black">
                            {analytics.avgMessages} avg messages per chat
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-750 rounded-lg">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                          <Bookmark className="w-4 h-4 text-purple-600 dark:text-purple-800" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-black">
                            {bookmarkedMessages.size} bookmarked messages
                          </p>
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
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Share Modal */}
      {selectedConversation && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedConversation.title || `Conversation #${selectedConversation.id}`}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(selectedConversation.start_timestamp).toLocaleDateString()}
              </span>
              <span>{selectedConversation.messages.length} messages</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                selectedConversation.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {selectedConversation.status}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setSelectedConversation(null)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Split Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat Messages */}
        <div className="flex-1 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Conversation
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {selectedConversation.messages?.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No messages in this conversation</p>
                </div>
              ) : (
                selectedConversation.messages?.map((msg, idx) => (
                  <div key={idx} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.sender === 'user' 
                        ? 'bg-blue-500 shadow-lg' 
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg'
                    }`}>
                      {msg.sender === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${msg.sender === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block px-4 py-3 rounded-2xl shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-blue-500 text-white rounded-br-none shadow-blue-500/25'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none border border-gray-100 dark:border-gray-600'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-xs mt-2 ${
                          msg.sender === 'user' 
                            ? 'text-blue-100' 
                            : 'text-gray-500 dark:text-gray-400'
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

        {/* Right Panel - Summary & Analytics */}
        <div className="w-96 flex-shrink-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Summary & Insights
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* AI Summary */}
              {selectedConversation.summary && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h5 className="font-semibold text-blue-900 dark:text-blue-100">AI Summary</h5>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    {selectedConversation.summary.split('. ').map((sentence, index) => (
                    <div key={index} className="flex items-start">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span>
                        {sentence.split(/(\*\*.*?\*\*)/g).map((part, partIndex) => 
                          part.startsWith('**') && part.endsWith('**') ? (
                            <span key={partIndex} className="font-semibold text-blue-950 dark:text-blue-50">
                              {part.slice(2, -2)}
                            </span>
                          ) : (
                            part
                          )
                        )}
                        {index < selectedConversation.summary.split('. ').length - 1 ? '.' : ''}
                      </span>
                    </div>
                  ))}
                  </p>
                </div>
              )}

              {/* Conversation Stats */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Conversation Stats
                </h5>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Messages</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.messages?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.duration_minutes 
                        ? `${selectedConversation.duration_minutes} min` 
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Started</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-xs">
                      {new Date(selectedConversation.start_timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Distribution */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Message Distribution</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Your Messages</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.messages?.filter(m => m.sender === 'user').length || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">AI Responses</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.messages?.filter(m => m.sender === 'ai').length || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h5>
                <div className="space-y-2">
                  <button
                    onClick={shareConversation}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Conversation
                  </button>
                  <button
                    onClick={() => exportConversation(selectedConversation, 'json')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export as JSON
                  </button>
                  <button
                    onClick={() => exportConversation(selectedConversation, 'markdown')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Export as Markdown
                  </button>
                </div>
              </div>

              {!selectedConversation.summary && (
                <div className="text-center py-8">
                  <Sparkles className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No summary available for this conversation
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex gap-3 justify-end">
          <button
            onClick={shareConversation}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 font-medium"
          >
            <Share2 className="w-4 h-4" />
            Share Link
          </button>
          <button
            onClick={() => exportConversation(selectedConversation, 'json')}
            className="px-6 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
          <button
            onClick={() => exportConversation(selectedConversation, 'markdown')}
            className="px-6 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Export MD
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default AIChatbot;

const formatQueryAnswer = (answerText) => {
  if (!answerText) return null;

  // Split the answer into logical parts
  const parts = answerText.split(/(\d+\.\s+\*\*.*?\*\*)/g);
  
  return parts.map((part, index) => {
    // Handle numbered list items with bold titles
    const numberedMatch = part.match(/^(\d+)\.\s+\*\*(.*?)\*\*\s*-\s*(.*)$/);
    if (numberedMatch) {
      const [, number, title, content] = numberedMatch;
      return (
        <div key={index} className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-100 dark:border-green-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{number}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                {title}
              </h4>
              <p className="text-green-800 dark:text-green-200 text-sm leading-relaxed">
                {content}
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Handle regular bold text
    const boldProcessed = part.split(/(\*\*.*?\*\*)/g).map((segment, segIndex) => {
      if (segment.startsWith('**') && segment.endsWith('**')) {
        const boldText = segment.slice(2, -2);
        return (
          <span key={segIndex} className="font-semibold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-800/30 px-1.5 py-0.5 rounded">
            {boldText}
          </span>
        );
      }
      return segment;
    });

    // Handle regular paragraphs
    if (part.trim() && !part.match(/^\d+\./)) {
      return (
        <p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {boldProcessed}
        </p>
      );
    }

    return null;
  }).filter(Boolean);
};