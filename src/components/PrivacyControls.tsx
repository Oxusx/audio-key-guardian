import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Download, Trash2, Shield } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export const PrivacyControls = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleExportData = async () => {
    if (!user?.email) {
      toast.error('Please log in to export your data');
      return;
    }

    setLoading(true);
    try {
      // Fetch all user data
      const [investments, activities, consents] = await Promise.all([
        supabase.from('investments').select('*').eq('user_email', user.email),
        supabase.from('activity_logs').select('*').eq('user_email', user.email),
        supabase.from('user_consents').select('*').eq('user_email', user.email),
      ]);

      const userData = {
        user: { email: user.email, id: user.id },
        investments: investments.data,
        activities: activities.data,
        consents: consents.data,
        exported_at: new Date().toISOString(),
      };

      // Create download
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Your data has been exported');
    } catch (error) {
      toast.error('Failed to export data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!user?.email) {
      toast.error('Please log in to request data deletion');
      return;
    }

    setLoading(true);
    try {
      await supabase.from('data_deletion_requests').insert({
        user_email: user.email,
        user_id: user.id,
        request_type: 'full_account_deletion',
        status: 'pending',
      });

      toast.success('Deletion request submitted. An admin will process it shortly.');
    } catch (error) {
      toast.error('Failed to submit deletion request');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Privacy Controls</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </CardTitle>
          <CardDescription>
            Download a copy of all your data including investments, activity logs, and consent history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportData} disabled={loading}>
            {loading ? 'Exporting...' : 'Export Data'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Your Data
          </CardTitle>
          <CardDescription>
            Request permanent deletion of your account and all associated data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={loading}>
                Request Data Deletion
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will submit a request to permanently delete your account and all associated data. 
                  An administrator will review and process your request. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRequestDeletion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Submit Deletion Request
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};
