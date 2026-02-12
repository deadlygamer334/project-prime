import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Link as LinkIcon, ExternalLink } from 'lucide-react';

// Reels are now fetched from API

const MotivationGrid: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [reels, setReels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getEmbedUrl = (url: string) => {
    if (!url) return "";

    // YouTube Shorts
    if (url.includes('youtube.com/shorts/')) {
      const id = url.split('shorts/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`;
    }

    // YouTube Regular
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`;
    }

    // Instagram Reels
    if (url.includes('instagram.com/reels/') || url.includes('instagram.com/reel/')) {
      const id = url.split('/reel/')[1]?.split('/')[0] || url.split('/reels/')[1]?.split('/')[0];
      return `https://www.instagram.com/reels/${id}/embed/`;
    }

    return url;
  };

  const getThumbnailUrl = (url: string) => {
    if (!url) return "";

    // YouTube
    if (url.includes('youtube.com/shorts/') || url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
      let id = "";
      if (url.includes('shorts/')) id = url.split('shorts/')[1]?.split('?')[0];
      else if (url.includes('v=')) id = url.split('v=')[1]?.split('&')[0];
      else if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
    }

    // Instagram (Note: Getting IG thumbnails via URL is hard without API, so we'll use a placeholder or the ID)
    if (url.includes('instagram.com')) {
      return "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1000&auto=format&fit=crop"; // IG Placeholder
    }

    return null;
  };

  const isDirectVideo = (url: string) => {
    return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.ogg');
  };

  const fetchReels = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/reels');
      const data = await response.json();
      setReels(data);
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  const closeModal = () => setSelectedVideo(null);

  return (
    <main className="min-h-screen text-foreground selection:bg-primary/20">
      {/* Motivation Grid Section */}
      <section className="container pt-32 pb-[60px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-[1200px] mx-auto px-6">
          {isLoading ? (
            <div className="col-span-full py-20 text-center">
              <div className="text-lg text-muted-foreground">Loading vault...</div>
            </div>
          ) : reels.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <div className="text-lg text-muted-foreground">Your vault is empty. Add some reels above!</div>
            </div>
          ) : (
            reels.map((videoUrl, index) => (
              <VideoCard
                key={index}
                videoUrl={videoUrl}
                index={index}
                onClick={() => setSelectedVideo(videoUrl)}
                isDirect={isDirectVideo(videoUrl)}
                thumbnail={getThumbnailUrl(videoUrl)}
              />
            ))
          )}
        </div>
      </section>

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-background/95 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={closeModal}
        >
          <div
            className="relative w-[90%] md:w-[450px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {isDirectVideo(selectedVideo) ? (
              <video
                src={selectedVideo}
                autoPlay
                loop
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <iframe
                src={getEmbedUrl(selectedVideo)}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}
            <button
              onClick={closeModal}
              className="absolute top-6 right-6 p-2 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

interface VideoCardProps {
  videoUrl: string;
  index: number;
  onClick: () => void;
  isDirect: boolean;
  thumbnail: string | null;
}

const VideoCard = ({ videoUrl, index, onClick, isDirect, thumbnail }: VideoCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isHovered && videoRef.current) {
      videoRef.current.play().catch(() => { });
    } else if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isHovered]);

  return (
    <article
      className="motivation-card group relative aspect-[9/16] rounded-3xl border border-border overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:scale-[1.05] hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] hover:border-primary/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {isDirect ? (
        <video
          ref={videoRef}
          src={videoUrl}
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
        />
      ) : (
        <div className="w-full h-full relative">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={`Reel ${index + 1}`}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-muted ${isHovered ? 'bg-muted/80' : ''}`}>
              <LinkIcon size={40} className="text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
            <ExternalLink size={14} className="text-white/60" />
          </div>
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

      {/* Card Info */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-6 flex flex-col items-center">
        <span className="card-badge bg-white/10 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-widest py-1.5 px-3 rounded-full border border-white/10 shadow-lg transition-transform group-hover:scale-110">
          Reel {index + 1}
        </span>
      </div>

      {!isHovered && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Play className="text-white ml-1 fill-white" size={32} />
          </div>
        </div>
      )}
    </article>
  );
};

export default MotivationGrid;