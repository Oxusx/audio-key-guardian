import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Upload, LogOut, BarChart, Music, Trash2, Video } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { audioMatchesVideo } from '@/lib/audioMatch';
import ArtistProfileForm from '@/components/admin/ArtistProfileForm';
import MerchManager from '@/components/admin/MerchManager';
import KeyGeneratorWithMerch from '@/components/admin/KeyGeneratorWithMerch';
import ShopifyProductUploader from '@/components/admin/ShopifyProductUploader';
import SalesAndPayouts from '@/components/admin/SalesAndPayouts';

const ArtistDashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [audioFiles, setAudioFiles] = useState<any[]>([]);
  const [artistProfileId, setArtistProfileId] = useState<string | undefined>();
  const [artistUsername, setArtistUsername] = useState<string | undefined>();
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [investmentBudget, setInvestmentBudget] = useState(0);
  const [acceptInvestments, setAcceptInvestments] = useState(false);
  const [projectName, setProjectName] = useState('Music Project');
  const [roiPercentage, setRoiPercentage] = useState(20);
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState('');


  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    if (!user) return;
    try {
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('admin_id', user.id)
        .maybeSingle();

      if (settings) {
        setProjectName(settings.project_name || 'Music Project');
        setInvestmentBudget(Number(settings.investment_budget) || 0);
        setRoiPercentage(Number(settings.roi_percentage) || 20);
        setAcceptInvestments((settings as any).accept_investments ?? false);
        if (settings.cover_art_url) setCoverArtPreview(settings.cover_art_url);
      }

      const { data: profile } = await supabase
        .from('artist_profiles')
        .select('id, username')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profile) {
        setArtistProfileId(profile.id);
        setArtistUsername(profile.username);
      }


      const { data: files } = await supabase
        .from('audio_files')
        .select('*')
        .eq('admin_id', user.id)
        .order('created_at', { ascending: true });
      if (files) setAudioFiles(files);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;
    setUploadingFiles(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('audio-files').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('audio-files').getPublicUrl(fileName);
        const { error: dbError } = await supabase.from('audio_files').insert({ admin_id: user.id, file_name: file.name, file_url: publicUrl });
        if (dbError) throw dbError;
      }
      await loadAdminData();
      toast({ title: 'Uploaded', description: `${files.length} track(s). Add a visual from the track row if you have one.` });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingFiles(false);
      event.target.value = '';
    }
  };

  const [verifyingTrackId, setVerifyingTrackId] = useState<string | null>(null);

  const handleVideoUpload = async (trackId: string, file: File) => {
    if (!user) return;
    const track = audioFiles.find((f) => f.id === trackId);
    if (!track) return;
    setVerifyingTrackId(trackId);
    try {
      toast({ title: 'Checking audio match…', description: 'Verifying the video uses the same audio.' });
      const audioRes = await fetch(track.file_url);
      if (!audioRes.ok) throw new Error('Could not load original audio for verification.');
      const audioBlob = await audioRes.blob();
      const audioFile = new File([audioBlob], track.file_name, { type: audioBlob.type || 'audio/mpeg' });

      const result = await audioMatchesVideo(audioFile, file);
      if (!result.match) {
        toast({
          title: 'Audio doesn’t match',
          description: (result.reason || 'The video audio must match the uploaded track.') + ' Upload blocked for copyright protection.',
          variant: 'destructive',
        });
        return;
      }

      const ext = file.name.split('.').pop();
      const path = `${user.id}/videos/${trackId}.${ext}`;
      const { error: upErr } = await supabase.storage.from('audio-files').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('audio-files').getPublicUrl(path);
      const { error } = await supabase.from('audio_files').update({ video_url: publicUrl } as any).eq('id', trackId);
      if (error) throw error;
      await loadAdminData();
      toast({ title: 'Visual added', description: `Audio match ${(result.similarity * 100).toFixed(0)}%.` });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setVerifyingTrackId(null);
    }
  };


  const deleteFile = async (id: string, fileUrl: string) => {
    try {
      const urlParts = fileUrl.split('/audio-files/');
      if (urlParts.length > 1) await supabase.storage.from('audio-files').remove([urlParts[1]]);
      const { error } = await supabase.from('audio_files').delete().eq('id', id);
      if (error) throw error;
      await loadAdminData();
      toast({ title: 'File deleted' });
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleCoverArtUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCoverArtFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setCoverArtPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProjectSettings = async () => {
    if (!user) return;
    try {
      let coverArtUrl = coverArtPreview;
      if (coverArtFile) {
        const fileExt = coverArtFile.name.split('.').pop();
        const fileName = `${user.id}/cover.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('cover-art').upload(fileName, coverArtFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('cover-art').getPublicUrl(fileName);
        coverArtUrl = publicUrl;
      }
      const { error } = await supabase.from('admin_settings').upsert({
        admin_id: user.id,
        project_name: projectName,
        investment_budget: investmentBudget,
        roi_percentage: roiPercentage,
        cover_art_url: coverArtUrl,
        accept_investments: acceptInvestments,
      } as any);

      if (error) throw error;
      toast({ title: 'Settings saved' });
      setCoverArtFile(null);
    } catch (error: any) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Artist Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">Music, merch, and keys</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate('/analytics')}>
              <BarChart className="h-4 w-4 mr-2" /> Analytics
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>

        {/* Artist Profile */}
        <ArtistProfileForm
          userId={user.id}
          onProfileSaved={(profile) => { setArtistProfileId(profile.id); setArtistUsername(profile.username); }}
        />

        <SalesAndPayouts />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audio Files */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" /> Music
              </CardTitle>
              <CardDescription>{audioFiles.length} uploaded</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="file"
                accept=".wav,.mp3,audio/*"
                multiple
                onChange={handleFileUpload}
                disabled={uploadingFiles}
              />
              <p className="text-xs text-muted-foreground">Got a visual? Tap the 🎬 on a track to attach a video.</p>
              <div className="space-y-2">
                {audioFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <p className="font-medium text-sm truncate flex-1 flex items-center gap-1.5">
                      {file.file_name}
                      {file.video_url && <Video className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </p>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleVideoUpload(file.id, f);
                          e.target.value = '';
                        }}
                      />
                      <Button variant="ghost" size="sm" asChild disabled={verifyingTrackId === file.id}>
                        <span title={file.video_url ? 'Replace visual' : 'Add visual'}>
                          <Video className={`h-4 w-4 ${verifyingTrackId === file.id ? 'animate-pulse' : ''} ${file.video_url ? 'text-primary' : ''}`} />
                        </span>
                      </Button>
                    </label>
                    <Button variant="ghost" size="sm" onClick={() => deleteFile(file.id, file.file_url)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Key Generator */}
          <KeyGeneratorWithMerch
            userId={user.id}
            artistProfileId={artistProfileId}
            hasAudioFiles={audioFiles.length > 0}
          />
        </div>

        {/* Merch Manager */}
        {artistProfileId && <MerchManager artistProfileId={artistProfileId} />}

        {/* Project Settings */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Project Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Project Name</Label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Cover Art</Label>
              <Input type="file" accept="image/*" onChange={handleCoverArtUpload} className="mt-1" />
              {coverArtPreview && (
                <img src={coverArtPreview} alt="Cover" className="w-16 h-16 rounded mt-2 object-cover" />
              )}
            </div>
            <Button onClick={handleSaveProjectSettings} variant="gradient" className="w-full">
              Save
            </Button>
          </CardContent>
        </Card>

        <Button onClick={() => navigate('/')} variant="outline" size="lg" className="w-full">
          <Music className="h-5 w-5 mr-2" /> View Tracklist
        </Button>
      </div>
    </div>
  );
};

export default ArtistDashboard;
