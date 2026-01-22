import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Building, 
  DollarSign, 
  Upload,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';

interface Asset {
  id: string;
  institution_name: string;
  asset_type: string;
  account_number: string;
  estimated_value: number;
  currency: string;
  discovered_at: string;
  details: any;
}

interface AssetClaim {
  id: string;
  status: string;
  claimed_at: string;
  receipt_storage_path: string;
}

export default function AssetClaim() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [claim, setClaim] = useState<AssetClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  const fetchAssetDetails = async () => {
    try {
      const { data: assetData, error: assetError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();

      if (assetError) throw assetError;
      setAsset(assetData);

      // Check for existing claim
      const { data: claimData } = await supabase
        .from('asset_claims')
        .select('*')
        .eq('asset_id', id)
        .eq('claimant_id', user?.id)
        .single();

      if (claimData) {
        setClaim(claimData);
      }
    } catch (error) {
      console.error('Error fetching asset:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load asset details.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateClaim = async () => {
    if (!user || !asset) return;

    setClaiming(true);

    try {
      const { data, error } = await supabase
        .from('asset_claims')
        .insert({
          asset_id: asset.id,
          claimant_id: user.id,
          status: 'CLAIMED',
          claimed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setClaim(data);
      toast({
        title: 'Claim Initiated',
        description: 'Your claim has been submitted for processing.',
      });
    } catch (error) {
      console.error('Error initiating claim:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to initiate claim.',
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleReceiptUpload = async (file: File) => {
    if (!user || !claim) return;

    setUploading(true);

    try {
      const filePath = `${user.id}/receipts/${claim.id}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('asset_claims')
        .update({
          receipt_storage_path: filePath,
          status: 'PROCESSING',
        })
        .eq('id', claim.id);

      if (updateError) throw updateError;

      setClaim({ ...claim, receipt_storage_path: filePath, status: 'PROCESSING' });
      toast({
        title: 'Receipt Uploaded',
        description: 'Your payment receipt has been submitted.',
      });
    } catch (error) {
      console.error('Error uploading receipt:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to upload receipt.',
      });
    } finally {
      setUploading(false);
    }
  };

  const formatAssetType = (type: string) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'TRANSFERRED':
        return 'verified';
      case 'REJECTED':
        return 'rejected';
      case 'PROCESSING':
        return 'processing';
      default:
        return 'pending';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!asset) {
    return (
      <MainLayout>
        <div className="container py-8 text-center">
          <p>Asset not found.</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-2xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                <Building className="h-7 w-7 text-accent" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">{asset.institution_name}</CardTitle>
                <CardDescription>{formatAssetType(asset.asset_type)}</CardDescription>
              </div>
              {claim && (
                <StatusBadge variant={getStatusVariant(claim.status)}>
                  {claim.status}
                </StatusBadge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Asset Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Estimated Value</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(Number(asset.estimated_value), asset.currency)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Account Number</p>
                <p className="font-medium">{asset.account_number || 'Not available'}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Discovered On</p>
                <p className="font-medium">
                  {format(new Date(asset.discovered_at), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-medium">{asset.currency}</p>
              </div>
            </div>

            {/* Claim Actions */}
            {!claim ? (
              <div className="border-t border-border pt-6">
                <h3 className="font-semibold mb-4">Initiate Asset Claim</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  By initiating this claim, you confirm that you are legally entitled to 
                  claim this asset on behalf of the estate. Our team will coordinate with 
                  the institution to process the transfer.
                </p>
                <Button onClick={handleInitiateClaim} disabled={claiming} className="w-full">
                  {claiming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <DollarSign className="mr-2 h-4 w-4" />
                  Initiate Claim
                </Button>
              </div>
            ) : claim.status === 'CLAIMED' && asset.asset_type === 'LOAN' ? (
              <div className="border-t border-border pt-6">
                <h3 className="font-semibold mb-4">Upload Payment Receipt</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  If you have settled this loan, please upload the payment receipt for verification.
                </p>
                <label className="block">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleReceiptUpload(file);
                    }}
                    disabled={uploading}
                  />
                  <div className={`flex items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                    uploading 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary hover:bg-primary/5'
                  }`}>
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {uploading ? 'Uploading...' : 'Click to upload receipt'}
                    </span>
                  </div>
                </label>
              </div>
            ) : (
              <div className="border-t border-border pt-6">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <div>
                    <p className="font-medium text-success">Claim Submitted</p>
                    <p className="text-sm text-muted-foreground">
                      Your claim is being processed. Status: {claim.status}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
