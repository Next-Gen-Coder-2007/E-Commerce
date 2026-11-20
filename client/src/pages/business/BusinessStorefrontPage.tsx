import React, { useState, useEffect } from 'react';
import { Save, Check, ExternalLink, Store } from 'lucide-react';
import { getStorefrontSettingsApi, updateStorefrontSettingsApi } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import { BrutalistButton } from '../../components/BrutalistButton';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1E1E1E] pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-[#1E1E1E] text-white">
            PUBLIC IDENTITY
          </span>
          <h2 className="text-2xl sm:text-3xl font-clash font-bold uppercase tracking-tight text-[#1E1E1E] mt-1">
            Storefront Customizer
          </h2>
          <p className="text-xs font-mono text-[#444444] uppercase tracking-wider">
            Curate store branding, hero promotional banners, and customer service guarantee.
          </p>
        </div>

        <a
          href={`/store/${user?._id || ''}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#1E1E1E] bg-white hover:bg-[#1E1E1E] hover:text-white text-[#1E1E1E] font-mono font-bold text-xs uppercase shadow-[3px_3px_0px_#1E1E1E] transition"
        >
          <span>Preview Live Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <form onSubmit={handleSave} className="border-2 border-[#1E1E1E] bg-white p-6 sm:p-8 space-y-6 text-xs font-mono shadow-[6px_6px_0px_#1E1E1E]">
        <div>
          <label className="block font-bold uppercase text-[#1E1E1E] mb-1.5">
            STORE DISPLAY NAME
          </label>
          <input
            type="text"
            disabled
            value={storeName}
            className="w-full bg-[#E4E2DD] border-2 border-zinc-400 px-4 py-2.5 text-[#444444] font-bold cursor-not-allowed uppercase"
          />
        </div>

        <div>
          <label className="block font-bold uppercase text-[#1E1E1E] mb-1.5">
            STORE TAGLINE
          </label>
          <input
            type="text"
            placeholder="e.g. Official flagship audio gear and premium headphones"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full bg-white border-2 border-[#1E1E1E] px-4 py-2.5 text-[#1E1E1E] font-satoshi placeholder-[#444444] focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-bold uppercase text-[#1E1E1E] mb-1.5">
            HERO BANNER IMAGE URL
          </label>
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            className="w-full bg-white border-2 border-[#1E1E1E] px-4 py-2.5 text-[#1E1E1E] font-mono placeholder-[#444444] focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-bold uppercase text-[#1E1E1E] mb-1.5">
            STORE STORY & CUSTOMER GUARANTEE
          </label>
          <textarea
            rows={4}
            placeholder="Share your brand story, authentic product guarantee, and return policies..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white border-2 border-[#1E1E1E] px-4 py-2.5 text-[#1E1E1E] font-satoshi placeholder-[#444444] focus:outline-none resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t-2 border-[#1E1E1E]">
          <div>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-[#DB4A2B] font-bold uppercase">
                <Check className="w-4 h-4" />
                <span>Storefront settings saved successfully!</span>
              </span>
            )}
          </div>

          <BrutalistButton
            type="submit"
            disabled={saving}
            loading={saving}
            variant="primary"
          >
            <span>Save Storefront Settings</span>
          </BrutalistButton>
        </div>
      </form>
    </div>
  );
};

export default BusinessStorefrontPage;
