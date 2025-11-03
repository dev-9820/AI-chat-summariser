from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from .models import Conversation, Message
from .serializers import (
    ConversationListSerializer,
    ConversationDetailSerializer,
    SendMessageSerializer,
    EndConversationSerializer,
    QueryConversationsSerializer
)
from .ai_service import AIService


@api_view(['GET'])
def list_conversations(request):
    """GET: Retrieve all conversations with basic info"""
    conversations = Conversation.objects.all()
    serializer = ConversationListSerializer(conversations, many=True)
    return Response({
        'success': True,
        'count': conversations.count(),
        'conversations': serializer.data
    })


@api_view(['GET'])
def get_conversation(request, conversation_id):
    """GET: Get specific conversation with full message history"""
    try:
        conversation = Conversation.objects.get(id=conversation_id)
        serializer = ConversationDetailSerializer(conversation)
        return Response({
            'success': True,
            'conversation': serializer.data
        })
    except Conversation.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Conversation not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def send_message(request):
    """POST: Create new conversation and send messages"""
    serializer = SendMessageSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    user_message = data['message']
    conversation_id = data.get('conversation_id')
    title = data.get('title', '')
    
    try:
        # Get or create conversation
        if conversation_id:
            conversation = Conversation.objects.get(id=conversation_id)
            if conversation.status != 'active':
                return Response({
                    'success': False,
                    'error': 'Cannot send messages to ended conversation'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Create new conversation
            conversation = Conversation.objects.create(
                title=title or AIService.generate_conversation_title(user_message),
                status='active'
            )
        
        # Save user message
        user_msg = Message.objects.create(
            conversation=conversation,
            content=user_message,
            sender='user'
        )
        
        # Generate AI response
        ai_response_text = AIService.generate_chat_response(
            conversation.id, 
            user_message
        )
        
        # Save AI message
        ai_msg = Message.objects.create(
            conversation=conversation,
            content=ai_response_text,
            sender='ai'
        )
        
        return Response({
            'success': True,
            'conversation_id': conversation.id,
            'user_message': {
                'id': user_msg.id,
                'content': user_msg.content,
                'timestamp': user_msg.timestamp
            },
            'ai_response': {
                'id': ai_msg.id,
                'content': ai_msg.content,
                'timestamp': ai_msg.timestamp
            }
        }, status=status.HTTP_201_CREATED)
        
    except Conversation.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Conversation not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def end_conversation(request):
    """POST: End conversation and trigger AI summary generation"""
    serializer = EndConversationSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    conversation_id = serializer.validated_data['conversation_id']
    
    try:
        conversation = Conversation.objects.get(id=conversation_id)
        
        if conversation.status == 'ended':
            return Response({
                'success': False,
                'error': 'Conversation already ended'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # End conversation
        conversation.end_conversation()
        
        # Generate AI summary
        summary = AIService.generate_conversation_summary(conversation_id)
        title = AIService.generate_conversation_title(conversation_id)

        conversation.summary = summary
        conversation.title = title
        conversation.save()
        
        return Response({
            'success': True,
            'conversation_id': conversation.id,
            'summary': summary,
            'title': title,
            'end_timestamp': conversation.end_timestamp
        })
        
    except Conversation.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Conversation not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def query_conversations(request):
    """POST: Query AI about past conversations with intelligent analysis"""
    serializer = QueryConversationsSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    query = data['query']
    
    # Build filters
    filters = {
        'date_range_start': data.get('date_range_start'),
        'date_range_end': data.get('date_range_end'),
        'keywords': data.get('keywords', []),
        'analysis_depth': data.get('analysis_depth', 'basic')
    }
    
    try:
        # Query AI service
        result = AIService.query_past_conversations(query, filters)
        
        return Response({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)