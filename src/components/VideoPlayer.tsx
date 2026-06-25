"use client";
import React, { useState, useRef } from "react";
import { FaPlay, FaExpand, FaSpinner } from "react-icons/fa";
import { useLanguage } from "@/components/Language/LanguageProvider";

const toEmbed = (url: string): string => {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname.includes("youtu.be")) {
      return `https://www.youtube.com/embed/${u.pathname.replace("/", "")}`;
    }
    return url;
  } catch { return url; }
};

interface VideoPlayerProps {
  videoUrl: string;
  title?: string;
  thumbnailUrl?: string;
}

export default function VideoPlayer({ videoUrl, title, thumbnailUrl }: VideoPlayerProps) {
  const { isRTL } = useLanguage();
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const embedUrl = toEmbed(videoUrl);

  const handlePlay = () => {
    setLoading(true);
    setPlaying(true);
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  if (!embedUrl) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-gray-900 flex flex-col items-center justify-center text-white gap-4">
        <FaPlay className="text-4xl opacity-20" />
        <p className="text-gray-400">Video not available</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl group">
      {!playing ? (
        <>
          <img
            src={thumbnailUrl || `/placeholder.png`}
            alt={title || "Video"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 transition-opacity group-hover:bg-black/50" />
          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/40 shadow-2xl transition-transform duration-300 hover:scale-110 group-active:scale-95">
              <FaPlay className="text-white text-3xl md:text-4xl ml-1" />
            </div>
          </button>
          {title && (
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <h3 className="text-white text-lg md:text-xl font-bold line-clamp-2" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                {title}
              </h3>
            </div>
          )}
        </>
      ) : (
        <>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <FaSpinner className="animate-spin text-white text-4xl" />
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={`${embedUrl}?autoplay=1&rel=0`}
            title={title || "Video"}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleIframeLoad}
            className="w-full h-full"
          />
        </>
      )}
    </div>
  );
}
