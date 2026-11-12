import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserProfileData } from '@/core/profile/types';
import { Camera, Image as ImageIcon } from 'lucide-react';

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfileData;
  onSave: (updated: Partial<UserProfileData>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [firstName, setFirstName] = useState(profile.firstName || '');
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [username, setUsername] = useState(profile.username || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '');
  const [isUrlInputVisible, setIsUrlInputVisible] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      avatarUrl: avatarUrl.trim(),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Редактировать профиль" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-outline-variant">
          <div className="relative group shrink-0">
            <img
              src={avatarUrl}
              alt="Avatar preview"
              className="w-20 h-20 rounded-full object-cover bg-surface-container border border-outline-variant"
            />
            <label
              htmlFor="avatar-file-input"
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center cursor-pointer shadow-sm hover:bg-primary-hover transition-colors"
              title="Загрузить фото с устройства"
            >
              <Camera className="w-3.5 h-3.5" />
            </label>
            <input
              id="avatar-file-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1">
            <h4 className="text-xs font-semibold text-on-surface">Фотография профиля</h4>
            <p className="text-xs text-secondary">
              Рекомендуется квадратное изображение JPG или PNG не менее 400x400px.
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <label
                htmlFor="avatar-file-input"
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Выбрать файл
              </label>
              <span className="text-xs text-secondary">•</span>
              <button
                type="button"
                onClick={() => setIsUrlInputVisible(!isUrlInputVisible)}
                className="text-xs text-secondary hover:text-on-surface flex items-center gap-1"
              >
                <ImageIcon className="w-3 h-3" />
                Указать ссылку
              </button>
            </div>
          </div>
        </div>

        {/* URL Input (if toggled) */}
        {isUrlInputVisible && (
          <Input
            label="Ссылка на аватар (URL)"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
          />
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Имя"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Алексей"
            required
            maxLength={50}
          />
          <Input
            label="Фамилия"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Смирнов"
            required
            maxLength={50}
          />
        </div>

        {/* Username */}
        <Input
          label="Имя пользователя (псевдоним)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="alex_smirnov"
          required
          maxLength={100}
          helperText="Используется для упоминаний и адреса вашего профиля"
        />

        {/* Bio */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="bio-input" className="block text-xs font-semibold text-on-surface">
              Краткое описание (Bio)
            </label>
            <span className="text-[11px] font-mono text-secondary">{bio.length} / 250</span>
          </div>
          <textarea
            id="bio-input"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Расскажите о своих интересах, публикациях или исследовательских темах..."
            rows={3}
            maxLength={250}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-outline/70 bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" size="sm">
            Сохранить изменения
          </Button>
        </div>
      </form>
    </Modal>
  );
};
