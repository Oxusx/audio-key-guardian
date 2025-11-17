import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ActivityLog {
  action_type: string;
  action_details?: any;
  page_url?: string;
}

export const useActivityTracking = () => {
  const { user } = useAuth();

  const logActivity = async (activity: ActivityLog) => {
    try {
      await supabase.from('activity_logs').insert({
        user_id: user?.id || null,
        user_email: user?.email || null,
        action_type: activity.action_type,
        action_details: activity.action_details || null,
        page_url: activity.page_url || window.location.pathname,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Activity tracking error:', error);
    }
  };

  // Auto-track page views
  useEffect(() => {
    logActivity({
      action_type: 'page_view',
      page_url: window.location.pathname,
    });
  }, [window.location.pathname]);

  return { logActivity };
};
