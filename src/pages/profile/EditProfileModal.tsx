import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/media/Avatar';
import { UserProfile } from '@/core/api/types';
import { userApi } from '@/core/api/userApi';
import { filesApi, IMAGE_ACCEPT, imageBody } from '@/core/api/filesApi';

interface Props { isOpen: boolean; onClose: () => void; profile: UserProfile; onSave: () => Promise<void> }
export function EditProfileModal({ isOpen, onClose, profile, onSave }: Props) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (isOpen) { setName(profile.displayName ?? ''); setBio(profile.profileDescription ?? ''); setFile(null); setError(null); } }, [isOpen, profile]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      if (file) { imageBody(file); await filesApi.uploadAvatar(file); setFile(null); }
      await userApi.updateMe({ displayName: name.trim(), profileDescription: bio.trim() });
      await onSave(); onClose();
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  return <Modal isOpen={isOpen} onClose={() => { if (!busy) onClose(); }} title="Редактировать профиль" maxWidth="md"><form onSubmit={save} className="space-y-5">
    <div className="flex items-center gap-4"><Avatar objectKey={profile.avatarObjectKey} name={profile.displayName || profile.username} className="w-16 h-16" /><label className="text-sm">Фотография<input type="file" accept={IMAGE_ACCEPT} disabled={busy} className="block mt-2 max-w-full text-sm" onChange={event => { const selected = event.target.files?.[0]; setFile(null); setError(null); if (selected) { try { imageBody(selected); setFile(selected); } catch (err) { setError((err as Error).message); event.target.value = ''; } } }} /><span className="block mt-2 text-secondary">JPEG, PNG, GIF или WebP, до 10 МиБ.</span>{file && <span className="block mt-1">Выбрано: {file.name}</span>}</label></div>
    <Input label="Отображаемое имя" value={name} onChange={event => setName(event.target.value)} disabled={busy} />
    <Input label="Имя пользователя" value={profile.username} disabled />
    <label className="block text-sm font-medium">О себе<textarea value={bio} disabled={busy} onChange={event => setBio(event.target.value)} rows={4} className="mt-2 w-full rounded-lg border border-outline p-3 text-sm bg-surface" /></label>
    {error && <p role="alert" className="text-sm text-error">{error}</p>}
    <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={busy}>Отмена</Button><Button type="submit" isLoading={busy}>Сохранить</Button></div>
  </form></Modal>;
}
