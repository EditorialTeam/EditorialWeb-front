import { useState } from 'react';
import { fileUrl } from '@/core/api/filesApi';

interface ArticleCoverProps {
  objectKey?: string | null;
  alt: string;
  className?: string;
  loading?: 'eager' | 'lazy';
  onUnavailable?: () => void;
}

export function ArticleCover({ objectKey, alt, className, loading = 'lazy', onUnavailable }: ArticleCoverProps) {
  const [failedKey, setFailedKey] = useState<string | null>(null);
  if (!objectKey || objectKey === failedKey) return null;

  return (
    <img
      src={fileUrl(objectKey)}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      onError={() => {
        setFailedKey(objectKey);
        onUnavailable?.();
      }}
    />
  );
}
