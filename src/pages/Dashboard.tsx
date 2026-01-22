import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  FileText, 
  Search, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

interface ClaimSession {
  id: string;
  deceased_name: string;
  status: string;
  created_at: string;
  relationship: string;
}

interface DashboardStats {
  totalClaims: number;
  pendingReview: number;
  assetsDiscovered: number;
  claimsApproved: number;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [claims, setClaims] = useState<ClaimSession[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalClaims: 0,
    pendingReview: 0,
    assetsDiscovered: 0,
    claimsApproved: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch claims
      const { data: claimsData, error: claimsError } = await supabase
        .from('claim_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (claimsError) throw claimsError;
      
      setClaims(claimsData || []);
      
      // Calculate stats
      const total = claimsData?.length || 0;
      const pending = claimsData?.filter(c => ['STARTED', 'DOCUMENTS_UPLOADED', 'UNDER_REVIEW'].includes(c.status)).length || 0;
      const approved = claimsData?.filter(c => c.status === 'APPROVED').length || 0;
      
      // Fetch assets count
      const { count: assetsCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true });
      
      setStats({
        totalClaims: total,
        pendingReview: pending,
        assetsDiscovered: assetsCount || 0,
        claimsApproved: approved,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load dashboard data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'APPROVED':
        return 'verified';
      case 'REJECTED':
        return 'rejected';
      case 'UNDER_REVIEW':
        return 'processing';
      default:
        return 'pending';
    }
  };

  const statCards = [
    { icon: FileText, label: 'Total Claims', value: stats.totalClaims, color: 'text-primary' },
    { icon: Clock, label: 'Pending Review', value: stats.pendingReview, color: 'text-warning' },
    { icon: Search, label: 'Assets Discovered', value: stats.assetsDiscovered, color: 'text-accent' },
    { icon: CheckCircle2, label: 'Claims Approved', value: stats.claimsApproved, color: 'text-success' },
  ];

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Manage your deceased account claims</p>
          </div>
          <Button onClick={() => navigate('/claims/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Claim
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index} className="card-elevated">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Claims */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle>Recent Claims</CardTitle>
            <CardDescription>Your active and recent claim sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {claims.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No claims yet</h3>
                <p className="text-muted-foreground mb-6">Start your first claim to begin the process</p>
                <Button onClick={() => navigate('/claims/new')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Start New Claim
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim) => (
                  <div
                    key={claim.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/claims/${claim.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{claim.deceased_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {claim.relationship} • {format(new Date(claim.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge variant={getStatusVariant(claim.status)}>
                        {claim.status.replace('_', ' ')}
                      </StatusBadge>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
