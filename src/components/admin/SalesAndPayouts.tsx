import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Banknote, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Sale {
  id: string;
  product_title: string;
  quantity: number;
  gross_amount: number;
  artist_amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface ConnectStatus {
  connected: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
}

const SalesAndPayouts = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [status, setStatus] = useState<ConnectStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('artist_sales')
      .select('*')
      .order('created_at', { ascending: false });
    setSales((data as Sale[]) || []);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const res = await supabase.functions.invoke('stripe-connect-status');
      if (res.data) setStatus(res.data as ConnectStatus);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const pending = sales.filter(s => s.status === 'pending').reduce((s, x) => s + Number(x.artist_amount), 0);
  const paidOut = sales.filter(s => s.status === 'paid_out').reduce((s, x) => s + Number(x.artist_amount), 0);
  const grossTotal = sales.reduce((s, x) => s + Number(x.gross_amount), 0);
  const currency = sales[0]?.currency || 'USD';

  const handleConnect = async () => {
    setActioning(true);
    try {
      const res = await supabase.functions.invoke('stripe-connect-onboard', {
        body: { return_url: window.location.href },
      });
      if (res.error) throw res.error;
      if (res.data?.url) window.location.href = res.data.url;
    } catch (e: any) {
      toast({ title: 'Connect failed', description: e.message, variant: 'destructive' });
    } finally {
      setActioning(false);
    }
  };

  const handleCashOut = async () => {
    setActioning(true);
    try {
      const res = await supabase.functions.invoke('artist-cashout');
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      toast({ title: 'Cash out sent', description: `$${res.data.amount.toFixed(2)} on the way to your bank.` });
      await load();
    } catch (e: any) {
      toast({ title: 'Cash out failed', description: e.message, variant: 'destructive' });
    } finally {
      setActioning(false);
    }
  };

  const fmt = (n: number) => `$${n.toFixed(2)} ${currency}`;

  return (
    <Card className="shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" /> Sales & Payouts
        </CardTitle>
        <CardDescription>10% platform fee — the rest is yours. Cash out anytime to your bank.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-lg font-bold text-primary">{fmt(pending)}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Paid out</p>
            <p className="text-lg font-bold">{fmt(paidOut)}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Gross sales</p>
            <p className="text-lg font-bold">{fmt(grossTotal)}</p>
          </div>
        </div>

        {/* Connect / Cash out */}
        <div className="flex flex-col sm:flex-row gap-2">
          {!status.connected || !status.details_submitted ? (
            <Button onClick={handleConnect} disabled={actioning} variant="gradient" className="flex-1">
              {actioning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ExternalLink className="h-4 w-4 mr-2" />}
              Connect payout account
            </Button>
          ) : (
            <>
              <Badge variant="secondary" className="self-center">
                ✓ Bank connected {status.payouts_enabled ? '' : '(pending verification)'}
              </Badge>
              <Button
                onClick={handleCashOut}
                disabled={actioning || pending < 1 || !status.payouts_enabled}
                variant="gradient"
                className="flex-1"
              >
                {actioning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Banknote className="h-4 w-4 mr-2" />}
                Cash out {fmt(pending)}
              </Button>
            </>
          )}
        </div>

        {/* Recent sales */}
        <div>
          <p className="text-sm font-medium mb-2">Recent sales</p>
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : sales.length === 0 ? (
            <p className="text-xs text-muted-foreground">No sales yet. They'll appear here as orders come in.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {sales.slice(0, 20).map(s => (
                <div key={s.id} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                  <div>
                    <p className="font-medium">{s.product_title} <span className="text-muted-foreground">×{s.quantity}</span></p>
                    <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{fmt(Number(s.artist_amount))}</p>
                    <Badge variant={s.status === 'paid_out' ? 'secondary' : 'outline'} className="text-xs">
                      {s.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesAndPayouts;
