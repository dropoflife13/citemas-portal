// app/applications/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileUpload } from '@/components/FileUpload';
// Portfolio Tab Component - With better text visibility
function PortfolioTab({ user, token }) {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    specialization: 'digital_arts',
    level: 'beginner',
    applicantName: user ? `${user.firstName} ${user.lastName}` : '',
    applicantEmail: user ? user.email : '',
    mediaUrl: '',
  });
  const [formError, setFormError] = useState('');

  const isStaff = ['super_admin', 'teacher', 'officer'].includes(user?.role);
  const isMember = user?.role === 'member';
  const canView = isStaff || isMember;
  const canCreate = isStaff || isMember;
  const MAX_ENTRIES_PER_MEMBER = 5;
  const atLimit = isMember && entries.length >= MAX_ENTRIES_PER_MEMBER;

  async function loadEntries() {
    try {
      setLoading(true);
      const res = await fetch('/api/portfolio', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEntries(data);
        setError('');
      } else {
        setError(data.error || 'Failed to load portfolios');
      }
    } catch {
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token && canView) {
      loadEntries();
    }
  }, [token, user?.role]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setUploadError('');
    
    if (!form.mediaUrl) {
      setFormError('Please upload an image or video');
      return;
    }
    
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error);
        return;
      }
      
      setForm({
        title: '',
        description: '',
        specialization: 'digital_arts',
        level: 'beginner',
        applicantName: user?.firstName + ' ' + user?.lastName || '',
        applicantEmail: user?.email || '',
        mediaUrl: '',
      });
      loadEntries();
    } catch {
      setFormError('Could not connect to the server');
    }
  }

  const handleUploadSuccess = (url) => {
    setForm({ ...form, mediaUrl: url });
    setUploadError('');
  };

  const handleUploadError = (error) => {
    setUploadError(error);
  };

  if (!canView) {
    return (
      <div className="text-gray-500 p-4">
        Your role doesn't have access to the portfolio gallery.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Portfolio Gallery</h2>
        {isMember && (
          <span className="text-sm text-gray-600">
            {entries.length} / {MAX_ENTRIES_PER_MEMBER} pieces submitted
          </span>
        )}
      </div>

      {canCreate && !atLimit && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
          <h3 className="text-xl font-semibold text-black">Add Portfolio Piece</h3>
          {formError && (
            <div className="p-3 bg-red-100 text-red-700 rounded border border-red-200">{formError}</div>
          )}
          {uploadError && (
            <div className="p-3 bg-red-100 text-red-700 rounded border border-red-200">{uploadError}</div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                placeholder="Enter title..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg p-3 text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialization *
              </label>
              <select
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-3 text-black bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="digital_arts">Digital Arts</option>
                <option value="traditional_arts">Traditional Arts</option>
                <option value="voice_acting">Voice Acting</option>
                <option value="video_editing">Video Editing</option>
                <option value="photography">Photography</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              placeholder="Describe your portfolio piece..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              className="w-full border border-gray-300 rounded-lg p-3 text-black placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level *
            </label>
            <select
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-3 text-black bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Upload Image or Video *
            </label>
            <FileUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              accept="image/*,video/*"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Portfolio
          </button>
        </form>
      )}

      {atLimit && (
        <div className="p-4 bg-yellow-50 text-yellow-700 rounded border border-yellow-200">
          You've reached the maximum of {MAX_ENTRIES_PER_MEMBER} portfolio pieces.
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded border border-red-200">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading portfolios...</div>
      ) : (
        <div className="space-y-4">
          {entries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {isStaff ? 'No portfolio submissions yet.' : 'You haven\'t submitted any portfolio pieces yet.'}
            </p>
          ) : (
            entries.map((entry) => (
              <div key={entry._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition bg-white">
                <h3 className="font-bold text-lg text-black">{entry.title}</h3>
                
                <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-1">
                  <span>By: {entry.owner?.firstName} {entry.owner?.lastName}</span>
                  <span>•</span>
                  <span>{entry.specialization}</span>
                  <span>•</span>
                  <span className="capitalize">{entry.level}</span>
                  {entry.applicant && (
                    <>
                      <span>•</span>
                      <span>Applicant: {entry.applicant.name}</span>
                    </>
                  )}
                </div>
                
                <p className="mt-2 text-gray-700">{entry.description}</p>
                
                <div className="mt-2">
                  {entry.mediaUrl && (
                    entry.mediaUrl.match(/\.(mp4|webm|mov)$/i) || entry.mediaUrl.includes('video') ? (
                      <video src={entry.mediaUrl} className="max-h-64 rounded" controls />
                    ) : (
                      <img src={entry.mediaUrl} alt={entry.title} className="max-h-64 rounded" />
                    )
                  )}
                </div>

                <div className="mt-2">
                  <a
                    href={entry.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Media →
                  </a>
                </div>

                {isStaff && (
                  <button
                    onClick={async () => {
                      if (confirm('Delete this portfolio entry?')) {
                        try {
                          const res = await fetch(`/api/portfolio?id=${entry._id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` },
                          });
                          if (res.ok) {
                            loadEntries();
                          } else {
                            const data = await res.json();
                            setError(data.error || 'Failed to delete');
                          }
                        } catch {
                          setError('Could not connect to the server');
                        }
                      }
                    }}
                    className="mt-2 text-red-600 text-sm hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Applications Tab Component
function ApplicationsTab({ user, token }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [form, setForm] = useState({
    specialization: 'digital_arts',
    motivationLetter: '',
    portfolioLink: '',
  });
  const [formError, setFormError] = useState('');

  const isStaff = ['super_admin', 'teacher', 'officer'].includes(user?.role);
  const isUser = user?.role === 'user' || user?.role === 'applicant';
  const isApplicant = user?.role === 'applicant';

  async function loadApplications() {
    try {
      setLoading(true);
      const res = await fetch('/api/applications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.status === 403) {
        setApplications([]);
        setError('');
        return;
      }

      const data = await res.json();
      if (res.ok) {
        setApplications(data);
        setError('');
      } else {
        setError(data.error || 'Failed to load applications');
      }
    } catch {
      setError('Could not connect to the server');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token && isStaff) {
      loadApplications();
    } else {
      setLoading(false);
    }
  }, [token, isStaff]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error);
        return;
      }

      const storedUser = JSON.parse(localStorage.getItem('citemas_user') || '{}');
      localStorage.setItem('citemas_user', JSON.stringify({ ...storedUser, role: 'applicant' }));
      
      window.location.reload();
    } catch {
      setFormError('Could not connect to the server');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isStaff && !isUser) {
    return <div className="text-gray-500">Access restricted.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Applications</h2>
        {isUser && !isApplicant && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            {showForm ? 'Cancel' : 'Submit Application'}
          </button>
        )}
      </div>
      
      {isUser && showForm && !isApplicant && (
        <form onSubmit={handleSubmit} className="border rounded-lg p-6 bg-gray-50 space-y-4">
          <h3 className="font-semibold text-lg">Submit Your Application</h3>
          {formError && (
            <div className="p-3 bg-red-100 text-red-700 rounded">{formError}</div>
          )}
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Specialization*
            </label>
            <select
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              required
              className="w-full border rounded p-2"
            >
              <option value="digital_arts">Digital Arts</option>
              <option value="traditional_arts">Traditional Arts</option>
              <option value="voice_acting">Voice Acting</option>
              <option value="video_editing">Video Editing</option>
              <option value="photography">Photography</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Motivation Letter*
            </label>
            <textarea
              placeholder="Tell us why you want to join..."
              value={form.motivationLetter}
              onChange={(e) => setForm({ ...form, motivationLetter: e.target.value })}
              required
              className="w-full border rounded p-2 h-32"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Portfolio Link (Optional)
            </label>
            <input
              type="url"
              placeholder="https://your-portfolio.com"
              value={form.portfolioLink}
              onChange={(e) => setForm({ ...form, portfolioLink: e.target.value })}
              className="w-full border rounded p-2"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      )}

      {isApplicant && (
        <div className="border rounded-lg p-4 bg-yellow-50">
          <h3 className="font-semibold">Application Submitted!</h3>
          <p className="text-sm text-gray-600 mt-2">
            Your application is being reviewed. You'll receive updates via email.
          </p>
          <div className="mt-3">
            <span className="inline-block px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm">
              Pending Review
            </span>
          </div>
        </div>
      )}

      {isStaff && (
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="font-semibold">All Applications</h3>
          {error && <div className="text-red-600 mt-2">{error}</div>}
          {loading ? (
            <div className="text-gray-500">Loading applications...</div>
          ) : applications.length === 0 ? (
            <p className="text-gray-500 mt-2">No applications yet.</p>
          ) : (
            <div className="space-y-3 mt-3">
              {applications.map((app) => (
                <div key={app._id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <p className="font-medium">
                    {app.applicant?.firstName} {app.applicant?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{app.applicant?.email}</p>
                  <p className="text-sm text-gray-600">Specialization: {app.specialization}</p>
                  <p className="text-sm text-gray-500">Status: {app.status || 'Pending'}</p>
                  {app.portfolioLink && (
                    <a 
                      href={app.portfolioLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View Portfolio
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main Applications Page - THIS MUST BE THE DEFAULT EXPORT
export default function ApplicationsPage() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('applications');
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('citemas_token');
    const storedUser = localStorage.getItem('citemas_user');
    
    if (!storedToken || !storedUser) {
      router.push('/login');
      return;
    }
    
    setToken(storedToken);
    setUser(JSON.parse(storedUser));
  }, [router]);

  if (!user) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex space-x-4 px-4">
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-4 px-2 text-sm font-medium ${
                  activeTab === 'applications'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Applications
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`py-4 px-2 text-sm font-medium ${
                  activeTab === 'portfolio'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Portfolio
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'applications' ? (
              <ApplicationsTab user={user} token={token} />
            ) : (
              <PortfolioTab user={user} token={token} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}