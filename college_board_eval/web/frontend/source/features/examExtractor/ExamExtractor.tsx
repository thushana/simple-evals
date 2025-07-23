import React, { useState, useEffect } from "react";
import type { SelectChangeEvent } from "@mui/material";
import type { ExamUploadForm, Manifest } from "./types/examExtractor.types";
import type { BoundingBox } from "./types/examExtractor.types";
import { uploadExamFile, fetchManifest } from "./utils/api";
import { useExamData } from "./hooks/useExamData";
import { ExamBuilder } from "./ExamBuilder";
import { ExamSetup } from "./ExamSetup";
import { useNavigate, useParams } from "react-router-dom";
import { Box } from "@mui/material";

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
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
  const [step, setStep] = useState<"setup" | "tagging">(
    urlSlug ? "tagging" : "setup",
  );
  const [transitionStage, setTransitionStage] = useState<
    "idle" | "fadingOut" | "fadingIn"
  >("idle");

  const setBoundingBoxesAndLog = setBoundingBoxes;

  useEffect(() => {
    if (urlSlug) {
      setStep("tagging");
      setManifestSlug(urlSlug);
      fetchManifest(urlSlug).then(setManifest);
    }
  }, [urlSlug]);

  React.useEffect(() => {
    if (!manifestSlug || urlSlug) {
      return;
    }
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let isStopped = false;
    const poll = async () => {
      if (isStopped) return;
      try {
        const m = await fetchManifest(manifestSlug);
        setManifest(m);
        if (m.metadata.processing_completed) {
          isStopped = true;
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch {
        // Intentionally empty - errors are handled by the polling mechanism
      }
    };
    poll();
    intervalId = setInterval(() => {
      if (!isStopped) poll();
    }, 1000);
    return () => {
      isStopped = true;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
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
    const slug = `${formData.examType}_${formData.year}`;
    setManifestSlug(slug);
    setManifest(null);
    setShowProcessing(true);
    try {
      if (formData.uploadMethod === "upload" && formData.file) {
        await uploadExamFile(
          formData.file,
          slug,
          formData.examType,
          Number(formData.year),
        );
      } else if (formData.uploadMethod === "grab" && formData.sourceUrl) {
        await uploadExamFile(
          null,
          slug,
          formData.examType,
          Number(formData.year),
          formData.sourceUrl,
        );
      } else {
        throw new Error("No file or URL provided");
      }
      setUploading(false);
      setUploadComplete(true);
    } catch (err: unknown) {
      setPollError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      setManifestSlug(null);
    }
  };

  // Staggered transition logic
  const handleBuildExam = () => {
    setTransitionStage("fadingOut");
    setTimeout(() => {
      const slug = manifestSlug || manifest?.metadata.slug;
      if (slug) {
        navigate(`/examextractor/${slug}`, { replace: true });
        window.scrollTo({ top: 0, behavior: "auto" });
      }
      setStep("tagging");
      setTransitionStage("fadingIn");
      setTimeout(() => {
        setTransitionStage("idle");
      }, 500);
    }, 500);
  };

  return (
    <Box position="relative" minHeight="80vh">
      {step === "setup" && (
        <ExamSetup
          examTypes={examTypes}
          years={years}
          loading={loading}
          error={error}
          formData={formData}
          uploading={uploading}
          uploadComplete={uploadComplete}
          showProcessing={showProcessing}
          pollError={pollError}
          manifest={manifest}
          onBuildExam={handleBuildExam}
          handleExamTypeChange={handleExamTypeChange}
          handleYearChange={handleYearChange}
          handleFileChange={handleFileChange}
          handleUploadMethodChange={handleUploadMethodChange}
          handleSourceUrlChange={handleSourceUrlChange}
          handleUpload={handleUpload}
          transitionStage={transitionStage}
        />
      )}
      {step === "tagging" && (
        <ExamBuilder
          boundingBoxes={boundingBoxes}
          setBoundingBoxes={setBoundingBoxesAndLog}
          manifest={manifest}
          transitionStage={transitionStage}
        />
      )}
    </Box>
  );
};
