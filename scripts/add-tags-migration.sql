-- episodesテーブルにtags列を追加
ALTER TABLE episodes 
ADD COLUMN tags text[] DEFAULT '{}';

-- インデックス追加（検索性能向上）
CREATE INDEX idx_episodes_tags ON episodes USING GIN (tags);

-- コメント追加
COMMENT ON COLUMN episodes.tags IS 'エピソードに関連するタグ（カテゴリ、ロケーション、アイテムなど）';