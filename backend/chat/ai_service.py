import google.generativeai as genai
from django.conf import settings
from .models import Conversation, Message
from datetime import datetime


# Initialize Gemini client
genai.configure(api_key="AIzaSyALQl3IlQPXT_dD8k5kvBA9j3aXenmfDAg") 


class AIService:

    @staticmethod
    def generate_chat_response(conversation_id, user_message):
        """Generate AI response for real-time chat"""
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            messages = conversation.messages.all()

            context_text = "You are a helpful AI assistant. Respond thoughtfully and contextually.\n\n"
            for msg in messages:
                sender = "User" if msg.sender == "user" else "Assistant"
                context_text += f"{sender}: {msg.content}\n"
            context_text += f"User: {user_message}\nAssistant:"

            # Generate response
            model = genai.GenerativeModel("gemini-2.5-flash")
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

            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = (
                "You are an expert summarizer. Summarize the following conversation "
                "into a concise, insightful summary highlighting key points, decisions, and topics.\n\n"
                f"{conversation_text}"
            )

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

            # Prepare context text for Gemini
            context = "Here are the past conversations:\n\n"
            for conv in conversation_data:
                context += f"Conversation {conv['id']} ({conv['date']}):\n"
                context += f"Title: {conv['title']}\n"
                context += f"Summary: {conv['summary']}\n"
                if filters and filters.get('analysis_depth') in ['detailed', 'comprehensive']:
                    context += f"Messages:\n{conv['messages'][:500]}\n"
                context += "\n---\n\n"

            if filters and filters.get('keywords'):
                keywords = ", ".join(filters['keywords'])
                context += f"Focus on conversations containing these keywords: {keywords}\n\n"

            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = (
                f"{context}\n\nUser Query: {query}\n\n"
                "Provide a detailed, insightful answer based on the above conversation data."
            )
            response = model.generate_content(prompt)

            return {
                'query': query,
                'answer': response.text.strip(),
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

    # ------------------------------------------------------------------

    @staticmethod
    def generate_conversation_title(conversation_id):
        """Generate a title for the conversation based on the first message"""
        try:
            conversation = Conversation.objects.get(id=conversation_id)
            first_message_obj = conversation.messages.first()

            first_message = first_message_obj.content  # or .text depending on your model
            model = genai.GenerativeModel("gemini-2.5-flash")

            prompt = (
                "Generate a short, descriptive title (max 50 characters) "
                "for a conversation based on the first message:\n\n"
                f"{first_message}"
            )
            response = model.generate_content(prompt)
            title = response.text.strip('"\'')
            return title[:255]

        except Exception:
            return "Untitled Conversation"