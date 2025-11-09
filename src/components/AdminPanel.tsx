import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Key, Clock, Infinity, Trash2, Copy, Music, LogOut, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AccessPassword {
  id: string;
  key_code: string;
  access_type: '24h' | '48h' | 'indefinite';
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [audioFiles, setAudioFiles] = useState<any[]>([]);
  const [passwords, setPasswords] = useState<AccessPassword[]>([]);
  const [selectedAccessType, setSelectedAccessType] = useState<'24h' | '48h' | 'indefinite'>('24h');
  const [investmentBudget, setInvestmentBudget] = useState<number>(0);
  const [projectName, setProjectName] = useState<string>('Music Project');
  const [roiPercentage, setRoiPercentage] = useState<number>(20);
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [coverArtPreview, setCoverArtPreview] = useState<string>('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    if (!user) return;

    try {
      // Load admin settings
      const { data: settings } = await supabase
        .from('admin_settings')
        .select('*')
        .eq('admin_id', user.id)
        .single();

      if (settings) {
        setProjectName(settings.project_name || 'Music Project');
        setInvestmentBudget(Number(settings.investment_budget) || 0);
        setRoiPercentage(Number(settings.roi_percentage) || 20);
        if (settings.cover_art_url) {
          setCoverArtPreview(settings.cover_art_url);
        }
      }

      // Load audio files
      const { data: files } = await supabase
        .from('audio_files')
        .select('*')
        .eq('admin_id', user.id)
        .order('created_at', { ascending: true });

      if (files) {
        setAudioFiles(files);
      }

      // Load access keys
      const { data: keys } = await supabase
        .from('access_keys')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (keys) {
        setPasswords(keys as AccessPassword[]);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !user) return;

    const remainingSlots = 5 - audioFiles.length;
    if (remainingSlots <= 0) {
      toast({
        title: 'Upload limit reached',
        description: 'Maximum 5 audio files allowed.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingFiles(true);

    try {
      const filesToUpload = Math.min(files.length, remainingSlots);
      
      for (let i = 0; i < filesToUpload; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('audio-files')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('audio-files')
          .getPublicUrl(fileName);

        // Save to database
        const { error: dbError } = await supabase
          .from('audio_files')
          .insert({
            admin_id: user.id,
            file_name: file.name,
            file_url: publicUrl,
          });

        if (dbError) throw dbError;
      }

      await loadAdminData();

      toast({
        title: 'Files uploaded',
        description: `${filesToUpload} audio file(s) uploaded successfully.`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleCoverArtUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCoverArtFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverArtPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    toast({
      title: 'Cover art selected',
      description: 'Click "Save Project Settings" to upload.',
    });
  };

  const handleSaveProjectSettings = async () => {
    if (!user) return;

    try {
      let coverArtUrl = coverArtPreview;

      // Upload cover art if new file selected
      if (coverArtFile) {
        const fileExt = coverArtFile.name.split('.').pop();
        const fileName = `${user.id}/cover.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('cover-art')
          .upload(fileName, coverArtFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('cover-art')
          .getPublicUrl(fileName);

        coverArtUrl = publicUrl;
      }

      // Upsert admin settings
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          admin_id: user.id,
          project_name: projectName,
          investment_budget: investmentBudget,
          roi_percentage: roiPercentage,
          cover_art_url: coverArtUrl,
        });

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Project settings updated successfully.',
      });

      setCoverArtFile(null);
      await loadAdminData();
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const generatePassword = async () => {
    if (!user) return;

    const keyCode = Math.random().toString(36).substr(2, 8).toUpperCase();
    const now = new Date();
    let expiresAt: Date | null = null;

    if (selectedAccessType === '24h') {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (selectedAccessType === '48h') {
      expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    }

    try {
      const { error } = await supabase
        .from('access_keys')
        .insert({
          key_code: keyCode,
          access_type: selectedAccessType,
          created_by: user.id,
          expires_at: expiresAt?.toISOString(),
        });

      if (error) throw error;

      await loadAdminData();

      toast({
        title: 'Password generated',
        description: `New ${selectedAccessType} access key: ${keyCode}`,
      });
    } catch (error: any) {
      toast({
        title: 'Generation failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const copyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast({
      title: 'Key copied',
      description: 'Access key copied to clipboard.',
    });
  };

  const deleteFile = async (id: string, fileUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/audio-files/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('audio-files').remove([filePath]);
      }

      const { error } = await supabase
        .from('audio_files')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadAdminData();

      toast({
        title: 'File deleted',
        description: 'Audio file removed successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deactivatePassword = async (id: string) => {
    try {
      const { error } = await supabase
        .from('access_keys')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await loadAdminData();

      toast({
        title: 'Key deactivated',
        description: 'Access key has been deactivated.',
      });
    } catch (error: any) {
      toast({
        title: 'Deactivation failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getAccessTypeIcon = (type: string) => {
    switch (type) {
      case '24h': return <Clock className="h-4 w-4" />;
      case '48h': return <Clock className="h-4 w-4" />;
      case 'indefinite': return <Infinity className="h-4 w-4" />;
      default: return <Key className="h-4 w-4" />;
    }
  };

  const getAccessTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case '24h': return 'secondary';
      case '48h': return 'default';
      case 'indefinite': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              Audio Access Admin Panel
            </h1>
            <p className="text-muted-foreground">Manage audio files and user access permissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
              <FileText className="h-4 w-4 mr-2" />
              View Dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Audio File Management */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Audio File Management
              </CardTitle>
              <CardDescription>
                Upload and manage up to 5 audio files ({audioFiles.length}/5 uploaded)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="audio-upload">Upload Audio Files (WAV format)</Label>
                <Input
                  id="audio-upload"
                  type="file"
                  accept=".wav,.mp3"
                  multiple
                  onChange={handleFileUpload}
                  disabled={audioFiles.length >= 5 || uploadingFiles}
                  className="mt-2"
                />
              </div>

              <div className="space-y-3">
                {audioFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{file.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded: {new Date(file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFile(file.id, file.file_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {audioFiles.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No audio files uploaded yet
                  </p>
                )}
              </div>

              {/* Cover Art Upload */}
              <div className="border-t pt-4">
                <Label htmlFor="cover-upload">Project Cover Art</Label>
                <Input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleCoverArtUpload}
                  className="mt-2"
                />
                {coverArtPreview && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <img 
                        src={coverArtPreview} 
                        alt="Cover art preview" 
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">Cover Art</p>
                        <p className="text-sm text-muted-foreground">
                          {coverArtFile ? 'New file selected' : 'Current cover'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Password Generation */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Access Control
              </CardTitle>
              <CardDescription>
                Generate passwords for user access with time-based expiration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="access-type">Access Duration</Label>
                <Select value={selectedAccessType} onValueChange={(value: '24h' | '48h' | 'indefinite') => setSelectedAccessType(value)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select access duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">24 Hours</SelectItem>
                    <SelectItem value="48h">48 Hours</SelectItem>
                    <SelectItem value="indefinite">Indefinite</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={generatePassword} 
                className="w-full" 
                variant="gradient"
                disabled={audioFiles.length === 0}
              >
                Generate Access Password
              </Button>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {passwords.map((pass) => (
                  <div key={pass.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold">{pass.key_code}</span>
                        <Badge variant={getAccessTypeBadgeVariant(pass.access_type)} className="flex items-center gap-1">
                          {getAccessTypeIcon(pass.access_type)}
                          {pass.access_type}
                        </Badge>
                        {!pass.is_active && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(pass.created_at).toLocaleString()}
                        {pass.expires_at && (
                          <span> • Expires: {new Date(pass.expires_at).toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPassword(pass.key_code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {pass.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deactivatePassword(pass.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {passwords.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No access passwords generated yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Settings */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Project Settings</CardTitle>
            <CardDescription>
              Configure project details and investment parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Music Project"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="budget">Investment Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="100"
                  value={investmentBudget}
                  onChange={(e) => setInvestmentBudget(Number(e.target.value))}
                  placeholder="10000"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="roi">Expected ROI (%)</Label>
                <Input
                  id="roi"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={roiPercentage}
                  onChange={(e) => setRoiPercentage(Number(e.target.value))}
                  placeholder="20"
                  className="mt-2"
                />
              </div>
            </div>

            {investmentBudget > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Admin Investment (51%)</p>
                    <p className="font-semibold text-primary">${(investmentBudget * 0.51).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Available for Users (49%)</p>
                    <p className="font-semibold text-success">${(investmentBudget * 0.49).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleSaveProjectSettings}
              className="w-full"
              variant="gradient"
            >
              Save Project Settings
            </Button>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{audioFiles.length}</p>
                <p className="text-sm text-muted-foreground">Audio Files</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{passwords.filter(p => p.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Active Keys</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {passwords.filter(p => p.access_type === 'indefinite' && p.is_active).length}
                </p>
                <p className="text-sm text-muted-foreground">Indefinite Access</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {passwords.filter(p => (p.access_type === '24h' || p.access_type === '48h') && p.is_active).length}
                </p>
                <p className="text-sm text-muted-foreground">Temporary Access</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Tracklist Button */}
        <Card className="shadow-elegant">
          <CardContent className="pt-6">
            <Button 
              onClick={() => navigate('/')}
              className="w-full"
              variant="outline"
              size="lg"
            >
              <Music className="h-5 w-5 mr-2" />
              View Tracklist
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
