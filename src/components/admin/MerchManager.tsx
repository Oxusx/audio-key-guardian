import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Plus, Trash2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MerchItem {
  id?: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  external_link: string;
  is_available: boolean;
}

interface MerchManagerProps {
  artistProfileId: string;
}

const MerchManager = ({ artistProfileId }: MerchManagerProps) => {
  const { toast } = useToast();
  const [items, setItems] = useState<MerchItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState<MerchItem>({
    name: '', description: '', price: 0, image_url: '', external_link: '', is_available: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadMerch(); }, [artistProfileId]);

  const loadMerch = async () => {
    try {
      const { data } = await (supabase as any)
        .from('merch_items')
        .select('*')
        .eq('artist_id', artistProfileId)
        .order('created_at', { ascending: true });
      if (data) setItems(data);
    } catch (err) {
      console.error('Error loading merch:', err);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let imageUrl = newItem.image_url;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `merch/${artistProfileId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('cover-art').upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('cover-art').getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
      const { error } = await (supabase as any).from('merch_items').insert({
        artist_id: artistProfileId,
        name: newItem.name.trim(),
        description: newItem.description.trim(),
        price: newItem.price,
        image_url: imageUrl || null,
        external_link: newItem.external_link.trim() || null,
        is_available: true,
      });
      if (error) throw error;
      toast({ title: 'Merch added', description: `${newItem.name} has been added.` });
      setNewItem({ name: '', description: '', price: 0, image_url: '', external_link: '', is_available: true });
      setImageFile(null);
      setShowAddForm(false);
      await loadMerch();
    } catch (error: any) {
      toast({ title: 'Failed to add', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase as any).from('merch_items').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Merch removed' });
      await loadMerch();
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Merch Store
        </CardTitle>
        <CardDescription>Add merchandise items to your artist page ({items.length} items)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showAddForm ? (
          <Button onClick={() => setShowAddForm(true)} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add Merch Item
          </Button>
        ) : (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Item Name</Label>
                <Input value={newItem.name} onChange={(e) => setNewItem(i => ({ ...i, name: e.target.value }))} placeholder="T-Shirt, Poster, etc." className="mt-1" />
              </div>
              <div>
                <Label>Price ($)</Label>
                <Input type="number" min="0" step="0.01" value={newItem.price} onChange={(e) => setNewItem(i => ({ ...i, price: Number(e.target.value) }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newItem.description} onChange={(e) => setNewItem(i => ({ ...i, description: e.target.value }))} placeholder="Describe the item..." className="mt-1" rows={2} />
            </div>
            <div>
              <Label>Item Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="mt-1" />
            </div>
            <div>
              <Label>Purchase Link (optional)</Label>
              <Input value={newItem.external_link} onChange={(e) => setNewItem(i => ({ ...i, external_link: e.target.value }))} placeholder="https://your-store.com/item" className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddItem} variant="gradient" className="flex-1" disabled={saving}>
                {saving ? 'Adding...' : 'Add Item'}
              </Button>
              <Button onClick={() => { setShowAddForm(false); setImageFile(null); }} variant="outline">Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {item.image_url && (
                <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{item.name}</p>
                  <Badge variant="secondary">${Number(item.price).toFixed(2)}</Badge>
                </div>
                {item.description && <p className="text-xs text-muted-foreground truncate">{item.description}</p>}
                {item.external_link && (
                  <a href={item.external_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" /> Purchase link
                  </a>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => item.id && handleDelete(item.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-center text-muted-foreground py-6 text-sm">No merch items yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MerchManager;
