import React, { useState } from 'react';
import { X, Copy, Check, Lock } from 'lucide-react';

interface DashboardProps {
    onClose: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onClose }) => {
    const [generatedLink, setGeneratedLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [expirationHours, setExpirationHours] = useState(24);

    const generateLink = async () => {
        try {
            const secret = import.meta.env.VITE_DASH_LOGIN_WORD || 'default-secret';
            const expiration = Date.now() + expirationHours * 60 * 60 * 1000;
            const data = JSON.stringify({ exp: expiration, rnd: Math.random() });

            const encoder = new TextEncoder();
            const keyData = encoder.encode(secret);
            const msgData = encoder.encode(data);

            const key = await crypto.subtle.importKey(
                'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
            );

            const signature = await crypto.subtle.sign('HMAC', key, msgData);

            // Convert to efficient base64url strings
            const b64Data = btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            const b64Sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
                .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            const token = `${b64Data}.${b64Sig}`;
            setGeneratedLink(token);
            setCopied(false);

            // Save to Firestore
            try {
                const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                const { db } = await import('../services/firebase');

                await addDoc(collection(db, 'accessTokens'), {
                    token: token,
                    status: 'active',
                    createdAt: serverTimestamp(),
                    expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000)
                });
            } catch (fsError) {
                console.error("Firestore Error:", fsError);
                // We don't block the UI if firestore fails, but we should log it
            }

        } catch (err) {
            console.error('Error generating token:', err);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#0F1115] border border-white/10 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
                {/* Decorative elements matching app theme */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                            <Lock className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>
                            <p className="text-sm text-white/40">Secure Access Management</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <h3 className="text-sm font-medium text-white/60 mb-2">Generate Access Token</h3>
                            <p className="text-xs text-white/40 mb-4">
                                Create a one-time use token for candidate access.
                            </p>

                            <div className="mb-4">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                                    Expiration Time
                                </label>
                                <select
                                    value={expirationHours}
                                    onChange={(e) => setExpirationHours(Number(e.target.value))}
                                    className="w-full bg-black/50 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                >
                                    <option value={1}>1 Hour</option>
                                    <option value={6}>6 Hours</option>
                                    <option value={12}>12 Hours</option>
                                    <option value={24}>24 Hours</option>
                                    <option value={72}>3 Days</option>
                                    <option value={168}>7 Days</option>
                                </select>
                            </div>

                            <button
                                onClick={generateLink}
                                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                Generate New Token
                            </button>
                        </div>

                        {generatedLink && (
                            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                                    Generated Token
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm break-all">
                                        {generatedLink}
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/5"
                                        title="Copy to clipboard"
                                    >
                                        {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/10">
                            <ActiveTokenList />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ActiveTokenList: React.FC = () => {
    const [tokens, setTokens] = useState<any[]>([]);

    React.useEffect(() => {
        const fetchTokens = async () => {
            try {
                const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
                const { db } = await import('../services/firebase');

                // Get ALL active tokens
                const q = query(
                    collection(db, 'accessTokens'),
                    where('status', '==', 'active'),
                    orderBy('createdAt', 'desc')
                );

                const snapshot = await getDocs(q);
                setTokens(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error fetching tokens", err);
            }
        };
        fetchTokens();
        // Set up interval to refresh list every 10s
        const interval = setInterval(fetchTokens, 10000);
        return () => clearInterval(interval);
    }, []);

    const revokeToken = async (id: string) => {
        try {
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('../services/firebase');

            await updateDoc(doc(db, 'accessTokens', id), {
                status: 'revoked',
                revokedAt: new Date()
            });

            // Remove from local list immediately
            setTokens(prev => prev.filter(t => t.id !== id));
        } catch (err) {
            console.error("Failed to revoke", err);
        }
    };

    if (tokens.length === 0) return null;

    return (
        <div className="space-y-3">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2 block">
                Active Tokens ({tokens.length})
            </label>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {tokens.map(token => (
                    <div key={token.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                        <div className="overflow-hidden">
                            <div className="text-xs font-mono text-white/70 truncate w-40">
                                {token.token.substring(0, 15)}...
                            </div>
                            <div className="text-[10px] text-white/30">
                                Expires: {new Date(token.expiresAt.seconds * 1000).toLocaleDateString()}
                            </div>
                        </div>
                        <button
                            onClick={() => revokeToken(token.id)}
                            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded border border-red-500/20 transition-colors"
                        >
                            Revoke
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
