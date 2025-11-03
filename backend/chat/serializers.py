from rest_framework import serializers
from .models import Conversation, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'content', 'sender', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class ConversationListSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'status', 'start_timestamp', 
                  'end_timestamp', 'message_count']
    
    def get_message_count(self, obj):
        return obj.messages.count()


class ConversationDetailSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    duration_minutes = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'status', 'start_timestamp', 
                  'end_timestamp', 'summary', 'messages', 'duration_minutes']
    
    def get_duration_minutes(self, obj):
        if obj.end_timestamp:
            duration = obj.end_timestamp - obj.start_timestamp
            return round(duration.total_seconds() / 60, 2)
        return None


class SendMessageSerializer(serializers.Serializer):
    conversation_id = serializers.IntegerField(required=False)
    message = serializers.CharField()
    title = serializers.CharField(required=False, allow_blank=True)


class EndConversationSerializer(serializers.Serializer):
    conversation_id = serializers.IntegerField()


class QueryConversationsSerializer(serializers.Serializer):
    query = serializers.CharField()
    date_range_start = serializers.DateTimeField(required=False)
    date_range_end = serializers.DateTimeField(required=False)
    keywords = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    analysis_depth = serializers.ChoiceField(
        choices=['basic', 'detailed', 'comprehensive'],
        default='basic'
    )