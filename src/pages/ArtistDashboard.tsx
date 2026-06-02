import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Upload, LogOut, BarChart, FileText, Music, Trash2, DollarSign } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
        .single();

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
      toast({ title: 'Files uploaded', description: `${files.length} file(s) uploaded.` });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingFiles(false);
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

  if (!isAdmin || !user) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Artist Dashboard
            </h1>
            <p className="text-muted-foreground text-sm">Manage your music, merch, keys, and profile</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate('/analytics')}>
              <BarChart className="h-4 w-4 mr-2" /> Analytics
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              <FileText className="h-4 w-4 mr-2" /> Investments
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

        <ShopifyProductUploader userId={user.id} username={artistUsername} />

        <SalesAndPayouts />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audio Files */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" /> Audio Files
              </CardTitle>
              <CardDescription>{audioFiles.length} uploaded — no limit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="file"
                accept=".wav,.mp3,audio/*"
                multiple
                onChange={handleFileUpload}
                disabled={uploadingFiles}
              />

              <div className="space-y-2">
                {audioFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{file.file_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(file.created_at).toLocaleDateString()}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteFile(file.id, file.file_url)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <Label>Cover Art</Label>
                <Input type="file" accept="image/*" onChange={handleCoverArtUpload} className="mt-1" />
                {coverArtPreview && (
                  <img src={coverArtPreview} alt="Cover" className="w-16 h-16 rounded mt-2 object-cover" />
                )}
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
            <CardDescription>Choose whether to accept investments and set a goal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Accept Investments</p>
                  <p className="text-xs text-muted-foreground">Show an Invest button to key-holders</p>
                </div>
              </div>
              <Switch checked={acceptInvestments} onCheckedChange={setAcceptInvestments} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Project Name</Label>
                <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Investment Budget ($)</Label>
                <Input type="number" min="0" step="100" value={investmentBudget} onChange={(e) => setInvestmentBudget(Number(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label>Expected ROI (%)</Label>
                <Input type="number" min="0" max="100" value={roiPercentage} onChange={(e) => setRoiPercentage(Number(e.target.value))} className="mt-1" />
              </div>
            </div>
            {investmentBudget > 0 && (
              <div className="p-3 bg-muted rounded-lg grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Admin (51%)</p>
                  <p className="font-semibold text-primary">${(investmentBudget * 0.51).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Users (49%)</p>
                  <p className="font-semibold">${(investmentBudget * 0.49).toLocaleString()}</p>
                </div>
              </div>
            )}
            <Button onClick={handleSaveProjectSettings} variant="gradient" className="w-full">
              Save Project Settings
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
