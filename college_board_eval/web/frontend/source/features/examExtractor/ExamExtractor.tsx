import React, { useState, useEffect } from "react";
import type { SelectChangeEvent } from "@mui/material";
import type { ExamUploadForm, Manifest } from "./types/examExtractor.types";
import type { BoundingBox } from "./types/examExtractor.types";
import { uploadExamFile, fetchManifest } from "./utils/api";
import { useExamData } from "./hooks/useExamData";
import { ExamBuilder } from "./ExamBuilder";
import { ExamSetup } from "./ExamSetup";
import { useNavigate, useParams } from "react-router-dom";

export const ExamExtractor: React.FC = () => {
  const navigate = useNavigate();
  const { slug: urlSlug } = useParams<{ slug?: string }>();
  const { examTypes, years, loading, error } = useExamData();
  const [formData, setFormData] = useState<ExamUploadForm>({
    examType: "",
    year: "", // No default year
    file: null,
    sourceUrl: "",
    pdfUrl: "",
    uploadMethod: null,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manifestSlug, setManifestSlug] = useState<string | null>(null);
  // Ensure boundingBoxes is only initialized once and never reset from manifest or backend data
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
  const [step, setStep] = useState<"setup" | "tagging">(
    urlSlug ? "tagging" : "setup",
  );

  // Use setBoundingBoxes directly for production (remove logging wrapper)
  const setBoundingBoxesAndLog = setBoundingBoxes;

  // If URL has a slug, fetch manifest on mount
  useEffect(() => {
    if (urlSlug) {
      setStep("tagging");
      setManifestSlug(urlSlug);
      fetchManifest(urlSlug).then(setManifest);
    }
  }, [urlSlug]);

  // Poll manifest after upload
  React.useEffect(() => {
    if (!manifestSlug || urlSlug) {
      return; // Skip polling if no slug (normal on component mount) or if using URL slug
    }
    console.log(
      `[DEBUG ${new Date().toISOString()}] Poll effect: started for manifestSlug`,
      manifestSlug,
    );

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let isStopped = false;

    const poll = async () => {
      if (isStopped) {
        console.log(
          `[DEBUG ${new Date().toISOString()}] Poll stopped, skipping...`,
        );
        return;
      }
      console.log(`[DEBUG ${new Date().toISOString()}] Polling manifest...`);
      try {
        const m = await fetchManifest(manifestSlug);
        console.log(`[DEBUG ${new Date().toISOString()}] Polled manifest:`, m);
        setManifest(m);
        if (m.metadata.processing_completed) {
          isStopped = true;
          console.log(
            `[DEBUG ${new Date().toISOString()}] Manifest processing completed, stopping poll.`,
          );
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (err) {
        console.error(
          `[DEBUG ${new Date().toISOString()}] Error polling manifest:`,
          err,
        );
      }
    };

    // Start polling immediately
    poll();

    // Set up interval for subsequent polls
    intervalId = setInterval(() => {
      if (!isStopped) {
        poll();
      }
    }, 1000); // Reduced from 2000ms to 1000ms for more responsive updates

    return () => {
      isStopped = true;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      console.log(
        `[DEBUG ${new Date().toISOString()}] Poll effect: cleanup for manifestSlug`,
        manifestSlug,
      );
    };
  }, [manifestSlug, urlSlug]);

  const handleExamTypeChange = (event: SelectChangeEvent<string>) => {
    setFormData((prev) => ({ ...prev, examType: event.target.value }));
  };

  const handleYearChange = (event: SelectChangeEvent<string>) => {
    setFormData((prev) => ({ ...prev, year: event.target.value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleUploadMethodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMethod: "upload" | "grab" | null,
  ) => {
    if (newMethod !== null) {
      setFormData((prev) => ({ ...prev, uploadMethod: newMethod, file: null }));
    }
  };

  const handleSourceUrlChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((prev) => ({ ...prev, sourceUrl: event.target.value }));
  };

  const handleUpload = async () => {
    setUploading(true);
    setPollError(null);

    // Generate slug from examType and year
    const slug = `${formData.examType}_${formData.year}`;
    console.log(
      `[DEBUG ${new Date().toISOString()}] Uploading with slug:`,
      slug,
      formData,
    );

    // Start polling IMMEDIATELY when upload begins
    console.log(
      `[DEBUG ${new Date().toISOString()}] Starting manifest polling immediately for:`,
      slug,
    );
    setManifestSlug(slug);
    setManifest(null);

    // Show processing UI immediately
    setShowProcessing(true);

    try {
      if (formData.uploadMethod === "upload" && formData.file) {
        console.log(
          `[DEBUG ${new Date().toISOString()}] Calling uploadExamFile with file upload`,
        );
        await uploadExamFile(
          formData.file,
          slug,
          formData.examType,
          Number(formData.year),
        );
        console.log(
          `[DEBUG ${new Date().toISOString()}] uploadExamFile completed for file upload`,
        );
      } else if (formData.uploadMethod === "grab" && formData.sourceUrl) {
        console.log(
          `[DEBUG ${new Date().toISOString()}] Calling uploadExamFile with URL grab`,
        );
        await uploadExamFile(
          null,
          slug,
          formData.examType,
          Number(formData.year),
          formData.sourceUrl,
        );
        console.log(
          `[DEBUG ${new Date().toISOString()}] uploadExamFile completed for URL grab`,
        );
      } else {
        throw new Error("No file or URL provided");
      }

      setUploading(false);
      setUploadComplete(true);
      // Keep processing UI visible since we already set it to true
    } catch (err: unknown) {
      console.error(`[DEBUG ${new Date().toISOString()}] Upload error:`, err);
      setPollError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      // Clear manifestSlug on error to stop polling
      setManifestSlug(null);
    }
  };

  // When moving to tagging step, update URL and scroll to top
  const handleBuildExam = () => {
    const slug = manifestSlug || manifest?.metadata.slug;
    if (slug) {
      navigate(`/examextractor/${slug}`, { replace: true });
      window.scrollTo({ top: 0, behavior: "auto" });
      setStep("tagging");
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            gap: 2,
          }}
        >
          <CircularProgress size={60} sx={{ color: "#0677C9" }} />
          <Typography variant="h6" color="text.secondary">
            Loading exam data...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  // Only show ExamSetup in the setup step
  if (step === "setup") {
    return (
      <ExamSetup
        examTypes={examTypes}
        years={years}
        loading={loading}
        error={error}
        formData={formData}
        setFormData={setFormData}
        uploading={uploading}
        uploadComplete={uploadComplete}
        showProcessing={showProcessing}
        pollError={pollError}
        manifest={manifest}
        manifestSlug={manifestSlug}
        setManifestSlug={setManifestSlug}
        setManifest={setManifest}
        setUploading={setUploading}
        setUploadComplete={setUploadComplete}
        setShowProcessing={setShowProcessing}
        setPollError={setPollError}
        onBuildExam={handleBuildExam}
        handleExamTypeChange={handleExamTypeChange}
        handleYearChange={handleYearChange}
        handleFileChange={handleFileChange}
        handleUploadMethodChange={handleUploadMethodChange}
        handleSourceUrlChange={handleSourceUrlChange}
        handleUpload={handleUpload}
      />
    );
  }

  // Only show ExamBuilder in the tagging step
  if (step === "tagging") {
    return (
      <ExamBuilder
        boundingBoxes={boundingBoxes}
        setBoundingBoxes={setBoundingBoxesAndLog}
        manifest={manifest}
        // Pass any other necessary props
      />
    );
  }

  return null;
};
