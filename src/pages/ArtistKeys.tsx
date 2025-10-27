import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus, Key, Trash2, Music } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ArtistKey {
  id: string;
  artistName: string;
  accessKey: string;
  addedAt: string;
}

const ArtistKeys = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [artistName, setArtistName] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [artistKeys, setArtistKeys] = useState<ArtistKey[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadArtistKeys();
  }, []);

  const loadArtistKeys = () => {
    const stored = localStorage.getItem('artistKeys');
    if (stored) {
      setArtistKeys(JSON.parse(stored));
    }
  };

  const saveArtistKeys = (keys: ArtistKey[]) => {
    localStorage.setItem('artistKeys', JSON.stringify(keys));
    setArtistKeys(keys);
  };

  const handleAddKey = () => {
    if (!artistName.trim() || !accessKey.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both artist name and access key',
        variant: 'destructive',
      });
      return;
    }

    // Check if key already exists
    if (artistKeys.some(k => k.accessKey === accessKey.trim())) {
      toast({
        title: 'Duplicate Key',
        description: 'This access key has already been added',
        variant: 'destructive',
      });
      return;
    }

    const newKey: ArtistKey = {
      id: Math.random().toString(36).substring(7),
      artistName: artistName.trim(),
      accessKey: accessKey.trim(),
      addedAt: new Date().toISOString(),
    };

    const updatedKeys = [...artistKeys, newKey];
    saveArtistKeys(updatedKeys);

    toast({
      title: 'Access Key Added',
      description: `You can now access content from ${artistName}`,
    });

    setArtistName('');
    setAccessKey('');
    setShowAddForm(false);
  };

  const handleRemoveKey = (id: string) => {
    const updatedKeys = artistKeys.filter(k => k.id !== id);
    saveArtistKeys(updatedKeys);
    
    toast({
      title: 'Access Key Removed',
      description: 'The artist key has been removed',
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Artist Access Keys</h1>
        </div>

        <Card className="p-6 mb-6 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start gap-4 mb-4">
            <Music className="h-8 w-8 text-primary shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Access Multiple Artists</h2>
              <p className="text-muted-foreground text-sm">
                Add access keys from different artists and admins to unlock their exclusive content. 
                Each key gives you access to a specific artist's music, projects, and investment opportunities.
              </p>
            </div>
          </div>
        </Card>

        {!showAddForm ? (
          <Button
            onClick={() => setShowAddForm(true)}
            variant="gradient"
            size="lg"
            className="w-full mb-6"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Artist Key
          </Button>
        ) : (
          <Card className="p-6 mb-6 bg-card/50 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-4">Add Artist Access Key</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Artist Name
                </label>
                <Input
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Enter artist or admin name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Access Key
                </label>
                <Input
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="Enter your access key"
                  type="password"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Get this key from the artist or admin
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddKey} variant="gradient" className="flex-1">
                  Add Key
                </Button>
                <Button
                  onClick={() => {
                    setShowAddForm(false);
                    setArtistName('');
                    setAccessKey('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Your Artist Keys ({artistKeys.length})</h3>
          
          {artistKeys.length === 0 ? (
            <Card className="p-8 text-center bg-card/50 backdrop-blur-sm">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No artist keys added yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first key to start accessing exclusive artist content
              </p>
            </Card>
          ) : (
            artistKeys.map((key) => (
              <Card key={key.id} className="p-4 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Music className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{key.artistName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Key: {key.accessKey.substring(0, 4)}...{key.accessKey.substring(key.accessKey.length - 4)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(key.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveKey(key.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        <Card className="p-4 mt-6 bg-muted/50">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Each artist or admin will provide you with a unique access key. 
            Keep these keys secure and don't share them with others.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ArtistKeys;
