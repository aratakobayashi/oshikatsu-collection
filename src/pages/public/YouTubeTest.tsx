import React from 'react';
import YouTubeEmbed from '../../components/YouTubeEmbed';

export default function YouTubeTest() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">YouTube埋め込みテスト</h1>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">SixTONES - Imitation Rain</h2>
          <YouTubeEmbed videoId="QOOw7f9eQ-k" />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">SixTONES - NEW ERA</h2>
          <YouTubeEmbed videoId="ebXByKO-0Do" />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">京本大我 - 夜に駆ける</h2>
          <YouTubeEmbed videoId="k1QoJy6Zthw" />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">API情報なしテスト</h2>
          <YouTubeEmbed videoId="QOOw7f9eQ-k" showInfo={false} />
        </div>
      </div>
    </div>
  );
}