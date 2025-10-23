'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@/lib/types/chat';
import { ChatInterface } from '@/components/chat/chat-interface';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('uid', authUser.id)
          .single();

        if (error) throw error;
        setCurrentUser(userData);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-6">
          <div className="h-[calc(100vh-8rem)] max-w-6xl mx-auto">
            {currentUser ? (
              <ChatInterface currentUser={currentUser} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Unable to load user data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}