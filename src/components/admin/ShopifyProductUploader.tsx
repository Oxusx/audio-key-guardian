import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  userId: string;
  username?: string;
}

const ShopifyProductUploader: React.FC<Props> = ({ userId, username }) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [productType, setProductType] = useState('Apparel');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async () => {
    if (!title || !price) {
      toast({ title: 'Missing fields', description: 'Title and price are required', variant: 'destructive' });
      return;
    }
    if (!username) {
      toast({ title: 'Set your username first', description: 'Save your artist profile before adding products', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from('merch-images').upload(path, imageFile);
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from('merch-images').getPublicUrl(path).data.publicUrl;
      }

      const { data, error } = await supabase.functions.invoke('create-artist-product', {
        body: { title, description, price: Number(price), imageUrl, productType },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast({ title: 'Product live!', description: `${title} is now on your /${username} page` });
      setTitle(''); setDescription(''); setPrice(''); setImageFile(null); setImagePreview('');
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" /> Add Merch Product
        </CardTitle>
        <CardDescription>
          {username ? <>Products auto-appear on <span className="font-mono">/{username}</span> and sell through secure checkout.</> : 'Save your artist profile first to get a username.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Product Name *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tour Tee 2026" className="mt-1" />
          </div>
          <div>
            <Label>Price (USD) *</Label>
            <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="35.00" className="mt-1" />
          </div>
        </div>
        <div>
          <Label>Type</Label>
          <Input value={productType} onChange={(e) => setProductType(e.target.value)} placeholder="Apparel / Vinyl / Poster" className="mt-1" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1" />
        </div>
        <div>
          <Label>Product Image</Label>
          <Input type="file" accept="image/*" onChange={onImageChange} className="mt-1" />
          {imagePreview && <img src={imagePreview} alt="preview" className="w-24 h-24 mt-2 rounded object-cover" />}
        </div>
        <Button onClick={handleSubmit} disabled={submitting || !username} variant="gradient" className="w-full">
          {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publishing…</> : 'Publish Product'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ShopifyProductUploader;
