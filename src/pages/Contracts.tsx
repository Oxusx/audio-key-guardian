import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Contract {
  id: string;
  investor_email: string;
  admin_email: string;
  project_name: string;
  investment_amount: number;
  roi_percentage: number;
  expected_return: number;
  contract_date: string;
  contract_terms: string;
  investor_signed_at: string | null;
  admin_signed_at: string | null;
}

const Contracts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contracts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadContract = (contract: Contract) => {
    const blob = new Blob([contract.contract_terms], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Investment_Contract_${contract.project_name}_${new Date(contract.contract_date).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          <h1 className="text-3xl font-bold">Investment Contracts</h1>
        </div>

        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading contracts...</p>
          </Card>
        ) : contracts.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No contracts found</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <Card key={contract.id} className="p-6 bg-card/50 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{contract.project_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(contract.contract_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      ${contract.investment_amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-success">
                      +{contract.roi_percentage}% ROI
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Investor</p>
                    <p className="font-medium">{contract.investor_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Return</p>
                    <p className="font-medium">${contract.expected_return.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Investor Signed</p>
                    <p className="font-medium">
                      {contract.investor_signed_at ? '✓ Signed' : '⏳ Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Admin Signed</p>
                    <p className="font-medium">
                      {contract.admin_signed_at ? '✓ Signed' : '⏳ Pending'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedContract(contract)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Contract
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadContract(contract)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedContract && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedContract(null)}
          >
            <Card
              className="max-w-4xl w-full max-h-[80vh] overflow-auto p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Investment Contract</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedContract(null)}>
                  ✕
                </Button>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                {selectedContract.contract_terms}
              </pre>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => downloadContract(selectedContract)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Contract
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contracts;
