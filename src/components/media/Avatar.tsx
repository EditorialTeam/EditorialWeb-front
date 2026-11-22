import { useState } from 'react';
import { fileUrl } from '@/core/api/filesApi';
export function Avatar({ objectKey, name, className = 'w-10 h-10' }: { objectKey?: string | null; name: string; className?: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  return objectKey && failed !== objectKey ? <img src={fileUrl(objectKey)} alt={name} onError={() => setFailed(objectKey)} className={`${className} rounded-full object-cover bg-surface-container shrink-0`} /> : <span aria-label={name} className={`${className} rounded-full bg-surface-container text-secondary flex items-center justify-center shrink-0 font-semibold`}>{name.trim().slice(0, 1).toUpperCase() || '?'}</span>;
}
