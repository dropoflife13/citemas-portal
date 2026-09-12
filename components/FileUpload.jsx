'use client';

import { useState } from 'react';

export function FileUpload({ onUploadSuccess, onUploadError, accept = 'image/*,video/*' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onUploadError?.('File size exceeds 10MB limit');
      return;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      onUploadError?.('Invalid file type. Please upload an image or video.');
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('citemas_token');
      const response = await fetch('/api/portfolio/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setPreview(data.url);
        onUploadSuccess?.(data.url);
      } else {
        onUploadError?.(data.error || 'Upload failed');
      }
    } catch (error) {
      onUploadError?.(error.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setPreview(null);
    setFileName('');
    onUploadSuccess?.('');
  };

  return (
    <div className="space-y-2">
      <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:bg-gray-50 transition ${preview ? 'border-green-400 bg-green-50' : 'border-gray-300'}`}>
        <input
          type="file"
          id="file-upload"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer block"
        >
          {uploading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Uploading...</span>
            </div>
          ) : preview ? (
            <div className="space-y-2">
              <div className="relative">
                {preview.match(/\.(mp4|webm|mov)$/i) || preview.includes('video') ? (
                  <video src={preview} className="max-h-64 mx-auto rounded" controls />
                ) : (
                  <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded" />
                )}
              </div>
              <div className="flex items-center justify-center space-x-4">
                <span className="text-sm text-green-600">✓ File uploaded successfully!</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Click to upload a different file</p>
            </div>
          ) : (
            <div>
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-600 mt-2">
                Click to upload an image or video
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, GIF, WebP, MP4, WebM • Max 10MB
              </p>
            </div>
          )}
        </label>
      </div>
    </div>
  );
}