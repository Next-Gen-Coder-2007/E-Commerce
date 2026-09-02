import React, { useState, useEffect } from 'react';
import { Save, Check, ExternalLink } from 'lucide-react';
import { getStorefrontSettingsApi, updateStorefrontSettingsApi } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';

export const BusinessStorefrontPage: React.FC = () => {
  const { user } = useAuth();
  const storeName = user?.companyName || '';
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getStorefrontSettingsApi()
      .then((res) => {
        if (res?.storefront) {
          setTagline(res.storefront.tagline || '');
          setDescription(res.storefront.description || '');
          setBannerUrl(res.storefront.bannerUrl || '');
        }
      })
      .catch((err) => console.warn('Storefront settings fetch error:', err));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateStorefrontSettingsApi({
        tagline,
        description,
        bannerUrl,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update storefront settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-zinc-900">Storefront Customizer</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Customize how customers perceive your merchant brand, banner graphics, and store policies.
          </p>
        </div>

        <a
          href={`/store/${user?._id || ''}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs border border-zinc-200 shadow-2xs transition"
        >
          <span>Preview Live Storefront</span>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
        </a>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 space-y-5 text-xs shadow-xs">
        <div>
          <label className="block font-bold text-zinc-900 mb-1.5">Store Display Name</label>
          <input
            type="text"
            disabled
            value={storeName}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-500 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block font-bold text-zinc-900 mb-1.5">Brand Tagline</label>
          <input
            type="text"
            placeholder="e.g. Official flagship audio gear and studio headphones"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
          />
        </div>

        <div>
          <label className="block font-bold text-zinc-900 mb-1.5">Hero Banner Image URL</label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
          />
        </div>

        <div>
          <label className="block font-bold text-zinc-900 mb-1.5">Store Narrative & Customer Guarantee</label>
          <textarea
            rows={4}
            placeholder="Share your brand story, manufacturing standards, and direct warranty details..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3.5 py-2.5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
          <div>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold">
                <Check className="w-4 h-4" />
                <span>Storefront updated successfully!</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 disabled:opacity-50 text-white font-bold transition cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessStorefrontPage;
