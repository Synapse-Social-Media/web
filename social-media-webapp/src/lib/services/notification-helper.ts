import { notificationService } from './notification-service';
import { NotificationType } from '@/lib/types/notification';

export class NotificationHelper {
  // Create notification for likes
  static async createLikeNotification(
    targetUserId: string,
    senderId: string,
    postId: string,
    postContent?: string
  ) {
    if (targetUserId === senderId) return; // Don't notify self

    await notificationService.createNotification({
      user_id: targetUserId,
      sender_id: senderId,
      type: 'like',
      title: 'New like on your post',
      message: `Someone liked your post${postContent ? `: "${postContent.substring(0, 50)}${postContent.length > 50 ? '...' : ''}"` : ''}`,
      data: {
        post_id: postId,
        action_type: 'like'
      },
      action_url: `/posts/${postId}`,
      priority: 'normal'
    });
  }

  // Create notification for comments
  static async createCommentNotification(
    targetUserId: string,
    senderId: string,
    postId: string,
    commentContent: string,
    postContent?: string
  ) {
    if (targetUserId === senderId) return; // Don't notify self

    await notificationService.createNotification({
      user_id: targetUserId,
      sender_id: senderId,
      type: 'comment',
      title: 'New comment on your post',
      message: `Someone commented: "${commentContent.substring(0, 100)}${commentContent.length > 100 ? '...' : ''}"`,
      data: {
        post_id: postId,
        action_type: 'comment'
      },
      action_url: `/posts/${postId}`,
      priority: 'normal'
    });
  }

  // Create notification for follows
  static async createFollowNotification(
    targetUserId: string,
    senderId: string,
    senderUsername?: string
  ) {
    if (targetUserId === senderId) return; // Don't notify self

    await notificationService.createNotification({
      user_id: targetUserId,
      sender_id: senderId,
      type: 'follow',
      title: 'New follower',
      message: `${senderUsername || 'Someone'} started following you`,
      data: {
        action_type: 'follow'
      },
      action_url: `/profile/${senderId}`,
      priority: 'normal'
    });
  }

  // Create notification for messages
  static async createMessageNotification(
    targetUserId: string,
    senderId: string,
    chatId: string,
    messageContent: string,
    senderName?: string
  ) {
    if (targetUserId === senderId) return; // Don't notify self

    await notificationService.createNotification({
      user_id: targetUserId,
      sender_id: senderId,
      type: 'message',
      title: `New message from ${senderName || 'someone'}`,
      message: messageContent.substring(0, 100) + (messageContent.length > 100 ? '...' : ''),
      data: {
        chat_id: chatId,
        action_type: 'message'
      },
      action_url: `/messages/${chatId}`,
      priority: 'high'
    });
  }

  // Create notification for mentions
  static async createMentionNotification(
    targetUserId: string,
    senderId: string,
    postId: string,
    content: string,
    senderUsername?: string
  ) {
    if (targetUserId === senderId) return; // Don't notify self

    await notificationService.createNotification({
      user_id: targetUserId,
      sender_id: senderId,
      type: 'mention',
      title: 'You were mentioned',
      message: `${senderUsername || 'Someone'} mentioned you in a post`,
      data: {
        post_id: postId,
        action_type: 'mention'
      },
      action_url: `/posts/${postId}`,
      priority: 'high'
    });
  }

  // Create notification for story views
  static async createStoryViewNotification(
    targetUserId: string,
    senderId: string,
    storyId: string,
    viewerUsername?: string
  ) {
    if (targetUserId === senderId) return; // Don't notify self

    await notificationService.createNotification({
      user_id: targetUserId,
      sender_id: senderId,
      type: 'story_view',
      title: 'Story view',
      message: `${viewerUsername || 'Someone'} viewed your story`,
      data: {
        story_id: storyId,
        action_type: 'story_view'
      },
      action_url: `/stories/${storyId}`,
      priority: 'low'
    });
  }

  // Create notification for post shares
  static async createShareNotification(
    targetUserId: string,
    senderId: string,
    postId: string,
    sharerUsername?: string
  ) {
    if (targetUserId === senderId) return; // Don't notify self

    await notificationService.createNotification({
      user_id: targetUserId,
      sender_id: senderId,
      type: 'post_share',
      title: 'Post shared',
      message: `${sharerUsername || 'Someone'} shared your post`,
      data: {
        post_id: postId,
        action_type: 'share'
      },
      action_url: `/posts/${postId}`,
      priority: 'normal'
    });
  }

  // Create system notification
  static async createSystemNotification(
    targetUserId: string,
    title: string,
    message: string,
    data?: Record<string, any>,
    priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
  ) {
    await notificationService.createNotification({
      user_id: targetUserId,
      type: 'system',
      title,
      message,
      data,
      priority
    });
  }

  // Create welcome notification for new users
  static async createWelcomeNotification(userId: string) {
    await notificationService.createNotification({
      user_id: userId,
      type: 'welcome',
      title: 'Welcome to Social Media App!',
      message: 'Thanks for joining our community. Start by completing your profile and connecting with friends.',
      data: {
        action_type: 'welcome'
      },
      action_url: '/profile/edit',
      priority: 'normal'
    });
  }
}

export const notificationHelper = NotificationHelper;