import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getMessages, sendMessageToDatabase, markMessageAsRead, getUsers } from '../../lib/dummyDatabase'
import { Message, User } from '../../types'
import { MessageSquare, Send, Plus, User as UserIcon, Search, Image, X, Camera } from 'lucide-react'

export const MessageCenter: React.FC = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [showNewMessage, setShowNewMessage] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    fetchMessages()
    fetchUsers()
  }, [user])

  // Prefill recipient when navigated from directories (e.g., Doctors list)
  useEffect(() => {
    try {
      const prefill = localStorage.getItem('message:recipient')
      if (prefill) {
        setShowNewMessage(true)
        setSelectedRecipient(prefill)
        // try to resolve display name
        const who = users.find(u => u.id === prefill)
        if (who) setSearchTerm(who.full_name)
        localStorage.removeItem('message:recipient')
      }
    } catch {}
  }, [users])

  const fetchMessages = async () => {
    if (!user) return

    try {
      const { data, error } = await getMessages(user.id)

      if (error) {
        console.error('Error fetching messages:', error)
      } else {
        setMessages(data || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await getUsers(user?.id)

      if (error) {
        console.error('Error fetching users:', error)
      } else {
        // Restrict recipients for patients: cannot message other patients
        const all = data || []
        const allowed = (user?.role === 'patient') ? all.filter(u => u.role !== 'patient') : all
        setUsers(allowed)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const getConversations = () => {
    const conversations = new Map()
    
    messages.forEach(message => {
      const otherUserId = message.sender_id === user?.id ? message.recipient_id : message.sender_id
      const otherUser = message.sender_id === user?.id ? message.recipient : message.sender
      
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          userId: otherUserId,
          user: otherUser,
          lastMessage: message,
          messages: []
        })
      }
      
      conversations.get(otherUserId).messages.push(message)
    })
    
    return Array.from(conversations.values()).sort((a, b) => 
      new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
    )
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      
      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return
    
    const recipientId = showNewMessage ? selectedRecipient : selectedConversation
    if (!recipientId) return

    let imageUrl = undefined
    let imageName = undefined
    
    // Convert image to base64 for storage (in a real app, you'd upload to a server)
    if (selectedImage) {
      imageUrl = imagePreview
      imageName = selectedImage.name
    }

    try {
      const { data, error } = await sendMessageToDatabase({
        sender_id: user?.id || '',
        recipient_id: recipientId,
        subject: '',
        content: newMessage || (selectedImage ? `[Image: ${selectedImage.name}]` : ''),
        image_url: imageUrl,
        image_name: imageName,
        is_read: false
      })

      if (error) {
        console.error('Error sending message:', error)
        alert('Failed to send message. Please try again.')
      } else {
        setNewMessage('')
        removeImage()
        if (showNewMessage) {
          setShowNewMessage(false)
          setSelectedRecipient('')
          setSearchTerm('')
        }
        // Refresh messages to show the new message
        await fetchMessages()
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await markMessageAsRead(messageId, user?.id || '')
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const conversations = getConversations()
  const selectedMessages = selectedConversation 
    ? conversations.find(conv => conv.userId === selectedConversation)?.messages || []
    : []

  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <button
          onClick={() => setShowNewMessage(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span>New Message</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-col md:flex-row md:h-[600px]">
          {/* Conversations List */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Conversations</h3>
            </div>
            <div className="md:overflow-y-auto" style={{height: 'calc(600px - 60px)'}}>
              {conversations.map((conversation) => (
                <div
                  key={conversation.userId}
                  onClick={() => {
                    setSelectedConversation(conversation.userId)
                    setShowNewMessage(false)
                    // Mark unread messages as read
                    conversation.messages
                      .filter(msg => msg.recipient_id === user?.id && !msg.is_read)
                      .forEach(msg => markAsRead(msg.id))
                  }}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                    selectedConversation === conversation.userId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-100 p-2 rounded-full">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {conversation.user?.full_name}
                      </p>
                      <p className="text-sm text-gray-600 capitalize">
                        {conversation.user?.role}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                    {conversation.messages.some(msg => 
                      msg.recipient_id === user?.id && !msg.is_read
                    ) && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message View */}
          <div className="flex-1">
            {showNewMessage ? (
              <div className="p-4 h-full flex flex-col">
                <h3 className="font-semibold text-gray-900 mb-4">New Message</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <div className="mt-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg">
                      {filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedRecipient(u.id)
                            setSearchTerm(u.full_name)
                          }}
                          className={`p-2 cursor-pointer hover:bg-gray-50 ${
                            selectedRecipient === u.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <p className="text-sm font-medium">{u.full_name}</p>
                          <p className="text-xs text-gray-600 capitalize">{u.role}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Subject removed per request */}
                </div>
                
                <div className="flex-1 mt-4 flex flex-col">
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="mb-4 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-xs max-h-32 rounded-lg border border-gray-300"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-xs text-gray-500 mt-1">{selectedImage?.name}</p>
                    </div>
                  )}
                  
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={selectedImage ? "Add a caption (optional)..." : "Type your message..."}
                    className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  />
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4">
                    <div className="flex space-x-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <div className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all inline-flex items-center space-x-1">
                          <Camera className="w-4 h-4" />
                          <span className="text-sm">Image</span>
                        </div>
                      </label>
                    </div>
                    
                    <div className="flex space-x-2">
                    <button
                      onClick={() => setShowNewMessage(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={(!newMessage.trim() && !selectedImage) || !selectedRecipient}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedConversation ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <p className="font-semibold text-gray-900">
                    {selectedMessages[0]?.sender_id === user?.id 
                      ? selectedMessages[0]?.recipient?.full_name
                      : selectedMessages[0]?.sender?.full_name}
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedMessages
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.image_url && (
                          <div className="mb-2">
                            <img
                              src={message.image_url}
                              alt={message.image_name || 'Shared image'}
                              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(message.image_url, '_blank')}
                            />
                            {message.image_name && (
                              <p className={`text-xs mt-1 ${
                                message.sender_id === user?.id ? 'text-blue-200' : 'text-gray-500'
                              }`}>
                                {message.image_name}
                              </p>
                            )}
                          </div>
                        )}
                        {message.content && message.content !== `[Image: ${message.image_name}]` && (
                          <p className="text-sm">{message.content}</p>
                        )}
                        <p className={`text-xs mt-1 ${
                          message.sender_id === user?.id ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-4 border-t border-gray-200">
                  {/* Image Preview in Reply */}
                  {imagePreview && (
                    <div className="mb-3 relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-xs max-h-24 rounded-lg border border-gray-300"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <p className="text-xs text-gray-500 mt-1">{selectedImage?.name}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <label className="cursor-pointer self-end">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <div className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <Image className="w-5 h-5" />
                      </div>
                    </label>
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={selectedImage ? "Add a caption (optional)..." : "Type your reply..."}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                      rows={2}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() && !selectedImage}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
