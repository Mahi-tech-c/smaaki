import React, { useContext, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { Globe, Shield, CheckCircle, AlertCircle, Loader2, Copy } from 'lucide-react';

const AdminDomainManager = () => {
  const { settings, updateSettings } = useContext(AppContext);
  const [domain, setDomain] = useState(settings.customDomain || '');
  const [status, setStatus] = useState('idle'); // idle, checking, success, error
  const [error, setError] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const hasConfig = settings.vercelToken && settings.vercelProjectId;

  const handleAddDomain = async () => {
    if (!domain) return;
    setIsAdding(true);
    setError(null);
    setStatus('checking');

    try {
      // 1. Add Domain to Vercel
      const addRes = await fetch(`https://api.vercel.com/v9/projects/${settings.vercelProjectId}/domains`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.vercelToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: domain })
      });

      const data = await addRes.json();

      if (!addRes.ok) {
        throw new Error(data.error?.message || 'Failed to add domain');
      }

      // 2. Save domain to our settings
      await updateSettings({ ...settings, customDomain: domain });
      
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    } finally {
      setIsAdding(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast here
  };

  if (!hasConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
        <div className="bg-blue-50 p-6 rounded-full mb-6">
          <Shield size={48} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-black text-pink-900 mb-2">Developer Setup Required</h2>
        <p className="text-pink-600 max-w-md mx-auto mb-8 font-medium">
          To enable custom domains, your developer needs to configure the Vercel API settings in the Global Settings panel.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-3xl p-8 border border-pink-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl text-white">
            <Globe size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-pink-900">Custom Domain</h3>
            <p className="text-pink-500 font-medium text-sm">Connect your own brand name to your menu</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1">
            <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-4 mb-2 block">Enter Domain Name</label>
            <input 
              value={domain}
              onChange={(e) => setDomain(e.target.value.toLowerCase().trim())}
              placeholder="e.g. smaakenzoowarangal.in"
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </div>
          <button 
            onClick={handleAddDomain}
            disabled={isAdding || !domain}
            className={`mt-6 md:mt-0 px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
              isAdding || !domain ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isAdding ? <Loader2 className="animate-spin" /> : <Globe size={20} />}
            {settings.customDomain === domain ? 'Re-verify Domain' : 'Connect Domain'}
          </button>
        </div>

        {status === 'error' && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 mb-8 animate-in slide-in-from-top-2">
            <AlertCircle size={20} />
            <span className="font-bold text-sm">{error}</span>
          </div>
        )}

        {status === 'success' || settings.customDomain ? (
          <div className="space-y-8 animate-in slide-in-from-top-4">
            <div className="p-6 bg-green-50 border border-green-100 rounded-3xl flex items-start gap-4">
              <CheckCircle className="text-green-600 mt-1 flex-shrink-0" size={24} />
              <div>
                <h4 className="text-green-900 font-black mb-1">Domain Link Started!</h4>
                <p className="text-green-700 text-sm font-medium">
                  We've successfully linked **{domain}** to your project. Now you just need to update your DNS records at your domain provider (like GoDaddy or BigRock).
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-black text-pink-900 ml-2">DNS Instructions</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 group relative">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">A Record (Main Domain)</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Host</span>
                      <span className="font-bold text-gray-900">@</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Value</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">76.76.21.21</span>
                        <button onClick={() => copyToClipboard('76.76.21.21')} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-400 transition-colors">
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 group relative">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">CNAME Record (WWW)</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Host</span>
                      <span className="font-bold text-gray-900">www</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Value</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600 truncate max-w-[120px]">cname.vercel-dns.com</span>
                        <button onClick={() => copyToClipboard('cname.vercel-dns.com')} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-400 transition-colors">
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-pink-50 p-8 rounded-[2.5rem] border border-pink-100">
              <h4 className="font-black text-pink-900 mb-4 flex items-center gap-2">
                <RefreshCw size={20} className="text-pink-500" /> What to do next?
              </h4>
              <ul className="space-y-4">
                <li className="flex gap-4 text-sm text-pink-700 font-medium">
                  <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-pink-600 font-bold shrink-0">1</span>
                  Log in to your domain provider (GoDaddy, BigRock, etc.)
                </li>
                <li className="flex gap-4 text-sm text-pink-700 font-medium">
                  <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-pink-600 font-bold shrink-0">2</span>
                  Update the **DNS Records** as shown above.
                </li>
                <li className="flex gap-4 text-sm text-pink-700 font-medium">
                  <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-pink-600 font-bold shrink-0">3</span>
                  Wait for 10-60 minutes for the domain to activate globally.
                </li>
              </ul>
              <div className="mt-8 pt-8 border-t border-pink-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-pink-900 font-bold">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  Checking for connection...
                </div>
                <button className="flex items-center gap-2 text-pink-600 font-black uppercase tracking-widest text-[10px] hover:text-pink-900 transition-colors">
                  Open Site <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
             <div className="bg-white p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Globe size={32} className="text-gray-300" />
             </div>
             <p className="text-gray-500 font-bold max-w-xs mx-auto">Enter your brand name above to start the linking process.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDomainManager;
