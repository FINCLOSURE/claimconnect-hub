import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Users, 
  Search, 
  CheckCircle2, 
  XCircle,
  Clock,
  Loader2,
  Eye,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';

interface PendingDocument {
  id: string;
  file_name: string;
  document_type: string;
  status: string;
  uploaded_at: string;
  claim_sessions: {
    deceased_name: string;
    claimant_id: string;
  };
}

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  details: any;
  user_id: string;
}

export default function AdminConsole() {
  const { user, hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [pendingDocs, setPendingDocs] = useState<PendingDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingDoc, setProcessingDoc] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !hasRole('ADMIN')) {
        navigate('/dashboard');
        return;
      }
      fetchAdminData();
    }
  }, [user, authLoading, hasRole]);

  const fetchAdminData = async () => {
    try {
      // Fetch pending documents
      const { data: docsData, error: docsError } = await supabase
        .from('documents')
        .select(`
          *,
          claim_sessions (
            deceased_name,
            claimant_id
          )
        `)
        .in('status', ['PENDING', 'OCR_COMPLETE'])
        .order('uploaded_at', { ascending: false });

      if (docsError) throw docsError;
      setPendingDocs(docsData || []);

      // Fetch audit logs
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;
      setAuditLogs(logsData || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load admin data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDocument = async (docId: string, approved: boolean) => {
    setProcessingDoc(docId);

    try {
      const { error } = await supabase
        .from('documents')
        .update({
          status: approved ? 'VERIFIED' : 'REJECTED',
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          rejection_reason: approved ? null : 'Document did not meet verification criteria',
        })
        .eq('id', docId);

      if (error) throw error;

      // Log the action
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: approved ? 'VERIFY' : 'REJECT',
        entity_type: 'document',
        entity_id: docId,
        details: { approved },
      });

      toast({
        title: approved ? 'Document Verified' : 'Document Rejected',
        description: `The document has been ${approved ? 'verified' : 'rejected'}.`,
      });

      fetchAdminData();
    } catch (error) {
      console.error('Error verifying document:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update document status.',
      });
    } finally {
      setProcessingDoc(null);
    }
  };

  const stats = {
    pendingReview: pendingDocs.length,
    verifiedToday: 0,
    totalClaims: 0,
  };

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Admin Console</h1>
          <p className="text-muted-foreground">Manage claims, verify documents, and view audit logs</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/10 text-warning">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingReview}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.verifiedToday}</p>
                  <p className="text-sm text-muted-foreground">Verified Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalClaims}</p>
                  <p className="text-sm text-muted-foreground">Total Claims</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="verification">
          <TabsList className="mb-6">
            <TabsTrigger value="verification" className="gap-2">
              <FileText className="h-4 w-4" />
              Document Verification
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Activity className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verification">
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pending Documents</CardTitle>
                    <CardDescription>Review and verify submitted documents</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {pendingDocs.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
                    <p className="text-muted-foreground">All documents have been reviewed!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingDocs
                      .filter(doc => 
                        doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        doc.claim_sessions.deceased_name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{doc.file_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {doc.claim_sessions.deceased_name} • {doc.document_type.replace('_', ' ')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Uploaded: {format(new Date(doc.uploaded_at), 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge variant={doc.status === 'OCR_COMPLETE' ? 'processing' : 'pending'}>
                              {doc.status.replace('_', ' ')}
                            </StatusBadge>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processingDoc === doc.id}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-success border-success hover:bg-success/10"
                              onClick={() => handleVerifyDocument(doc.id, true)}
                              disabled={processingDoc === doc.id}
                            >
                              {processingDoc === doc.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                              )}
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => handleVerifyDocument(doc.id, false)}
                              disabled={processingDoc === doc.id}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <CardDescription>Complete activity history</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No audit logs yet</p>
                ) : (
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Activity className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {log.action} on {log.entity_type}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                        <StatusBadge variant="default">
                          {log.action}
                        </StatusBadge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
