import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  UserPlus, 
  FileText, 
  Shield, 
  Upload, 
  Scan, 
  CheckCircle2, 
  Search, 
  DollarSign, 
  Award
} from 'lucide-react';

export default function ProcessFlow() {
  return (
    <MainLayout>
      <div className="container py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Claims Process Flowchart
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Understanding the complete journey from registration to successful asset claim.
          </p>
        </div>

        {/* Mermaid-style Flowchart using CSS */}
        <Card className="card-elevated mb-12 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-4">
              {/* Registration Phase */}
              <FlowNode icon={UserPlus} title="User Registration" description="Create account & verify email" color="primary" />
              <FlowArrow />
              
              {/* Claim Start */}
              <FlowNode icon={FileText} title="Start New Claim" description="Enter deceased person details" color="primary" />
              <FlowArrow />
              
              {/* Consent */}
              <FlowNode icon={Shield} title="Consent & Authorization" description="Agree to terms & grant permissions" color="primary" />
              <FlowArrow />
              
              {/* Document Upload */}
              <FlowNode icon={Upload} title="Document Upload" description="Upload death certificate, ID, proof of relationship" color="accent" />
              <FlowArrow />
              
              {/* OCR Processing */}
              <FlowNode icon={Scan} title="OCR Processing" description="Automatic text extraction from documents" color="accent" />
              <FlowArrow />
              
              {/* Admin Review - Decision Point */}
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center">
                  <FlowNode icon={CheckCircle2} title="Admin Verification" description="Manual review & approval" color="warning" />
                </div>
              </div>
              
              {/* Decision Branch */}
              <div className="flex items-center gap-16">
                <div className="flex flex-col items-center">
                  <FlowArrow label="Approved" />
                  <FlowNode icon={Search} title="Asset Discovery" description="Search institutions for assets" color="success" />
                </div>
                <div className="flex flex-col items-center opacity-50">
                  <FlowArrow label="Rejected" />
                  <FlowNode icon={FileText} title="Re-submit" description="Provide additional documents" color="destructive" />
                </div>
              </div>
              
              <FlowArrow />
              
              {/* Asset Claim */}
              <FlowNode icon={DollarSign} title="Claim Assets" description="Initiate claims for discovered assets" color="success" />
              <FlowArrow />
              
              {/* Completion */}
              <FlowNode icon={Award} title="Asset Transfer" description="Receive inheritance" color="success" />
            </div>
          </CardContent>
        </Card>

        {/* Detailed Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StepCard
            number={1}
            title="Registration"
            description="Create an account with your email and password. Verify your email to access the platform."
            items={['Email verification', 'Secure password', 'Profile setup']}
          />
          <StepCard
            number={2}
            title="Start Claim"
            description="Provide information about the deceased person and your relationship to them."
            items={['Deceased name & ID', 'Your relationship', 'Consent agreement']}
          />
          <StepCard
            number={3}
            title="Document Upload"
            description="Upload required documents in JPG, PNG, or PDF format."
            items={['Death certificate', 'Your ID document', 'Proof of relationship']}
          />
          <StepCard
            number={4}
            title="OCR & Review"
            description="Our system extracts text from documents, then reviewers verify authenticity."
            items={['Automatic OCR', 'Manual verification', 'Feedback if needed']}
          />
          <StepCard
            number={5}
            title="Asset Discovery"
            description="We search financial institutions for assets in the deceased's name."
            items={['Bank accounts', 'Investments', 'Insurance policies']}
          />
          <StepCard
            number={6}
            title="Claim & Transfer"
            description="Once verified, claim discovered assets and coordinate transfer."
            items={['Initiate claims', 'Provide receipts', 'Receive funds']}
          />
        </div>
      </div>
    </MainLayout>
  );
}

function FlowNode({ 
  icon: Icon, 
  title, 
  description, 
  color 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  color: 'primary' | 'accent' | 'success' | 'warning' | 'destructive';
}) {
  const colorClasses = {
    primary: 'bg-primary text-primary-foreground border-primary',
    accent: 'bg-accent text-accent-foreground border-accent',
    success: 'bg-success text-success-foreground border-success',
    warning: 'bg-warning text-warning-foreground border-warning',
    destructive: 'bg-destructive text-destructive-foreground border-destructive',
  };

  return (
    <div className={`flex items-center gap-4 px-6 py-4 rounded-xl border-2 ${colorClasses[color]} min-w-[280px]`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center">
      {label && <span className="text-xs text-muted-foreground mb-1">{label}</span>}
      <div className="w-0.5 h-8 bg-border" />
      <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-border" />
    </div>
  );
}

function StepCard({ 
  number, 
  title, 
  description, 
  items 
}: { 
  number: number; 
  title: string; 
  description: string; 
  items: string[];
}) {
  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
            {number}
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
