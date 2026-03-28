import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { User, Globe, Instagram, Twitter, Youtube, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ArtistProfile {
  id?: string;
  username: string;
  display_name: string;
  bio: string;
  social_links: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    website?: string;
  };
  is_public: boolean;
  require_key: boolean;
  profile_image_url?: string;
  banner_image_url?: string;
}

interface ArtistProfileFormProps {
  userId: string;
  onProfileSaved: (profile: ArtistProfile & { id: string }) => void;
}

const ArtistProfileForm = ({ userId, onProfileSaved }: ArtistProfileFormProps) => {
  const { toast } = useToast();
  const [profile, setProfile] = useState<ArtistProfile>({
    username: '',
    display_name: '',
    bio: '',
    social_links: {},
    is_public: true,
    require_key: true,
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('artist_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setProfile({
          id: data.id,
          username: data.username,
          display_name: data.display_name,
          bio: data.bio || '',
          social_links: (data.social_links as any) || {},
          is_public: data.is_public ?? true,
          require_key: data.require_key ?? true,
          profile_image_url: data.profile_image_url || undefined,
          banner_image_url: data.banner_image_url || undefined,
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const handleSave = async () => {
    if (!profile.username.trim() || !profile.display_name.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Username and display name are required.',
        variant: 'destructive',
      });
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_-]+$/.test(profile.username)) {
      toast({
        title: 'Invalid username',
        description: 'Username can only contain letters, numbers, hyphens, and underscores.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      let profileImageUrl = profile.profile_image_url;

      if (profileImageFile) {
        const fileExt = profileImageFile.name.split('.').pop();
        const fileName = `${userId}/profile.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('cover-art')
          .upload(fileName, profileImageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('cover-art')
          .getPublicUrl(fileName);

        profileImageUrl = publicUrl;
      }

      const profileData = {
        user_id: userId,
        username: profile.username.toLowerCase().trim(),
        display_name: profile.display_name.trim(),
        bio: profile.bio.trim(),
        social_links: profile.social_links,
        is_public: profile.is_public,
        require_key: profile.require_key,
        profile_image_url: profileImageUrl || null,
        updated_at: new Date().toISOString(),
      };

      let result;
      if (profile.id) {
        result = await supabase
          .from('artist_profiles')
          .update(profileData)
          .eq('id', profile.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('artist_profiles')
          .insert(profileData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast({ title: 'Profile saved', description: 'Your artist profile has been updated.' });
      onProfileSaved(result.data as any);
      setProfileImageFile(null);
    } catch (error: any) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Artist Profile
        </CardTitle>
        <CardDescription>
          Set up your public artist page at godscircle.ca/{profile.username || 'your-username'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="username">Username (URL path)</Label>
            <Input
              id="username"
              value={profile.username}
              onChange={(e) => setProfile(p => ({ ...p, username: e.target.value }))}
              placeholder="your-username"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              godscircle.ca/{profile.username || '...'}
            </p>
          </div>
          <div>
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={profile.display_name}
              onChange={(e) => setProfile(p => ({ ...p, display_name: e.target.value }))}
              placeholder="Your Artist Name"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profile.bio}
            onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
            placeholder="Tell your audience about yourself..."
            className="mt-1"
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="profile-image">Profile Image</Label>
          <Input
            id="profile-image"
            type="file"
            accept="image/*"
            onChange={(e) => setProfileImageFile(e.target.files?.[0] || null)}
            className="mt-1"
          />
        </div>

        {/* Social Links */}
        <div className="space-y-3">
          <Label>Social Links</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Instagram className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={profile.social_links.instagram || ''}
                onChange={(e) => setProfile(p => ({
                  ...p,
                  social_links: { ...p.social_links, instagram: e.target.value }
                }))}
                placeholder="Instagram URL"
              />
            </div>
            <div className="flex items-center gap-2">
              <Twitter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={profile.social_links.twitter || ''}
                onChange={(e) => setProfile(p => ({
                  ...p,
                  social_links: { ...p.social_links, twitter: e.target.value }
                }))}
                placeholder="Twitter/X URL"
              />
            </div>
            <div className="flex items-center gap-2">
              <Youtube className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={profile.social_links.youtube || ''}
                onChange={(e) => setProfile(p => ({
                  ...p,
                  social_links: { ...p.social_links, youtube: e.target.value }
                }))}
                placeholder="YouTube URL"
              />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                value={profile.social_links.website || ''}
                onChange={(e) => setProfile(p => ({
                  ...p,
                  social_links: { ...p.social_links, website: e.target.value }
                }))}
                placeholder="Website URL"
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Public Page</p>
              <p className="text-xs text-muted-foreground">Anyone can visit your page</p>
            </div>
            <Switch
              checked={profile.is_public}
              onCheckedChange={(checked) => setProfile(p => ({ ...p, is_public: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Require Access Key for Music</p>
              <p className="text-xs text-muted-foreground">Users need a key to play your private tracks</p>
            </div>
            <Switch
              checked={profile.require_key}
              onCheckedChange={(checked) => setProfile(p => ({ ...p, require_key: checked }))}
            />
          </div>
        </div>

        <Button onClick={handleSave} variant="gradient" className="w-full" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ArtistProfileForm;
