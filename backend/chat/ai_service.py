import google.generativeai as genai
from django.conf import settings
from .models import Conversation, Message
from datetime import datetime


# Initialize Gemini client
genai.configure(api_key="AIzaSyALQl3IlQPXT_dD8k5kvBA9j3aXenmfDAg") 


class AIService:

    @staticmethod
    def generate_chat_response_stream(conversation_id, user_message):
        """Generate AI response with streaming for real-time chat"""
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            messages = conversation.messages.all()

            # Build context
            context_text = "You are a helpful AI assistant. Respond thoughtfully and contextually, although in as short as possible.\n\n"
            for msg in messages:
                sender = "User" if msg.sender == "user" else "Assistant"
                context_text += f"{sender}: {msg.content}\n"
            context_text += f"User: {user_message}\nAssistant:"

            # Generate streaming response
            model = genai.GenerativeModel("gemini-2.0-flash-exp")
            response = model.generate_content(
                context_text,
                stream=True,  # Enable streaming
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=1000,
                )
            )

            # Yield chunks as they arrive
            for chunk in response:
                if chunk.text:
                    yield chunk.text

        except Exception as e:
            yield f"Error generating response: {str(e)}"

    @staticmethod
    def generate_chat_response(conversation_id, user_message):
        """Non-streaming version (fallback)"""
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            messages = conversation.messages.all()

            context_text = "You are a helpful AI assistant. Respond thoughtfully and contextually.\n\n"
            for msg in messages:
                sender = "User" if msg.sender == "user" else "Assistant"
                context_text += f"{sender}: {msg.content}\n"
            context_text += f"User: {user_message}\nAssistant:"

            model = genai.GenerativeModel("gemini-2.0-flash-exp")
            response = model.generate_content(context_text)

            return response.text.strip()

        except Exception as e:
            return f"Error generating response: {str(e)}"
    
    @staticmethod
    def generate_conversation_summary(conversation_id):
        """Generate AI summary when conversation ends"""
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            messages = conversation.messages.all()
            
            if not messages:
                return "No messages in this conversation."
            
            conversation_text = "\n".join([
                f"{msg.sender.upper()}: {msg.content}" 
                for msg in messages
            ])
            
            model = genai.GenerativeModel("gemini-2.0-flash-exp")
            prompt = f"""Summarize the following conversation concisely. Highlight key topics, decisions, and important points discussed.

Conversation:
{conversation_text}

Summary:"""
            
            response = model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            return f"Error generating summary: {str(e)}"
    
    @staticmethod
    def query_past_conversations(query, filters=None):
        """Intelligent query about past conversations using AI"""
        try:
            conversations = Conversation.objects.filter(status='ended')
            
            if filters:
                if filters.get('date_range_start'):
                    conversations = conversations.filter(
                        start_timestamp__gte=filters['date_range_start']
                    )
                if filters.get('date_range_end'):
                    conversations = conversations.filter(
                        start_timestamp__lte=filters['date_range_end']
                    )
            
            conversation_data = []
            for conv in conversations[:10]:
                messages = conv.messages.all()
                conv_text = "\n".join([
                    f"{msg.sender}: {msg.content}" 
                    for msg in messages
                ])
                
                conversation_data.append({
                    'id': conv.id,
                    'title': conv.title or f"Conversation {conv.id}",
                    'date': conv.start_timestamp.strftime('%Y-%m-%d %H:%M'),
                    'summary': conv.summary or "No summary available",
                    'messages': conv_text
                })
            
            context = "Here are the past conversations:\n\n"
            for conv in conversation_data:
                context += f"Conversation {conv['id']} ({conv['date']}):\n"
                context += f"Title: {conv['title']}\n"
                context += f"Summary: {conv['summary']}\n"
                if filters and filters.get('analysis_depth') in ['detailed', 'comprehensive']:
                    context += f"Messages:\n{conv['messages'][:500]}\n"
                context += "\n---\n\n"
            
            if filters and filters.get('keywords'):
                keywords = filters['keywords']
                keyword_filter = f"Focus on conversations containing these keywords: {', '.join(keywords)}"
                context += f"\n{keyword_filter}\n"
            
            model = genai.GenerativeModel("gemini-2.0-flash-exp")
            prompt = f"""{context}

User Query: {query}

Provide a detailed, insightful answer based on the conversation data. Use semantic understanding to find relevant information."""
            
            response = model.generate_content(prompt)
            answer = response.text.strip()
            
            return {
                'query': query,
                'answer': answer,
                'conversations_analyzed': len(conversation_data),
                'relevant_conversations': [
                    {'id': conv['id'], 'title': conv['title'], 'date': conv['date']}
                    for conv in conversation_data
                ]
            }
            
        except Exception as e:
            return {
                'query': query,
                'answer': f"Error processing query: {str(e)}",
                'conversations_analyzed': 0,
                'relevant_conversations': []
            }
    
    @staticmethod
    def generate_conversation_title(first_message):
        """Generate a title for the conversation based on first message"""
        try:
            model = genai.GenerativeModel("gemini-2.0-flash-exp")
            prompt = f"""Generate a short, descriptive title (max 50 characters) for a conversation that starts with:

"{first_message}"

Title:"""
            
            response = model.generate_content(prompt)
            title = response.text.strip().strip('"\'')
            return title[:255]
            
        except Exception as e:
            return "Untitled Conversation"