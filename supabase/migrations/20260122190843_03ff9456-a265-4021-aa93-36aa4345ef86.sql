-- Create enums for roles and statuses
CREATE TYPE public.app_role AS ENUM ('CLAIMANT', 'ADMIN', 'REVIEWER');
CREATE TYPE public.claim_status AS ENUM ('STARTED', 'DOCUMENTS_UPLOADED', 'UNDER_REVIEW', 'VERIFIED', 'APPROVED', 'REJECTED');
CREATE TYPE public.document_status AS ENUM ('PENDING', 'OCR_COMPLETE', 'VERIFIED', 'REJECTED');
CREATE TYPE public.asset_type AS ENUM ('BANK_ACCOUNT', 'INVESTMENT', 'INSURANCE', 'PROPERTY', 'LOAN', 'OTHER');
CREATE TYPE public.asset_claim_status AS ENUM ('DISCOVERED', 'CLAIMED', 'PROCESSING', 'TRANSFERRED', 'REJECTED');
CREATE TYPE public.audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'VERIFY', 'APPROVE', 'REJECT', 'UPLOAD', 'LOGIN', 'LOGOUT');

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'CLAIMANT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create claim_sessions table
CREATE TABLE public.claim_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claimant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deceased_name TEXT NOT NULL,
  deceased_id_number TEXT,
  relationship TEXT NOT NULL,
  status claim_status NOT NULL DEFAULT 'STARTED',
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_timestamp TIMESTAMPTZ,
  assigned_reviewer_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_session_id UUID REFERENCES public.claim_sessions(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  document_type TEXT NOT NULL, -- death_certificate, id_document, proof_of_relationship, etc.
  status document_status NOT NULL DEFAULT 'PENDING',
  ocr_data JSONB,
  ocr_processed_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create assets table
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_session_id UUID REFERENCES public.claim_sessions(id) ON DELETE CASCADE NOT NULL,
  institution_name TEXT NOT NULL,
  asset_type asset_type NOT NULL,
  account_number TEXT,
  estimated_value DECIMAL(15,2),
  currency TEXT DEFAULT 'USD',
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  details JSONB
);

-- Create asset_claims table
CREATE TABLE public.asset_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE NOT NULL,
  claimant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status asset_claim_status NOT NULL DEFAULT 'DISCOVERED',
  receipt_storage_path TEXT,
  processing_notes TEXT,
  claimed_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action audit_action NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  claim_session_id UUID REFERENCES public.claim_sessions(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_claim_sessions_updated_at BEFORE UPDATE ON public.claim_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_asset_claims_updated_at BEFORE UPDATE ON public.asset_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'ADMIN'));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));

-- Claim sessions policies
CREATE POLICY "Claimants can view their own sessions" ON public.claim_sessions FOR SELECT USING (auth.uid() = claimant_id);
CREATE POLICY "Claimants can create sessions" ON public.claim_sessions FOR INSERT WITH CHECK (auth.uid() = claimant_id);
CREATE POLICY "Claimants can update their own sessions" ON public.claim_sessions FOR UPDATE USING (auth.uid() = claimant_id);
CREATE POLICY "Admins and reviewers can view all sessions" ON public.claim_sessions FOR SELECT USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'REVIEWER'));
CREATE POLICY "Admins and reviewers can update sessions" ON public.claim_sessions FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'REVIEWER'));

-- Documents policies
CREATE POLICY "Users can view documents for their sessions" ON public.documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.claim_sessions WHERE id = claim_session_id AND claimant_id = auth.uid())
);
CREATE POLICY "Users can upload documents to their sessions" ON public.documents FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.claim_sessions WHERE id = claim_session_id AND claimant_id = auth.uid())
);
CREATE POLICY "Admins and reviewers can view all documents" ON public.documents FOR SELECT USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'REVIEWER'));
CREATE POLICY "Admins and reviewers can update documents" ON public.documents FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'REVIEWER'));

-- Assets policies
CREATE POLICY "Users can view assets for their sessions" ON public.assets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.claim_sessions WHERE id = claim_session_id AND claimant_id = auth.uid())
);
CREATE POLICY "Admins and reviewers can manage assets" ON public.assets FOR ALL USING (public.has_role(auth.uid(), 'ADMIN') OR public.has_role(auth.uid(), 'REVIEWER'));

-- Asset claims policies
CREATE POLICY "Users can view their own claims" ON public.asset_claims FOR SELECT USING (auth.uid() = claimant_id);
CREATE POLICY "Users can create claims" ON public.asset_claims FOR INSERT WITH CHECK (auth.uid() = claimant_id);
CREATE POLICY "Users can update their own claims" ON public.asset_claims FOR UPDATE USING (auth.uid() = claimant_id);
CREATE POLICY "Admins can manage all claims" ON public.asset_claims FOR ALL USING (public.has_role(auth.uid(), 'ADMIN'));

-- Audit logs policies
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs FOR SELECT USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Support tickets policies
CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (public.has_role(auth.uid(), 'ADMIN'));
CREATE POLICY "Admins can update tickets" ON public.support_tickets FOR UPDATE USING (public.has_role(auth.uid(), 'ADMIN'));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'CLAIMANT');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can view their own documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Admins can view all documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'documents' AND public.has_role(auth.uid(), 'ADMIN')
);
CREATE POLICY "Reviewers can view all documents" ON storage.objects FOR SELECT USING (
  bucket_id = 'documents' AND public.has_role(auth.uid(), 'REVIEWER')
);