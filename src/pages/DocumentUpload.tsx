import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/status-badge';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Scan
} from 'lucide-react';

interface UploadedDoc {
  id: string;
  file_name: string;
  document_type: string;
  status: string;
  ocr_data?: any;
}

const documentTypes = [
  { id: 'death_certificate', label: 'Death Certificate', required: true },
  { id: 'claimant_id', label: 'Your ID (Passport/Driver\'s License)', required: true },
  { id: 'proof_of_relationship', label: 'Proof of Relationship', required: true },
  { id: 'deceased_id', label: 'Deceased\'s ID', required: false },
  { id: 'account_statement', label: 'Account Statements (if available)', required: false },
  { id: 'other', label: 'Other Supporting Documents', required: false },
];

export default function DocumentUpload() {
  const { id: claimId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [processingOcr, setProcessingOcr] = useState<string | null>(null);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
      return <Image className="h-5 w-5" />;
    }
    if (ext === 'pdf') {
      return <FileText className="h-5 w-5" />;
    }
    return <File className="h-5 w-5" />;
  };

  const handleFileUpload = async (docType: string, file: File) => {
    if (!user || !claimId) return;

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload JPG, PNG, or PDF files only.',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 10MB.',
      });
      return;
    }

    setUploading(docType);

    try {
      // Upload to storage
      const filePath = `${user.id}/${claimId}/${docType}_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: docData, error: docError } = await supabase
        .from('documents')
        .insert({
          claim_session_id: claimId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          document_type: docType,
          status: 'PENDING',
        })
        .select()
        .single();

      if (docError) throw docError;

      setUploadedDocs(prev => [...prev, docData]);
      
      toast({
        title: 'Document uploaded',
        description: `${file.name} has been uploaded successfully.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'There was an error uploading your document.',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleOcrProcess = async (docId: string) => {
    setProcessingOcr(docId);

    // Simulate OCR processing (mock)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockOcrData = {
      extracted_text: 'Sample extracted text from document...',
      confidence: 0.95,
      fields: {
        name: 'John Doe',
        date: '2024-01-15',
        document_number: 'ABC123456',
      },
    };

    try {
      const { error } = await supabase
        .from('documents')
        .update({
          ocr_data: mockOcrData,
          ocr_processed_at: new Date().toISOString(),
          status: 'OCR_COMPLETE',
        })
        .eq('id', docId);

      if (error) throw error;

      setUploadedDocs(prev => prev.map(doc => 
        doc.id === docId 
          ? { ...doc, status: 'OCR_COMPLETE', ocr_data: mockOcrData }
          : doc
      ));

      toast({
        title: 'OCR Complete',
        description: 'Document text has been extracted successfully.',
      });
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        variant: 'destructive',
        title: 'OCR Failed',
        description: 'Failed to process document. Please try again.',
      });
    } finally {
      setProcessingOcr(null);
    }
  };

  const removeDocument = (docId: string) => {
    setUploadedDocs(prev => prev.filter(doc => doc.id !== docId));
  };

  const requiredDocsUploaded = documentTypes
    .filter(dt => dt.required)
    .every(dt => uploadedDocs.some(ud => ud.document_type === dt.id));

  const progress = Math.round(
    (uploadedDocs.filter(d => documentTypes.find(dt => dt.id === d.document_type)?.required).length / 
    documentTypes.filter(dt => dt.required).length) * 100
  );

  const handleSubmitDocuments = async () => {
    try {
      await supabase
        .from('claim_sessions')
        .update({ status: 'DOCUMENTS_UPLOADED' })
        .eq('id', claimId);

      toast({
        title: 'Documents Submitted',
        description: 'Your documents have been submitted for review.',
      });

      navigate(`/claims/${claimId}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit documents.',
      });
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-4xl py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Progress Card */}
        <Card className="card-elevated mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Document Upload Progress</h2>
                <p className="text-sm text-muted-foreground">
                  {requiredDocsUploaded 
                    ? 'All required documents uploaded!' 
                    : 'Upload all required documents to proceed'}
                </p>
              </div>
              <span className="text-2xl font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Upload Timeline */}
        <div className="space-y-6">
          {documentTypes.map((docType, index) => {
            const uploaded = uploadedDocs.find(d => d.document_type === docType.id);
            const isUploading = uploading === docType.id;
            const isProcessingOcr = processingOcr === uploaded?.id;

            return (
              <Card key={docType.id} className="card-elevated overflow-hidden">
                <div className="flex">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center px-4 py-6">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      uploaded 
                        ? 'border-success bg-success/10 text-success' 
                        : 'border-border bg-background text-muted-foreground'
                    }`}>
                      {uploaded ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    {index < documentTypes.length - 1 && (
                      <div className={`w-0.5 flex-1 mt-2 ${
                        uploaded ? 'bg-success' : 'bg-border'
                      }`} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 py-6 pr-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {docType.label}
                          {docType.required && (
                            <span className="ml-2 text-xs text-destructive">Required</span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Accepted formats: JPG, PNG, PDF (max 10MB)
                        </p>
                      </div>
                      {uploaded && (
                        <StatusBadge 
                          variant={uploaded.status === 'OCR_COMPLETE' ? 'verified' : 'pending'}
                        >
                          {uploaded.status === 'OCR_COMPLETE' ? 'Processed' : 'Pending OCR'}
                        </StatusBadge>
                      )}
                    </div>

                    {uploaded ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-center gap-3">
                            {getFileIcon(uploaded.file_name)}
                            <span className="text-sm font-medium">{uploaded.file_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {uploaded.status === 'PENDING' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOcrProcess(uploaded.id)}
                                disabled={isProcessingOcr}
                              >
                                {isProcessingOcr ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Scan className="h-4 w-4 mr-1" />
                                )}
                                Run OCR
                              </Button>
                            )}
                            <button
                              onClick={() => removeDocument(uploaded.id)}
                              className="p-1 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {uploaded.ocr_data && (
                          <div className="p-3 rounded-lg bg-success/5 border border-success/20">
                            <p className="text-sm font-medium text-success mb-2">OCR Extracted Data:</p>
                            <pre className="text-xs text-muted-foreground overflow-x-auto">
                              {JSON.stringify(uploaded.ocr_data.fields, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <label className="block">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(docType.id, file);
                          }}
                          disabled={isUploading}
                        />
                        <div className={`flex items-center justify-center gap-3 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                          isUploading 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary hover:bg-primary/5'
                        }`}>
                          {isUploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          ) : (
                            <Upload className="h-6 w-6 text-muted-foreground" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="mt-8 flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Save & Continue Later
          </Button>
          <Button 
            onClick={handleSubmitDocuments}
            disabled={!requiredDocsUploaded}
          >
            Submit for Review
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
