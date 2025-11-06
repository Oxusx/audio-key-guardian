import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Key, Clock, Infinity, Trash2, Copy, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import localforage from 'localforage';

interface AudioFile {
  id: string;
  name: string;
  file: File;
  uploadDate: Date;
}

interface CoverArt {
  id: string;
  name: string;
  file: File;
  uploadDate: Date;
}

interface AccessPassword {
  id: string;
  password: string;
  accessType: '24h' | '48h' | 'indefinite';
  createdAt: Date;
  expiresAt: Date | null;
  isActive: boolean;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [coverArt, setCoverArt] = useState<CoverArt | null>(null);
  const [passwords, setPasswords] = useState<AccessPassword[]>([]);
  const [selectedAccessType, setSelectedAccessType] = useState<'24h' | '48h' | 'indefinite'>('24h');
  const [investmentBudget, setInvestmentBudget] = useState<number>(0);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const remainingSlots = 5 - audioFiles.length;
    const filesToUpload = Math.min(files.length, remainingSlots);
    const filesToAdd = Array.from(files).slice(0, filesToUpload);

    const newFiles: AudioFile[] = filesToAdd.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      file,
      uploadDate: new Date(),
    }));

    setAudioFiles(prev => [...prev, ...newFiles]);
    
    if (files.length > remainingSlots) {
      toast({
        title: "Upload limit reached",
        description: `Only ${filesToUpload} file(s) uploaded. Maximum 5 audio files allowed.`,
        variant: "default",
      });
    } else {
      toast({
        title: "Files uploaded successfully",
        description: `${filesToUpload} audio file(s) added.`,
      });
    }
  };

  const handleCoverArtUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const newCoverArt: CoverArt = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      file,
      uploadDate: new Date(),
    };

    setCoverArt(newCoverArt);
    toast({
      title: "Cover art selected",
      description: "Click 'Save Project Settings' to apply changes.",
    });
  };

  const fileToDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSaveProjectSettings = async () => {
    try {
      const savedItems: string[] = [];

      // Save cover art to IndexedDB (localforage)
      if (coverArt) {
        const coverDataUrl = await fileToDataURL(coverArt.file);
        await localforage.setItem('projectCoverArt', coverDataUrl);
        savedItems.push('cover art');
      }

      // Save audio files to IndexedDB, store only metadata in localStorage
      if (audioFiles.length > 0) {
        const metadata = audioFiles.map((f) => ({ id: f.id, name: f.name }));
        await Promise.all(
          audioFiles.map(async (f) => {
            const dataUrl = await fileToDataURL(f.file);
            await localforage.setItem(`audio:${f.id}`, dataUrl);
          })
        );
        localStorage.setItem('projectAudioFiles', JSON.stringify(metadata));
        savedItems.push('audio files');
      }

      // Save investment budget (small value OK in localStorage)
      if (investmentBudget > 0) {
        localStorage.setItem('projectInvestmentBudget', investmentBudget.toString());
        savedItems.push('investment budget');
      }

      toast({
        title: "✓ Project settings saved",
        description: `Successfully saved: ${savedItems.join(', ')}. Click 'View Tracklist' below to hear your tracks.`,
      });
    } catch (err) {
      console.error('Error saving project settings', err);
      toast({
        title: 'Save failed',
        description: 'Storage is full or blocked. Try saving fewer or smaller files.',
        variant: 'destructive',
      });
    }
  };

  const generatePassword = () => {
    const password = Math.random().toString(36).substr(2, 8).toUpperCase();
    const now = new Date();
    let expiresAt: Date | null = null;

    if (selectedAccessType === '24h') {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (selectedAccessType === '48h') {
      expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    }

    const newPassword: AccessPassword = {
      id: Math.random().toString(36).substr(2, 9),
      password,
      accessType: selectedAccessType,
      createdAt: now,
      expiresAt,
      isActive: true,
    };

    setPasswords(prev => [...prev, newPassword]);
    toast({
      title: "Password generated",
      description: `New ${selectedAccessType} access password: ${password}`,
    });
  };

  const copyPassword = (password: string) => {
    navigator.clipboard.writeText(password);
    toast({
      title: "Password copied",
      description: "Password copied to clipboard.",
    });
  };

  const deleteFile = (id: string) => {
    setAudioFiles(prev => prev.filter(file => file.id !== id));
    toast({
      title: "File deleted",
      description: "Audio file removed successfully.",
    });
  };

  const deactivatePassword = (id: string) => {
    setPasswords(prev => prev.map(p => 
      p.id === id ? { ...p, isActive: false } : p
    ));
    toast({
      title: "Password deactivated",
      description: "Access password has been deactivated.",
    });
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Audio Access Admin Panel
          </h1>
          <p className="text-muted-foreground">Manage audio files and user access permissions</p>
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
                  accept=".wav"
                  multiple
                  onChange={handleFileUpload}
                  disabled={audioFiles.length >= 5}
                  className="mt-2"
                />
              </div>

              <div className="space-y-3">
                {audioFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Uploaded: {file.uploadDate.toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFile(file.id)}
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
                {coverArt && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {coverArt.file && (
                        <img 
                          src={URL.createObjectURL(coverArt.file)} 
                          alt="Cover art preview" 
                          className="w-16 h-16 object-cover rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{coverArt.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Uploaded: {coverArt.uploadDate.toLocaleDateString()}
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
                        <span className="font-mono font-bold">{pass.password}</span>
                        <Badge variant={getAccessTypeBadgeVariant(pass.accessType)} className="flex items-center gap-1">
                          {getAccessTypeIcon(pass.accessType)}
                          {pass.accessType}
                        </Badge>
                        {!pass.isActive && (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created: {pass.createdAt.toLocaleString()}
                        {pass.expiresAt && (
                          <span> • Expires: {pass.expiresAt.toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyPassword(pass.password)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {pass.isActive && (
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

        {/* Investment Budget */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Investment Budget</CardTitle>
            <CardDescription>
              Set the total investment budget for merch sales and live concert ticket sales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="budget">Investment Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="100"
                  value={investmentBudget}
                  onChange={(e) => setInvestmentBudget(Number(e.target.value))}
                  placeholder="Enter total budget"
                  className="mt-2"
                />
              </div>
            </div>
            {investmentBudget > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
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
                <p className="text-2xl font-bold text-primary">{passwords.filter(p => p.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active Passwords</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {passwords.filter(p => p.accessType === 'indefinite' && p.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">Indefinite Access</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {passwords.filter(p => (p.accessType === '24h' || p.accessType === '48h') && p.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">Temporary Access</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Project Settings */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Save Project Settings</CardTitle>
            <CardDescription>
              Save your uploaded files and settings to see them on the user side
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSaveProjectSettings}
              className="w-full"
              variant="gradient"
              disabled={!coverArt && audioFiles.length === 0 && investmentBudget <= 0}
            >
              Save Project Settings
            </Button>
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