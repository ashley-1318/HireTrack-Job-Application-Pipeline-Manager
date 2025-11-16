import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PublicNavbar } from "@/components/public/PublicNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, CheckCircle2, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Apply = () => {
  const { id } = useParams();
  const [job, setJob] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    fetch(`/api/jobs/${id}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        return r.json();
      })
      .then((data) => {
        if (!active) return;
        setJob(data);
        setError(null);
      })
      .catch((e) => {
        if (!active) return;
        setError(String(e?.message || e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    coverNote: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      toast({
        title: "Resume is required",
        description: "Please upload your resume (PDF, DOC, DOCX up to 5MB).",
        variant: "destructive",
      });
      fileInputRef.current?.focus();
      return;
    }

    try {
      const base = (import.meta.env.VITE_FUNCTION_URL || '').replace(/\/$/, '');
      
      toast({ title: "Submitting application...", description: "Please wait" });
      
      // Send file directly to backend as multipart/form-data
      // Backend will handle upload and ATS scoring
      const submitFormData = new FormData();
      submitFormData.append("name", formData.name);
      submitFormData.append("email", formData.email);
      submitFormData.append("phone", formData.phone);
      submitFormData.append("coverNote", formData.coverNote);
      submitFormData.append("jobId", job?.id || "");
      submitFormData.append("resume", resumeFile);
      
      const response = await fetch(`${base}/api/apply`, {
        method: "POST",
        body: submitFormData,
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${response.status})`);
      }
      
      setSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "We've received your application and will be in touch soon.",
      });
    } catch (err: any) {
      const msg = String(err?.message || err);
      toast({ title: "Upload failed", description: msg, variant: "destructive" });
    }
  };

  const allowedExtensions = ["pdf", "doc", "docx"];
  const maxSizeBytes = 5 * 1024 * 1024; // 5MB

  const validateFile = (file: File): string | null => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      return "Unsupported file type. Please upload a PDF, DOC, or DOCX.";
    }
    if (file.size > maxSizeBytes) {
      return "File is too large. Maximum size is 5MB.";
    }
    return null;
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    const error = validateFile(file);
    if (error) {
      toast({ title: "Invalid file", description: error, variant: "destructive" });
      return;
    }
    setResumeFile(file);
    toast({ title: "Resume added", description: file.name });
  };

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] ?? null;
    handleFileSelect(file);
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    handleFileSelect(file);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Loading…</h1>
          <Link to="/jobs">
            <Button>Back to Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!job || error) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">{error ? `Error: ${error}` : 'Job Not Found'}</h1>
          <Link to="/jobs">
            <Button>Back to Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto shadow-soft animate-scale-in">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-6">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Application Submitted!</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Thank you for applying to {job.title}. We've received your application and will review it shortly.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/jobs">
                  <Button variant="outline">Browse More Jobs</Button>
                </Link>
                <Link to="/">
                  <Button>Back to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      
      <div className="container mx-auto px-4 py-12">
        <Link to={`/jobs/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-smooth">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Job Details
        </Link>

        <div className="max-w-3xl mx-auto">
          <Card className="shadow-soft animate-fade-in">
            <CardHeader>
              <CardTitle className="text-2xl">Apply for {job.title}</CardTitle>
              <p className="text-muted-foreground">
                Fill out the form below to submit your application
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resume">Resume *</Label>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Resume upload dropzone"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                    }}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={
                      `border-2 border-dashed rounded-lg p-8 text-center transition-smooth cursor-pointer select-none ` +
                      (isDragging ? "border-primary bg-primary/5" : "hover:border-primary")
                    }
                  >
                    {!resumeFile ? (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOC, DOCX (Max 5MB)
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-left overflow-hidden">
                          <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{resumeFile.name}</p>
                            <p className="text-xs text-muted-foreground">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                            Replace
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Remove file" onClick={(e) => { e.stopPropagation(); setResumeFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="resume"
                      name="resume"
                      className="hidden"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      required
                      onChange={onInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverNote">Cover Note *</Label>
                  <Textarea
                    id="coverNote"
                    rows={6}
                    value={formData.coverNote}
                    onChange={(e) => setFormData({...formData, coverNote: e.target.value})}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" size="lg" className="flex-1">
                    Submit Application
                  </Button>
                  <Link to={`/jobs/${id}`}>
                    <Button type="button" variant="outline" size="lg">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Apply;
