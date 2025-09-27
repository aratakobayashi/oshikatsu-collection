import React, { useState, useEffect } from 'react';
import { Play, Clock, Eye } from 'lucide-react';

interface YouTubeVideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  viewCount: string;
  channelTitle: string;
  publishedAt: string;
}

interface YouTubeEmbedProps {
  videoId: string;
  autoPlay?: boolean;
  showInfo?: boolean;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoId,
  autoPlay = false,
  showInfo = true
}) => {
  const [videoData, setVideoData] = useState<YouTubeVideoData | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🎬 YouTubeEmbed useEffect:', { videoId, showInfo });
    if (showInfo) {
      fetchVideoData();
    } else {
      setLoading(false);
    }
  }, [videoId, showInfo]);

  const fetchVideoData = async () => {
    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      console.log('🔑 YouTube API Key check:', { hasApiKey: !!apiKey, videoId });

      if (!apiKey) {
        console.warn('YouTube API key not found. Falling back to basic embed.');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,statistics,contentDetails`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch video data');
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const video = data.items[0];

        setVideoData({
          id: videoId,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails.maxres?.url ||
                    video.snippet.thumbnails.high?.url ||
                    video.snippet.thumbnails.medium?.url,
          duration: formatDuration(video.contentDetails.duration),
          viewCount: formatViewCount(video.statistics.viewCount),
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt
        });
      }
    } catch (err) {
      console.error('Error fetching YouTube video data:', err);
      setError('動画情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration: string): string => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (match?.[1] || '').replace('H', '');
    const minutes = (match?.[2] || '').replace('M', '');
    const seconds = (match?.[3] || '').replace('S', '');

    if (hours) {
      return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
  };

  const formatViewCount = (count: string): string => {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M回再生`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K回再生`;
    }
    return `${num}回再生`;
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  if (loading) {
    return (
      <div className="my-6 mx-auto max-w-4xl">
        <div className="relative w-full bg-gray-200 rounded-lg animate-pulse" style={{ paddingBottom: '56.25%' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-500">読み込み中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (isPlaying) {
    return (
      <div className="my-6 mx-auto max-w-4xl">
        <div className="relative w-full rounded-lg overflow-hidden shadow-lg" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {videoData && showInfo && (
          <div className="mt-3 px-2">
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">
              {videoData.title}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {videoData.viewCount}
              </span>
              <span>{videoData.channelTitle}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // プレビュー表示（クリックで再生）
  return (
    <div className="my-6 mx-auto max-w-4xl">
      <div
        className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg cursor-pointer group"
        style={{ paddingBottom: '56.25%' }}
        onClick={handlePlay}
      >
        {/* サムネイル */}
        <img
          src={videoData?.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
          alt={videoData?.title || 'YouTube動画'}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* 再生ボタンオーバーレイ */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all duration-200">
          <div className="bg-red-600 rounded-full p-4 group-hover:bg-red-700 transition-colors duration-200 shadow-lg">
            <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
          </div>
        </div>

        {/* 動画時間 */}
        {videoData?.duration && (
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {videoData.duration}
            </div>
          </div>
        )}
      </div>

      {/* 動画情報 */}
      {videoData && showInfo && (
        <div className="mt-3 px-2">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight hover:text-blue-600 transition-colors">
            {videoData.title}
          </h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {videoData.viewCount}
            </span>
            <span>{videoData.channelTitle}</span>
          </div>
          {videoData.description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {videoData.description.substring(0, 150)}
              {videoData.description.length > 150 && '...'}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-red-600 px-2">
          {error}
        </div>
      )}
    </div>
  );
};

export { YouTubeEmbed };
export default YouTubeEmbed;