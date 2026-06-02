import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, User } from 'lucide-react';

/**
 * Creator auth.
 * - Sign up: creates an auth user + an artist_profile (their own /username page).
 * - Sign in: routes platform admins to /admin, creators to /artist-dashboard.
 * Platform admin role is managed manually by the project owner — there is no
 * public way to become a platform admin from this page.
 */

const USERNAME_RE = /^[a-z0-9_-]{3,30}$/;

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  // After a successful login, send admins to /admin and creators to their dashboard.
  const routeAfterLogin = async (userId: string) => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (roles?.role === 'admin') {
      navigate('/admin');
      return;
    }

    // Creator path — make sure they have a profile, then go to dashboard
    const { data: profile } = await supabase
      .from('artist_profiles')
      .select('username')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile?.username) {
      navigate('/artist-dashboard');
    } else {
      // Profile is missing (e.g. signup before email confirm) — bounce to dashboard,
      // which will guide them to complete setup.
      navigate('/artist-dashboard');
    }
  };

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) routeAfterLogin(session.user.id);
    })();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast({ title: 'Passwords do not match', variant: 'destructive' });
          return;
        }
        const handle = username.trim().toLowerCase();
        if (!USERNAME_RE.test(handle)) {
          toast({
            title: 'Invalid username',
            description: '3–30 characters: letters, numbers, dashes, underscores.',
            variant: 'destructive',
          });
          return;
        }
        if (!displayName.trim()) {
          toast({ title: 'Display name required', variant: 'destructive' });
          return;
        }

        // Check username availability up front for a clearer error
        const { data: taken } = await supabase
          .from('artist_profiles')
          .select('id')
          .eq('username', handle)
          .maybeSingle();
        if (taken) {
          toast({
            title: 'Username taken',
            description: 'Please choose a different username.',
            variant: 'destructive',
          });
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/artist-dashboard`,
            data: { username: handle, display_name: displayName.trim() },
          },
        });
        if (error) throw error;

        // If email confirmation is OFF, we have a session now and can create the profile.
        if (data.session && data.user) {
          const { error: profileError } = await supabase
            .from('artist_profiles')
            .insert({
              user_id: data.user.id,
              username: handle,
              display_name: displayName.trim(),
              is_public: true,
              require_key: false,
            });
          if (profileError) throw profileError;

          toast({
            title: 'Welcome!',
            description: `Your page is live at /${handle}.`,
          });
          navigate('/artist-dashboard');
          return;
        }

        // Email confirmation required — profile is created on first sign-in.
        toast({
          title: 'Check your email',
          description: 'Confirm your account to activate your page.',
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        // If this user signed up but their profile wasn't created yet (email-confirm
        // flow), create it now using the metadata captured at signup.
        if (data.user) {
          const meta = (data.user.user_metadata || {}) as {
            username?: string;
            display_name?: string;
          };
          if (meta.username && USERNAME_RE.test(meta.username)) {
            const { data: existing } = await supabase
              .from('artist_profiles')
              .select('id')
              .eq('user_id', data.user.id)
              .maybeSingle();

            if (!existing) {
              await supabase.from('artist_profiles').insert({
                user_id: data.user.id,
                username: meta.username,
                display_name: meta.display_name || meta.username,
                is_public: true,
                require_key: false,
              });
            }
          }

          await routeAfterLogin(data.user.id);
        }
      }
    } catch (error: any) {
      toast({
        title: isSignUp ? 'Sign up failed' : 'Sign in failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <User className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Creator Access</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to manage your page, or sign up to claim your own.
          </p>
        </div>

        <Tabs value={isSignUp ? 'signup' : 'signin'} onValueChange={(v) => setIsSignUp(v === 'signup')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate('/reset-password')}
                  className="text-sm text-muted-foreground"
                >
                  Forgot your password?
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name or brand"
                  required
                  maxLength={60}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">godscircle.ca/</span>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                    }
                    placeholder="yourname"
                    required
                    minLength={3}
                    maxLength={30}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  This will be your public page URL.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Creating your page...' : 'Create My Page'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
