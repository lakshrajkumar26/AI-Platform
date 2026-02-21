import { Play } from 'lucide-react';

interface ContentCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  type: 'VIDEO' | 'BLOG' | 'ARTICLE';
  date: string;
  category: string;
  onClick?: () => void;
}

export default function ContentCard({
  title,
  description,
  thumbnail,
  type,
  date,
  category,
  onClick,
}: ContentCardProps) {
  return (
    <div className="content-card cursor-pointer" onClick={onClick}>
      {/* Thumbnail with Play Button Overlay */}
      <div className="content-card-image">
        <img src={thumbnail} alt={title} />
        {type === 'VIDEO' && (
          <div className="play-button">
            <Play className="w-12 h-12 text-white fill-white" />
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="content-card-content">
        {/* Type Badge */}
        <div className="mb-2">
          <span className="content-badge">{type}</span>
        </div>

        {/* Title */}
        <h3 className="content-card-title">{title}</h3>

        {/* Description */}
        <p className="content-card-description">{description}</p>

        {/* Metadata */}
        <div className="content-card-meta">
          <span className="text-xs text-muted-foreground">{date}</span>
          <span className="text-xs font-medium text-primary uppercase">{category}</span>
        </div>
      </div>
    </div>
  );
}
