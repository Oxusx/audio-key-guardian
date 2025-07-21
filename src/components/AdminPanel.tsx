import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Key, Clock, Infinity, Trash2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioFile {
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
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [passwords, setPasswords] = useState<AccessPassword[]>([]);
  const [selectedAccessType, setSelectedAccessType] = useState<'24h' | '48h' | 'indefinite'>('24h');
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    if (audioFiles.length + files.length > 5) {
      toast({
        title: "Upload limit exceeded",
        description: "You can only upload up to 5 audio files.",
        variant: "destructive",
      });
      return;
    }

    const newFiles: AudioFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      file,
      uploadDate: new Date(),
    }));

    setAudioFiles(prev => [...prev, ...newFiles]);
    toast({
      title: "Files uploaded successfully",
      description: `${files.length} audio file(s) added.`,
    });
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
      </div>
    </div>
  );
};

export default AdminPanel;