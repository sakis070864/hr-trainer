
import React, { useState, useEffect } from 'react';

interface SearchFormProps {
  onSearch: (jobTitle: string, location: string) => void;
  disabled: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ onSearch, disabled }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [link, setLink] = useState('');

  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!link) {
        setIsUnlocked(false);
        return;
      }

      try {
        const [b64Data, b64Sig] = link.split('.');
        if (!b64Data || !b64Sig) return;

        const secret = import.meta.env.VITE_DASH_LOGIN_WORD || 'default-secret';
        const encoder = new TextEncoder();
        const keyData = encoder.encode(secret);

        // Restore base64 strings
        const dataStr = b64Data.replace(/-/g, '+').replace(/_/g, '/');
        const sigStr = b64Sig.replace(/-/g, '+').replace(/_/g, '/');

        // Decode payload to check expiration
        const jsonStr = atob(dataStr);
        const { exp } = JSON.parse(jsonStr);

        if (Date.now() > exp) {
          console.warn('Token expired');
          setIsUnlocked(false);
          return;
        }

        // Verify Signature
        const key = await crypto.subtle.importKey(
          'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
        );

        const msgData = encoder.encode(jsonStr);
        const signature = Uint8Array.from(atob(sigStr), c => c.charCodeAt(0));

        const isSigValid = await crypto.subtle.verify('HMAC', key, signature, msgData);

        if (!isSigValid) {
          setIsUnlocked(false);
          return;
        }

        // Firebase One-Time Check
        try {
          const { getDocs, query, collection, where, updateDoc, doc, limit } = await import('firebase/firestore');
          const { db } = await import('../services/firebase');

          const q = query(collection(db, 'accessTokens'), where('token', '==', link), limit(1));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const tokenDoc = querySnapshot.docs[0];
            const tokenData = tokenDoc.data();

            if (tokenData.status === 'active') {
              // Valid and unused! Mark it as used.
              // Note: In strict mode we might want to do this only on form submit, 
              // but "unlocking" effectively uses it for this session. 
              // To prevent browser-refresh reuse, we mark it used NOW.
              await updateDoc(doc(db, 'accessTokens', tokenDoc.id), {
                status: 'used',
                usedAt: new Date()
              });
              setIsUnlocked(true);
            } else {
              console.warn('Token already used');
              setIsUnlocked(false);
            }
          } else {
            // Fallback for tokens generated before DB integration (optional, or fail)
            // For security, we should fail if not found in DB.
            console.warn('Token not found in DB');
            setIsUnlocked(false);
          }
        } catch (dbErr) {
          console.error('Database validation failed', dbErr);
          // Fallback to signature-only if DB is unreachable? 
          // Better to fail safe (remain locked) for strict one-time use.
          setIsUnlocked(false);
        }

      } catch (err) {
        setIsUnlocked(false);
      }
    };

    // Debounce slightly to avoid heavy crypto on every keystroke
    const timeoutId = setTimeout(verifyToken, 300);
    return () => clearTimeout(timeoutId);
  }, [link]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobTitle && location && isUnlocked) {
      onSearch(jobTitle, location);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Role (e.g. Senior Financial Analyst)"
              className={`w-full px-6 py-4 bg-white/5 border ${!isUnlocked ? 'border-red-500/20 opacity-50 cursor-not-allowed' : 'border-white/10'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg`}
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={disabled || !isUnlocked}
              required
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Location (e.g. New York, NY)"
              className={`w-full px-6 py-4 bg-white/5 border ${!isUnlocked ? 'border-red-500/20 opacity-50 cursor-not-allowed' : 'border-white/10'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg`}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={disabled || !isUnlocked}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={disabled || !jobTitle || !location || !isUnlocked}
          className="w-full py-4 accent-gradient rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-2xl shadow-indigo-500/10"
        >
          Initialize 2026 Market Analysis
        </button>

        <div className="flex flex-col gap-2 mt-4">
          <label className="text-sm font-medium text-gray-400 pl-1">
            Enter your Link
          </label>
          <div className="relative">
            <input
              type="text"
              className={`w-full px-6 py-4 bg-white/5 border ${isUnlocked ? 'border-green-500/50 text-green-400' : 'border-white/10'} rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg font-mono`}
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={disabled}
              placeholder="Paste access token here..."
            />
            {isUnlocked && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchForm;
