# 🌟 AI CHATBOT plus SUMMARISER

A web application with **Django REST Framework** as the backend and **React** as the frontend.  

---

## 🛠 Tech Stack

- **Backend:** Django, Django REST Framework, PostgreSQL  
- **Frontend:** React, Tailwind CSS 
---

## ⚡ Setup Instructions

### **1. Backend Setup (Django REST Framework)**

```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

```
python manage.py migrate
python manage.py runserver
```

The backend API will run at http://127.0.0.1:8000/.

### **2. Frontend Setup ( React )**

Navigate to frontend folder

`cd ../frontend`

Install dependencies

`npm install`

Start the frontend development server

`npm start`

The frontend will run at http://localhost:5173/.

## 📸 Screenshots and Demo Video

## [ DEMO VIDEO LINK HERE ](https://drive.google.com/file/d/1FvnrCqymeXM1GNa_zzkA2iLlenkALuOS/view?usp=sharing)

![ChatScreen](./screenshots/chatScreen.png)

![ChatScreen](./screenshots/chatScreen2.png)

![ChatScreen](./screenshots/HistoryScreen.png)

![ChatScreen](./screenshots/DetailsScreen.png)

![ChatScreen](./screenshots/StatsDetailsScreen.png)

![ChatScreen](./screenshots/Query.png)

![ChatScreen](./screenshots/QueryResults.png)

![ChatScreen](./screenshots/Analytics.png)

## AI Chatbot Project - Complete Features Checklist

# Conversation Management
✅ End conversations with auto-summary  
✅ Auto-generate conversation titles  
✅ Store all conversations in PostgreSQL  
✅ View conversation history  
✅ Track conversation status (active/ended)  
✅ Timestamp tracking (start/end)  

# Real-time AI Chat
✅ Send messages to AI assistant  
✅ Real-time streaming responses (character-by-character)  
✅ Context-aware AI (remembers conversation history)  
✅ Powered by Google Gemini API  
✅ Cancel streaming mid-response  
✅ Streaming indicator with visual feedback  
✅ Blinking cursor animation during streaming  

# Message Features
✅ Track sender (user/ai)  
✅ Message history per conversation  
✅ Display message count per conversation  
✅ Conversation duration tracking  
✅ Optimistic UI updates  
