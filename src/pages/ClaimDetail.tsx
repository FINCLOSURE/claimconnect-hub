import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  FileText, 
  Search, 
  DollarSign,
  Clock,
  CheckCircle2,
  Building,
  Loader2,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';

interface ClaimSession {
  id: string;
  deceased_name: string;
  relationship: string;
  status: string;
  created_at: string;
  consent_given: boolean;
}

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  status: string;
  uploaded_at: string;
}

interface Asset {
  id: string;
  institution_name: string;
  asset_type: string;
  estimated_value: number;
  currency: string;
  discovered_at: string;
}

export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [claim, setClaim] = useState<ClaimSession | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClaimDetails();
  }, [id]);

  const fetchClaimDetails = async () => {
    try {
      const { data: claimData, error: claimError } = await supabase
        .from('claim_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (claimError) throw claimError;
      setClaim(claimData);

      const { data: docsData } = await supabase
        .from('documents')
        .select('*')
        .eq('claim_session_id', id)
        .order('uploaded_at', { ascending: false });

      setDocuments(docsData || []);

      const { data: assetsData } = await supabase
        .from('assets')
        .select('*')
        .eq('claim_session_id', id)
        .order('discovered_at', { ascending: false });

      setAssets(assetsData || []);
    } catch (error) {
      console.error('Error fetching claim:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load claim details.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'APPROVED':
      case 'OCR_COMPLETE':
        return 'verified';
      case 'REJECTED':
        return 'rejected';
      case 'UNDER_REVIEW':
      case 'PROCESSING':
        return 'processing';
      default:
        return 'pending';
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

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!claim) {
    return (
      <MainLayout>
        <div className="container py-8 text-center">
          <p>Claim not found.</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Claim Header */}
        <Card className="card-elevated mb-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">{claim.deceased_name}</CardTitle>
                <CardDescription>
                  Claim started on {format(new Date(claim.created_at), 'MMMM d, yyyy')}
                </CardDescription>
              </div>
              <StatusBadge variant={getStatusVariant(claim.status)}>
                {claim.status.replace('_', ' ')}
              </StatusBadge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Relationship</p>
                <p className="font-medium capitalize">{claim.relationship}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Documents</p>
                <p className="font-medium">{documents.length} uploaded</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Assets Found</p>
                <p className="font-medium">{assets.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Consent</p>
                <p className="font-medium">{claim.consent_given ? 'Given' : 'Pending'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="documents">
          <TabsList className="mb-6">
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="assets" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <Card className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Uploaded Documents</CardTitle>
                  <CardDescription>All documents submitted for this claim</CardDescription>
                </div>
                <Button onClick={() => navigate(`/claims/${id}/upload`)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload More
                </Button>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No documents uploaded yet</p>
                    <Button 
                      onClick={() => navigate(`/claims/${id}/upload`)} 
                      className="mt-4"
                    >
                      Upload Documents
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            <p className="text-sm text-muted-foreground capitalize">
                              {doc.document_type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <StatusBadge variant={getStatusVariant(doc.status)}>
                          {doc.status.replace('_', ' ')}
                        </StatusBadge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Discovered Assets</CardTitle>
                <CardDescription>Assets found during the discovery process</CardDescription>
              </CardHeader>
              <CardContent>
                {assets.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No assets discovered yet. Asset discovery begins after document verification.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assets.map((asset) => (
                      <Card key={asset.id} className="border">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                                <Building className="h-6 w-6 text-accent" />
                              </div>
                              <div>
                                <h4 className="font-semibold">{asset.institution_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {formatAssetType(asset.asset_type)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Discovered: {format(new Date(asset.discovered_at), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-foreground">
                                {formatCurrency(Number(asset.estimated_value), asset.currency)}
                              </p>
                              <Button size="sm" className="mt-2" onClick={() => navigate(`/assets/${asset.id}/claim`)}>
                                Claim Asset
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Claim Timeline</CardTitle>
                <CardDescription>Track the progress of your claim</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { status: 'STARTED', label: 'Claim Started', date: claim.created_at, completed: true },
                    { status: 'DOCUMENTS_UPLOADED', label: 'Documents Uploaded', completed: ['DOCUMENTS_UPLOADED', 'UNDER_REVIEW', 'VERIFIED', 'APPROVED'].includes(claim.status) },
                    { status: 'UNDER_REVIEW', label: 'Under Review', completed: ['UNDER_REVIEW', 'VERIFIED', 'APPROVED'].includes(claim.status) },
                    { status: 'VERIFIED', label: 'Documents Verified', completed: ['VERIFIED', 'APPROVED'].includes(claim.status) },
                    { status: 'APPROVED', label: 'Claim Approved', completed: claim.status === 'APPROVED' },
                  ].map((step, index) => (
                    <div key={step.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          step.completed 
                            ? 'bg-success text-success-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {step.completed ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                        </div>
                        {index < 4 && (
                          <div className={`w-0.5 h-8 ${step.completed ? 'bg-success' : 'bg-border'}`} />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {step.label}
                        </p>
                        {step.date && step.completed && (
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(step.date), 'MMM d, yyyy h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
