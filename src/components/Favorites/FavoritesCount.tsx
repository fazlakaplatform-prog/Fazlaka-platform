"use client";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

interface FavoritesCountProps {
  contentId: string;
  contentType: "episode" | "article";
  className?: string;
}

export default function FavoritesCount({ 
  contentId, 
  contentType, 
  className = ""
}: FavoritesCountProps) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch(`/api/favorites/count?contentId=${contentId}&contentType=${contentType}`);
        if (response.ok) {
          const data = await response.json();
          setCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching favorites count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, [contentId, contentType]);

  if (loading) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Heart className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-400">-</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Heart className="w-4 h-4 text-red-500 fill-current" />
      <span className="text-sm text-gray-600 dark:text-gray-400">{count}</span>
    </div>
  );
}