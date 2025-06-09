"use client";

import React, { useRef, useState, useCallback, useEffect } from 'react';
import CrtOverlay from './crt-overlay';
import NeonButton from './neon-button';
import { useToast } from "@/hooks/use-toast";
import { Camera, RefreshCw, CheckCircle } from 'lucide-react';

interface WebcamCaptureProps {
  onImageCapture: (imageDataUrl: string) => void;
  initialPromptText?: string;
}

const WebcamCapture: React.FC<WebcamCaptureProps> = ({ onImageCapture, initialPromptText = "ALLOW WEBCAM ACCESS TO BEGIN" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>(initialPromptText);
  const { toast } = useToast();

  const startWebcam = useCallback(async () => {
    try {
      setError(null);
      setPromptText("ACCESSING REALITY MATRIX...");
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setPromptText("POSITION YOURSELF FOR JUDGMENT");
    } catch (err) {
      console.error("Error accessing webcam:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`FAILED TO ACCESS WEBCAM: ${errorMessage}. PLEASE CHECK PERMISSIONS.`);
      setPromptText("WEBCAM ACCESS DENIED OR UNAVAILABLE");
      toast({
        title: "Webcam Error",
        description: `Could not access webcam: ${errorMessage}. Ensure permissions are granted.`,
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    // Automatically try to start webcam on mount
    if (!stream && !capturedImage) {
        startWebcam();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startWebcam, stream, capturedImage]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current && stream) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL('image/png');
        setCapturedImage(imageDataUrl);
        stream.getTracks().forEach(track => track.stop()); // Stop webcam after capture
        setStream(null);
        setPromptText("ASSIMILATING SUBJECT...");
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setPromptText("RE-CALIBRATING...");
    startWebcam();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onImageCapture(capturedImage);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8 space-y-6 w-full max-w-2xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-headline neon-text-primary text-center uppercase glitch-text" data-text={promptText}>
        {promptText}
      </h2>

      {error && <p className="text-destructive text-center text-lg">{error}</p>}

      <div className="relative w-full aspect-[4/3] bg-black border-2 border-primary rounded-lg shadow-[0_0_15px_theme(colors.primary.DEFAULT)] overflow-hidden">
        {!capturedImage && stream && (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        )}
        {capturedImage && (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
        )}
        {(!stream && !capturedImage && !error) && (
             <div className="w-full h-full flex items-center justify-center">
                <p className="text-xl neon-text-secondary">INITIALIZING CAMERA...</p>
             </div>
        )}
        <CrtOverlay />
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
        {!capturedImage && stream && (
          <NeonButton neonColor="primary" onClick={handleCapture} className="w-full sm:w-auto" aria-label="Capture photo">
            <Camera className="mr-2 h-6 w-6" /> CAPTURE IMAGE
          </NeonButton>
        )}
        {capturedImage && (
          <>
            <NeonButton neonColor="secondary" onClick={handleRetake} className="w-full sm:w-auto" aria-label="Retake photo">
              <RefreshCw className="mr-2 h-6 w-6" /> RETAKE
            </NeonButton>
            <NeonButton neonColor="primary" onClick={handleConfirm} className="w-full sm:w-auto" aria-label="Confirm photo">
              <CheckCircle className="mr-2 h-6 w-6" /> CONFIRM & PROCEED
            </NeonButton>
          </>
        )}
         {!stream && !capturedImage && error && (
            <NeonButton neonColor="primary" onClick={startWebcam} className="w-full sm:w-auto" aria-label="Try again">
              <RefreshCw className="mr-2 h-6 w-6" /> TRY AGAIN
            </NeonButton>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;
