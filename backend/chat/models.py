from django.db import models
from django.utils import timezone

class Conversation(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('ended', 'Ended'),
    ]
    
    title = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    start_timestamp = models.DateTimeField(auto_now_add=True)
    end_timestamp = models.DateTimeField(null=True, blank=True)
    summary = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'conversations'
        ordering = ['-start_timestamp']
    
    def __str__(self):
        return f"Conversation {self.id} - {self.status}"
    
    def end_conversation(self):
        """End the conversation and set end timestamp"""
        self.status = 'ended'
        self.end_timestamp = timezone.now()
        self.save()


class Message(models.Model):
    SENDER_CHOICES = [
        ('user', 'User'),
        ('ai', 'AI'),
    ]
    
    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    content = models.TextField()
    sender = models.CharField(max_length=10, choices=SENDER_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'messages'
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.sender} - {self.content[:50]}"