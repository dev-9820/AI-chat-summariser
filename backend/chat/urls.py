from django.urls import path
from . import views

urlpatterns = [
    # GET APIs
    path('conversations/', views.list_conversations, name='list_conversations'),
    path('conversations/<int:conversation_id>/', views.get_conversation, name='get_conversation'),
    
    # POST APIs
    path('send-message/', views.send_message, name='send_message'),
    path('end-conversation/', views.end_conversation, name='end_conversation'),
    path('query-conversations/', views.query_conversations, name='query_conversations'),
]