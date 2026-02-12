"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Play, Pause, Volume2, VolumeX, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

interface MotivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  reelTitle?: string;
  onNext?: () => void;
  onPrev?: () => void;
}

export default function MotivationModal({
  isOpen,
  onClose,
  videoUrl,
  reelTitle,
  onNext,
  onPrev,
}: MotivationModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState("00:00");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-play when opened
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Handle blocked autoplay
        setIsPlaying(false);
      });
      setIsPlaying(true);
    } else if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen, videoUrl]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onPrev, onNext]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMute = !isMuted;
      videoRef.current.muted = newMute;
      setIsMuted(newMute);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      const percent = (current / duration) * 100;
      setProgress(percent);

      const mins = Math.floor(current / 60);
      const secs = Math.floor(current % 60);
      setCurrentTime(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-[10px]"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full flex items-center justify-center p-4 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-[110] text-white/70 hover:text-white transition-colors"
          style={{ fontSize: "24px" }}
          aria-label="Close"
        >
          <X size={28} strokeWidth={2.5} />
        </button>

        <div className="flex items-center justify-center w-full max-w-5xl h-full gap-4 md:gap-12">
          {/* Prev Button */}
          <button
            onClick={onPrev}
            className="hidden md:flex items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            aria-label="Previous video"
          >
            <ChevronLeft size={44} />
          </button>

          {/* Video Stage */}
          <div className="flex flex-col items-center flex-1 max-w-[450px] relative">
            <div 
              className="relative aspect-[9/16] w-full bg-black rounded-[20px] overflow-hidden border border-[#2a2a2e] shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
              style={{ maxHeight: "85vh" }}
            >
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                src={videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                playsInline
              />

              {/* Custom Overlay Controls */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                {/* Progress Bar */}
                <div className="w-full h-[3px] bg-white/20 rounded-full mb-4 cursor-pointer relative overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full bg-white transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Controls Bar */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="text-white w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-md transition-all"
                  >
                    {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
                  </button>

                  <button
                    onClick={toggleMute}
                    className="text-white w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-md transition-all"
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 bg-white/20 rounded-full appearance-none flex-shrink-0 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />

                  <button
                    onClick={handleReplay}
                    className="text-white w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-md transition-all"
                  >
                    <RotateCcw size={16} />
                  </button>

                  <span className="ml-auto text-white/80 font-medium text-xs font-mono tracking-tighter">
                    {currentTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Caption */}
            {reelTitle && (
              <div className="mt-4 text-center">
                <span className="text-white font-semibold text-lg drop-shadow-md">
                  {reelTitle}
                </span>
              </div>
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={onNext}
            className="hidden md:flex items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            aria-label="Next video"
          >
            <ChevronRight size={44} />
          </button>
        </div>
      </div>
    </div>
  );
}