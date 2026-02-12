"use client";

import React, { useState, useEffect } from "react";
import { Repeat, Play, Pause, Volume2 } from "lucide-react";
import { useTheme } from "@/lib/ThemeContext";
import { useAmbience } from "@/lib/AmbienceContext";

interface MusicCardProps {
  id: string;
  icon: string;
  title: string;
  type: string;
  audioSrc: string;
}

const MusicCard: React.FC<MusicCardProps> = ({
  id,
  icon,
  title,
  type,
  audioSrc,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { activeSounds, toggleSound, updateSoundVolume, updateSoundLoop } = useAmbience();

  const activeSound = activeSounds.find(s => s.id === id);
  const isPlaying = activeSound?.isPlaying || false;
  const isLooping = activeSound?.isLooping ?? true;
  const volume = activeSound?.volume ?? 70;

  const [visualizerHeights, setVisualizerHeights] = useState<number[]>(
    Array(9).fill(10)
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setVisualizerHeights(
          Array.from({ length: 9 }, () => Math.floor(Math.random() * 40) + 10)
        );
      }, 150);
    } else {
      setVisualizerHeights(Array(9).fill(10));
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleTogglePlay = () => {
    toggleSound({ id, icon, title, audioSrc, volume, isLooping });
  };

  const handleToggleLoop = () => {
    updateSoundLoop(id, !isLooping);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSoundVolume(id, parseInt(e.target.value));
  };

  return (
    <div
      className={`music-card group relative p-[28px] rounded-3xl border transition-all duration-300 ${isDark
        ? "bg-[rgba(255,255,255,0.05)] backdrop-blur-[12px] border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] shadow-[rgba(0,0,0,0.3)_0px_8px_32px_0px]"
        : "bg-white border-[#e5e5ea] hover:border-[#8b5cf6] shadow-[rgba(0,0,0,0.05)_0px_8px_24px_0px]"
        }`}
    >

      <div className="card-header flex items-center mb-[24px]">
        <div
          className={`music-icon flex items-center justify-center w-[64px] h-[64px] rounded-xl text-[32px] mr-[16px] ${isDark ? "bg-[rgba(167,139,250,0.2)]" : "bg-[#f3f0ff]"
            }`}
          style={{
            boxShadow: isDark ? "rgba(102, 126, 234, 0.2) 0px 8px 24px 0px" : "none",
            minWidth: "64px",
          }}
        >
          {icon}
        </div>
        <div className="card-info">
          <div className={`card-title text-[20px] font-semibold mb-[4px] leading-tight ${isDark ? "text-white" : "text-[#1d1d1f]"}`}>
            {title}
          </div>
          <div className={`card-type text-[13px] ${isDark ? "text-[#8e8e93]" : "text-[#86868b]"}`}>
            {type}
          </div>
        </div>
      </div>

      <div className={`visualizer-container flex items-center justify-center relative w-full h-[100px] mb-[20px] rounded-xl border ${isDark ? "bg-[rgba(0,0,0,0.3)] border-white/5" : "bg-[#f5f5f7] border-black/5"
        }`}>
        <div className="visualizer-bars flex items-end gap-[6px] h-[50px]">
          {visualizerHeights.map((h, i) => (
            <div
              key={i}
              className={`v-bar w-[5px] rounded-[3px] transition-all duration-200 ${isDark ? "bg-[#a78bfa]" : "bg-[#8b5cf6]"}`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>

      <div className={`controls-section flex items-center gap-[12px] p-[12px] rounded-2xl border ${isDark ? "bg-[rgba(255,255,255,0.03)] border-white/5" : "bg-[#f5f5f7] border-black/5"
        }`}>
        <button
          onClick={handleToggleLoop}
          className={`flex items-center justify-center w-[36px] h-[36px] rounded-lg transition-colors ${isLooping
            ? isDark ? "bg-[#a78bfa] text-black" : "bg-[#8b5cf6] text-white"
            : isDark ? "bg-[rgba(255,255,255,0.1)] text-white hover:bg-[rgba(255,255,255,0.15)]" : "bg-black/5 text-black/60 hover:bg-black/10"
            }`}
          title="Loop"
        >
          <Repeat size={16} />
        </button>

        <button
          onClick={handleTogglePlay}
          className={`flex items-center justify-center w-[44px] h-[44px] rounded-full shadow-lg hover:scale-105 transition-transform active:scale-95 ${isDark ? "bg-white text-black" : "bg-[#8b5cf6] text-white"
            }`}
        >
          {isPlaying ? (
            <Pause size={18} fill="currentColor" />
          ) : (
            <Play size={18} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <div className="volume-control flex items-center flex-1 gap-[8px]">
          <Volume2 size={16} className={isDark ? "text-[#8e8e93]" : "text-[#86868b]"} />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className={`volume-slider flex-1 h-[3px] rounded-full cursor-pointer ${isDark ? "bg-white/10 accent-white" : "bg-black/10 accent-[#8b5cf6]"}`}
            style={{ WebkitAppearance: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

const MusicGrid: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [musicCards, setMusicCards] = useState<MusicCardProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAmbience = async () => {
      try {
        const response = await fetch('/api/ambience');
        const data = await response.json();
        setMusicCards(data);
      } catch (error) {
        console.error('Error fetching ambience data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAmbience();
  }, []);

  // Cards are now fetched from API

  return (
    <section className="w-full max-w-[1200px] mx-auto pb-20">
      <div className="header mb-12">
        <h2 className={`text-[32px] md:text-[40px] font-bold mb-2 tracking-tight ${isDark ? "text-white" : "text-[#1d1d1f]"}`}>
          Soundscapes
        </h2>
        <p className={`text-lg ${isDark ? "text-[#8e8e93]" : "text-[#86868b]"}`}>
          Personalize your focus environment with immersive audio.
        </p>
      </div>

      <div className="music-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
            <div className={`text-lg ${isDark ? "text-white/40" : "text-black/40"}`}>
              Loading soundscapes...
            </div>
          </div>
        ) : (
          musicCards.map((card) => (
            <MusicCard key={card.id} {...card} />
          ))
        )}
      </div>
    </section>
  );
};

export default MusicGrid;
