import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../context/ApiContext';
import { multipartUploadToS3 } from '../../utils/multipartUpload';

const Settings = () => {
  const { user } = useAuth();
  const { userData, updateProfile } = useApi();

  const [name, setName] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fallbackName = user?.username?.split('@')[0] || 'User';

  useEffect(() => {
    setName(userData?.name || fallbackName);
    setImgUrl(userData?.imgUrl || userData?.image || '');
  }, [userData, fallbackName]);

  const displayName = useMemo(() => {
    const finalName = name || userData?.name || fallbackName;
    return finalName;
  }, [name, userData, fallbackName]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setMessage('');
    setUploading(true);

    try {
      const uploadedUrl = await multipartUploadToS3(file, {
        folder: 'profile',
      });
      setImgUrl(uploadedUrl);
      setMessage('Profile image uploaded. Click Save Changes to apply.');
    } catch (uploadErr) {
      setError(uploadErr.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setError('');
    setMessage('');

    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        imgUrl,
      });
      setMessage('Profile updated successfully.');
    } catch (saveErr) {
      setError(saveErr.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Account Settings</h1>
        <p className="text-gray-400">Manage your account details and preferences.</p>
      </div>

      <div className="space-y-8">
        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-sm">
            {message}
          </div>
        )}

        {/* Profile Section */}
        <section className="bg-[#121212] border border-[#222] rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-medium text-white mb-6">Profile</h2>

          <div className="flex flex-col sm:flex-row gap-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-medium shadow-xl">
                {imgUrl ? (
                  <img
                    src={imgUrl}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <label className="px-4 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#222] border border-[#333] rounded-md transition-colors text-white cursor-pointer disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  hidden
                />
              </label>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  disabled
                  value={userData?.email || user?.signInDetails?.loginId || user?.username || 'email@example.com'}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-4 py-2.5 text-gray-300 focus:outline-none cursor-not-allowed opacity-70"
                />
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || uploading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        {/* <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-medium text-red-500 mb-2">Danger Zone</h2>
          <p className="text-sm text-gray-400 mb-6">Permanently delete your account and all of your sites.</p>

          <button className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white font-medium rounded-lg transition-colors">
            Delete Account
          </button>
        </section> */}
      </div>
    </div>
  );
};

export default Settings;
