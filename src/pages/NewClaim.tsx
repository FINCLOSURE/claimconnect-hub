import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Shield, FileText } from 'lucide-react';

export default function NewClaim() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [deceasedName, setDeceasedName] = useState('');
  const [deceasedIdNumber, setDeceasedIdNumber] = useState('');
  const [relationship, setRelationship] = useState('');
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const relationships = [
    { value: 'spouse', label: 'Spouse' },
    { value: 'child', label: 'Child' },
    { value: 'parent', label: 'Parent' },
    { value: 'sibling', label: 'Sibling' },
    { value: 'executor', label: 'Estate Executor' },
    { value: 'beneficiary', label: 'Named Beneficiary' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deceasedName || !relationship) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
      });
      return;
    }
    setShowConsentModal(true);
  };

  const handleConsentAndCreate = async () => {
    if (!consentChecked) {
      toast({
        variant: 'destructive',
        title: 'Consent Required',
        description: 'Please agree to the terms to continue.',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('claim_sessions')
        .insert({
          claimant_id: user?.id,
          deceased_name: deceasedName,
          deceased_id_number: deceasedIdNumber || null,
          relationship: relationship,
          consent_given: true,
          consent_timestamp: new Date().toISOString(),
          status: 'STARTED',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Claim Created',
        description: 'Your claim session has been started. Please upload required documents.',
      });

      navigate(`/claims/${data.id}/upload`);
    } catch (error) {
      console.error('Error creating claim:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create claim. Please try again.',
      });
    } finally {
      setLoading(false);
      setShowConsentModal(false);
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-2xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <Card className="card-elevated">
          <CardHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl">Start New Claim</CardTitle>
            <CardDescription>
              Provide information about the deceased person to begin the claims process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="deceasedName">Deceased Person's Full Name *</Label>
                <Input
                  id="deceasedName"
                  placeholder="Enter full legal name"
                  value={deceasedName}
                  onChange={(e) => setDeceasedName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deceasedId">ID Number (Optional)</Label>
                <Input
                  id="deceasedId"
                  placeholder="SSN, National ID, or Passport number"
                  value={deceasedIdNumber}
                  onChange={(e) => setDeceasedIdNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Providing an ID helps speed up the asset discovery process.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="relationship">Your Relationship to Deceased *</Label>
                <Select value={relationship} onValueChange={setRelationship} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationships.map((rel) => (
                      <SelectItem key={rel.value} value={rel.value}>
                        {rel.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Continue to Consent
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Consent Modal */}
      <Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <DialogTitle className="text-xl">Consent & Authorization</DialogTitle>
            <DialogDescription>
              Please review and agree to the following terms to proceed with your claim.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground space-y-3">
              <p>By proceeding, I hereby authorize ClaimSecure to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Verify my identity and relationship to the deceased</li>
                <li>Access and verify submitted documents</li>
                <li>Search for assets held in the deceased's name across financial institutions</li>
                <li>Communicate with institutions on my behalf regarding asset claims</li>
                <li>Process and store my personal information securely</li>
              </ul>
              <p className="pt-2">
                I confirm that all information provided is accurate and that I have legal authority 
                to claim assets on behalf of the estate.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consentChecked}
                onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
              />
              <label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                I have read, understood, and agree to the terms above. I understand that providing 
                false information may result in legal consequences.
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsentModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleConsentAndCreate} disabled={!consentChecked || loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Agree & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
