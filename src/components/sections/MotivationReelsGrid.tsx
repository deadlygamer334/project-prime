import React, { useState, useMemo } from 'react';
import { Search, Play, X } from 'lucide-react';
import motivationData from '@/../data/motivation-videos.json';
import ReelModal from './ReelModal';

const MotivationReelsGrid: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVideo, setSelectedVideo] = useState<typeof motivationData[0] | null>(null);

    const filteredReels = useMemo(() => {
        if (!searchQuery.trim()) return motivationData;
        const query = searchQuery.toLowerCase();
        return motivationData.filter(reel =>
            reel.reelNumber.toString().includes(query) ||
            `reel ${reel.reelNumber}`.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    return (
        <section className="container py-12 px-6">
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-16 relative">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search Reel Number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-card/40 backdrop-blur-md border border-border rounded-full py-3.5 pl-12 pr-6 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-all shadow-lg"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 text-center uppercase tracking-widest opacity-60">
                    {filteredReels.length} Reels Available
                </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 max-w-[1400px] mx-auto">
                {filteredReels.map((reel) => (
                    <button
                        key={reel.id}
                        onClick={() => setSelectedVideo(reel)}
                        className="group relative aspect-square rounded-2xl border border-border bg-card/30 backdrop-blur-sm flex flex-col items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.04] hover:bg-card/50 hover:border-primary/40 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] group-active:scale-95"
                    >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                            <Play size={16} fill="currentColor" fillOpacity={0} className="group-hover:fill-current" />
                        </div>
                        <span className="text-[11px] font-medium tracking-wider text-muted-foreground group-hover:text-foreground transition-colors uppercase">
                            Reel {reel.reelNumber}
                        </span>

                        {/* Shimmer effect on hover */}
                        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
                        </div>
                    </button>
                ))}
            </div>

            {/* Empty State */}
            {filteredReels.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-muted-foreground text-lg italic mt-4">No reels found matching "{searchQuery}"</p>
                    <button
                        onClick={() => setSearchQuery('')}
                        className="mt-6 text-primary hover:underline font-medium"
                    >
                        View all reels
                    </button>
                </div>
            )}

            {/* Video Modal */}
            {selectedVideo && (
                <ReelModal
                    isOpen={!!selectedVideo}
                    onClose={() => setSelectedVideo(null)}
                    videoUrl={selectedVideo.url}
                    reelTitle={`Reel ${selectedVideo.reelNumber}`}
                />
            )}
        </section>
    );
};

export default MotivationReelsGrid;
