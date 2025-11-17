import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkConsent = async () => {
      const sessionId = localStorage.getItem('session_id') || crypto.randomUUID();
      localStorage.setItem('session_id', sessionId);

      const { data } = await supabase
        .from('user_consents')
        .select('*')
        .eq('session_id', sessionId)
        .eq('consent_type', 'cookies')
        .maybeSingle();

      if (!data) {
        setShowBanner(true);
      }
    };

    checkConsent();
  }, []);

  const handleAccept = async () => {
    const sessionId = localStorage.getItem('session_id') || crypto.randomUUID();

    await supabase.from('user_consents').insert({
      user_id: user?.id || null,
      user_email: user?.email || null,
      session_id: sessionId,
      consent_type: 'cookies',
      consent_given: true,
      consent_text: 'User accepted cookies and analytics tracking',
    });

    localStorage.setItem('cookie_consent', 'accepted');
    setShowBanner(false);
  };

  const handleDecline = async () => {
    const sessionId = localStorage.getItem('session_id') || crypto.randomUUID();

    await supabase.from('user_consents').insert({
      user_id: user?.id || null,
      user_email: user?.email || null,
      session_id: sessionId,
      consent_type: 'cookies',
      consent_given: false,
      consent_text: 'User declined cookies and analytics tracking',
    });

    localStorage.setItem('cookie_consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="p-4 shadow-lg border-border bg-card">
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Cookie Consent</h3>
          <p className="text-sm text-muted-foreground">
            We use cookies and analytics to improve your experience and understand how our platform is used. Your privacy matters to us.
          </p>
          <div className="flex gap-2">
            <Button onClick={handleAccept} size="sm" className="flex-1">
              Accept
            </Button>
            <Button onClick={handleDecline} variant="outline" size="sm" className="flex-1">
              Decline
            </Button>
          </div>
          <a href="#" className="text-xs text-muted-foreground hover:underline block">
            Learn more about our privacy policy
          </a>
        </div>
      </Card>
    </div>
  );
};
