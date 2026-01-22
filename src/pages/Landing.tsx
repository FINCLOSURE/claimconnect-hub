import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { 
  Shield, 
  FileText, 
  Search, 
  CheckCircle2, 
  ArrowRight,
  Lock,
  Clock,
  Users
} from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();

  const steps = [
    {
      icon: FileText,
      title: 'Submit Documents',
      description: 'Upload death certificate, ID, and proof of relationship securely.',
    },
    {
      icon: Search,
      title: 'Asset Discovery',
      description: 'We search financial institutions for unclaimed assets.',
    },
    {
      icon: CheckCircle2,
      title: 'Claim & Transfer',
      description: 'Once verified, initiate claims and receive your inheritance.',
    },
  ];

  const features = [
    {
      icon: Lock,
      title: 'Bank-Level Security',
      description: 'Your documents are encrypted and protected with industry-leading security.',
    },
    {
      icon: Clock,
      title: 'Fast Processing',
      description: 'Most claims are verified within 2-5 business days.',
    },
    {
      icon: Users,
      title: 'Expert Support',
      description: 'Our team guides you through every step of the process.',
    },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden hero-gradient py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-30" />
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground mb-6 animate-fade-in">
              Secure Deceased Account Claims Made Simple
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 animate-fade-in">
              Navigate the complex process of claiming assets from deceased accounts with confidence. 
              We handle verification, discovery, and claims—so you can focus on what matters.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              {user ? (
                <Button size="lg" variant="secondary" asChild>
                  <Link to="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" variant="secondary" asChild>
                    <Link to="/auth?mode=signup">
                      Start Your Claim
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                    <Link to="/process">
                      See How It Works
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our streamlined process makes claiming deceased accounts straightforward and stress-free.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <Card key={index} className="card-elevated border-0 bg-card">
                <CardContent className="pt-8 pb-8 text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                    <step.icon className="h-8 w-8 text-accent" />
                  </div>
                  <div className="mb-2 text-sm font-medium text-accent">
                    Step {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-6">
            Ready to Begin?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Create your free account and start the claims process today. 
            Our support team is available 24/7 to help.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to={user ? "/dashboard" : "/auth?mode=signup"}>
              {user ? "Go to Dashboard" : "Create Free Account"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
}
