import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Key, Clock, Infinity, Copy, Trash2, ShoppingBag, Pencil, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AccessKey {
  id: string;
  key_code: string;
  access_type: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  includes_merch?: boolean;
  artist_profile_id?: string | null;
  key_name?: string | null;
}

interface KeyGeneratorWithMerchProps {
  userId: string;
  artistProfileId?: string;
  hasAudioFiles: boolean;
}

const KeyGeneratorWithMerch = ({ userId, artistProfileId, hasAudioFiles }: KeyGeneratorWithMerchProps) => {
  const { toast } = useToast();
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [selectedAccessType, setSelectedAccessType] = useState<'24h' | '48h' | 'indefinite'>('24h');
  const [includesMerch, setIncludesMerch] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');

  useEffect(() => { loadKeys(); }, [userId]);

  const loadKeys = async () => {
    try {
      const { data } = await supabase
        .from('access_keys')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false });
      if (data) setKeys(data as unknown as AccessKey[]);
    } catch (err) {
      console.error('Error loading keys:', err);
    }
  };

  const generateUniqueCode = () => Math.random().toString(36).substr(2, 8).toUpperCase();

  const generateKey = async () => {
    const now = new Date();
    let expiresAt: Date | null = null;
    if (selectedAccessType === '24h') expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    else if (selectedAccessType === '48h') expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    try {
      const customCode = keyName.trim().toUpperCase();
      const useCustom = customCode.length > 0;

      let lastError: any = null;
      const attempts = useCustom ? 1 : 5;
      for (let attempt = 0; attempt < attempts; attempt++) {
        const keyCode = useCustom ? customCode : generateUniqueCode();
        const insertData: any = {
          key_code: keyCode,
          access_type: selectedAccessType,
          created_by: userId,
          expires_at: expiresAt?.toISOString() || null,
          includes_merch: includesMerch,
          key_name: keyName.trim() || null,
        };
        if (artistProfileId) insertData.artist_profile_id = artistProfileId;

        const { error } = await supabase.from('access_keys').insert(insertData);
        if (!error) {
          toast({ title: 'Key generated', description: keyCode });
          setKeyName('');
          await loadKeys();
          return;
        }
        lastError = error;
        if (error.code === '23505') {
          if (useCustom) {
            toast({ title: 'Duplicate', description: 'That key is already in use. Pick another.', variant: 'destructive' });
            return;
          }
          continue;
        }
        break;
      }
      throw lastError || new Error('Could not generate a unique key, please try again.');
    } catch (error: any) {
      toast({ title: 'Generation failed', description: error.message, variant: 'destructive' });
    }
  };

  const startEdit = (k: AccessKey) => {
    setEditingId(k.id);
    setEditName(k.key_name || '');
    setEditCode(k.key_code);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditCode('');
  };

  const saveEdit = async (id: string) => {
    const newCode = editCode.trim().toUpperCase();
    if (!newCode) {
      toast({ title: 'Invalid', description: 'Key code cannot be empty.', variant: 'destructive' });
      return;
    }
    try {
      const { error } = await supabase
        .from('access_keys')
        .update({ key_name: editName.trim() || null, key_code: newCode })
        .eq('id', id);
      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Duplicate', description: 'That key code is already in use. Try another.', variant: 'destructive' });
        } else {
          throw error;
        }
        return;
      }
      toast({ title: 'Key updated' });
      cancelEdit();
      await loadKeys();
    } catch (error: any) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: 'Copied', description: 'Key copied to clipboard.' });
  };

  const deactivateKey = async (id: string) => {
    try {
      const { error } = await supabase.from('access_keys').update({ is_active: false }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Key deactivated' });
      await loadKeys();
    } catch (error: any) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Access Keys
        </CardTitle>
        <CardDescription>Unlock keys for your fans</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Key</Label>
          <Input
            value={keyName}
            onChange={(e) => setKeyName(e.target.value.toUpperCase())}
            placeholder="Type a key or leave blank"
            maxLength={50}
            className="mt-1 font-mono"
          />
        </div>

        <div>
          <Label>Duration</Label>
          <Select value={selectedAccessType} onValueChange={(v: any) => setSelectedAccessType(v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="48h">48 Hours</SelectItem>
              <SelectItem value="indefinite">Indefinite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Include Merch</p>
          </div>
          <Switch checked={includesMerch} onCheckedChange={setIncludesMerch} />
        </div>

        <Button onClick={generateKey} className="w-full" variant="gradient" disabled={!hasAudioFiles}>
          Generate Key
        </Button>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between p-3 bg-muted rounded-lg gap-2">
              <div className="flex-1 min-w-0">
                {editingId === k.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Label (optional)"
                      maxLength={50}
                      className="h-8 text-sm"
                    />
                    <Input
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                      placeholder="Key code"
                      maxLength={20}
                      className="h-8 text-sm font-mono"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      {k.key_name && <span className="text-sm font-semibold">{k.key_name}</span>}
                      <span className="font-mono font-bold text-sm">{k.key_code}</span>
                      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                        {k.access_type === 'indefinite' ? <Infinity className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        {k.access_type}
                      </Badge>
                      {k.includes_merch && (
                        <Badge variant="outline" className="text-xs">
                          <ShoppingBag className="h-3 w-3 mr-1" /> Merch
                        </Badge>
                      )}
                      {!k.is_active && <Badge variant="destructive" className="text-xs">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(k.created_at).toLocaleDateString()}
                      {k.expires_at && ` • Expires: ${new Date(k.expires_at).toLocaleDateString()}`}
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                {editingId === k.id ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => saveEdit(k.id)}><Check className="h-3.5 w-3.5 text-primary" /></Button>
                    <Button variant="ghost" size="sm" onClick={cancelEdit}><X className="h-3.5 w-3.5" /></Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => copyKey(k.key_code)}><Copy className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(k)}><Pencil className="h-3.5 w-3.5" /></Button>
                    {k.is_active && (
                      <Button variant="ghost" size="sm" onClick={() => deactivateKey(k.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {keys.length === 0 && (
            <p className="text-center text-muted-foreground py-6 text-sm">No keys generated yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyGeneratorWithMerch;
