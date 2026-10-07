import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../../context/AppContext';
import {
  Save, Palette, Phone, MapPin, Clock, Shield, Globe, Info,
  Check, RefreshCw, Camera, MessageCircle, Share2, IndianRupee,
  FileText, Image as ImageIcon, Search, AlertCircle, Lock,
  Eye, EyeOff, StickyNote, Loader2, KeyRound, Send, Sparkles, ExternalLink,
  X, ChevronDown
} from 'lucide-react';
import { auth } from '../../firebase';
import { DEFAULT_SETTINGS } from '../../context/AppContext';
import { HexColorPicker } from "react-colorful";

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 120, 144];
/* ─── Admin Notes Panel ───────────────────────────────────── */
const NotesPanel = () => {
  const { settings, updateSettings } = useContext(AppContext);
  const [prevNotes, setPrevNotes] = useState(settings.adminNotes);
  const [note, setNote] = useState(settings.adminNotes || '');
  const [saved, setSaved] = useState(false);

  if (settings.adminNotes !== prevNotes) {
    setPrevNotes(settings.adminNotes);
    setNote(settings.adminNotes || '');
  }

  const handleSave = async () => {
    await updateSettings({ ...settings, adminNotes: note });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-2">
        <StickyNote size={22} className="text-yellow-500" />
        <h4 className="font-black text-pink-900 uppercase tracking-widest text-sm">Admin Notes</h4>
      </div>
      <p className="text-xs text-pink-400 font-medium">Private notes — only visible to you in the admin panel. Use for reminders, to-do lists, supplier info, etc.</p>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        rows={12}
        placeholder="📝 Write your private notes here...&#10;&#10;e.g.&#10;- Restock chicken patties&#10;- Call supplier on Monday&#10;- Update weekend specials"
        className="w-full p-5 bg-yellow-50 border-2 border-yellow-200 rounded-3xl font-medium text-sm resize-none focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 leading-relaxed"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      />
      <button
        type="button"
        onClick={handleSave}
        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2 ${
          saved ? 'bg-green-500 text-white' : 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900'
        }`}
      >
        {saved ? <><Check size={18}/> Notes Saved!</> : <><Save size={18}/> Save Notes</>}
      </button>
    </div>
  );
};

/* ─── Security Panel ───────────────────────────────────────── */
const SecurityPanel = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const user = auth.currentUser;
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import('firebase/auth');
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.code === 'auth/wrong-password' ? 'Current password is incorrect.' : 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3">
        <KeyRound size={24} className="text-pink-600" />
        <h4 className="text-xl font-black text-pink-900 uppercase tracking-tight">Security & Access</h4>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black text-pink-900 uppercase tracking-wider">Current Password</label>
            <div className="relative">
              <input 
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-pink-500/10 font-bold"
                required
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-pink-900 uppercase tracking-wider">New Password</label>
            <div className="relative">
              <input 
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-pink-500/10 font-bold"
                required
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-pink-900 uppercase tracking-wider">Confirm New Password</label>
            <input 
              type={showNew ? "text" : "password"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-pink-500/10 font-bold"
              required
            />
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
          }`}>
            {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 bg-pink-600 hover:bg-pink-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Lock size={18} />}
          Update Password
        </button>
      </form>
    </div>
  );
};

// Reusable Field Component with Style Controls
const EditableField = ({ label, field, formData, handleChange, activeStyleField, setActiveStyleField, type = 'input', placeholder = '', icon: Icon, isDarkBg = false, extraAction = null }) => {
  const isStyleOpen = activeStyleField === field;
  const colorField = `${field}Color`;
  const sizeField = `${field}Size`;

  return (
    <div className="space-y-2 relative">
      <div className="flex justify-between items-center">
        <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${isDarkBg ? 'text-pink-200' : 'text-pink-900'}`}>
          {Icon && <Icon size={14} />} {label}
        </label>
        <div className="flex items-center gap-2">
          {extraAction}
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveStyleField(isStyleOpen ? null : field);
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
              isStyleOpen ? 'bg-pink-600 text-white shadow-lg shadow-pink-200 scale-105' : 'bg-gray-100 text-gray-400 hover:text-pink-600 hover:bg-pink-50'
            }`}
          >
            <Palette size={12} /> STYLE
          </button>
        </div>
      </div>

      <div className="relative">
        {type === 'textarea' ? (
          <textarea 
            value={formData[field] ?? DEFAULT_SETTINGS[field]} 
            onChange={e => handleChange(field, e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold h-24 resize-none focus:ring-2 focus:ring-pink-500 outline-none transition-all text-gray-900"
          />
        ) : (
          <input 
            value={formData[field] ?? DEFAULT_SETTINGS[field]} 
            onChange={e => handleChange(field, e.target.value)}
            placeholder={placeholder}
            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold focus:ring-2 focus:ring-pink-500 outline-none transition-all text-gray-900"
          />
        )}

        {/* Style Popover */}
        {isStyleOpen && (
          <div 
            onClick={e => e.stopPropagation()}
            className="absolute right-0 top-0 z-40 mt-2 p-5 bg-white rounded-[2.5rem] border border-pink-100 shadow-2xl animate-in fade-in zoom-in-95 duration-200 w-[280px]"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Palette size={14} className="text-pink-500" />
                <span className="text-[10px] font-black text-pink-900 uppercase tracking-widest">Text Styling</span>
              </div>
              <button type="button" onClick={() => setActiveStyleField(null)} className="p-1 hover:bg-pink-50 rounded-lg transition-colors">
                <X size={14} className="text-gray-400 hover:text-red-500" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Font Color</label>
                <div className="custom-color-picker">
                  <HexColorPicker 
                    color={formData[colorField] ?? DEFAULT_SETTINGS[colorField]} 
                    onChange={val => handleChange(colorField, val)} 
                  />
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-8 h-8 rounded-lg shadow-inner border border-white" style={{ backgroundColor: formData[colorField] ?? DEFAULT_SETTINGS[colorField] }} />
                  <input 
                    value={formData[colorField] ?? DEFAULT_SETTINGS[colorField]} 
                    onChange={e => handleChange(colorField, e.target.value)}
                    className="flex-1 bg-transparent text-xs font-mono font-bold text-gray-600 uppercase outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Font Size</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative group">
                    <select 
                      value={formData[sizeField] ?? DEFAULT_SETTINGS[sizeField]}
                      onChange={e => handleChange(sizeField, e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs appearance-none focus:ring-2 focus:ring-pink-500 outline-none cursor-pointer"
                    >
                      {FONT_SIZES.map(sz => (
                        <option key={sz} value={sz}>{sz} px</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                  <input 
                    type="number" 
                    value={formData[sizeField] ?? DEFAULT_SETTINGS[sizeField]} 
                    onChange={e => handleChange(sizeField, e.target.value)}
                    className="w-16 p-3 bg-gray-50 border border-gray-100 rounded-xl font-bold text-xs text-center focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ImageUploadField = ({ label, field, value, setFormData, setUploadTarget, fileInputRef, formData }) => (
  <div className="space-y-2">
    <label className="text-xs font-black text-pink-900 uppercase tracking-wider flex items-center gap-2">
      <ImageIcon size={14} /> {label}
    </label>
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-pink-100 bg-pink-50 flex items-center justify-center overflow-hidden flex-shrink-0">
        {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={20} className="text-pink-200" />}
      </div>
      <div className="flex-1 flex gap-2">
        <button type="button"
          onClick={() => { setUploadTarget(field); fileInputRef.current?.click(); }}
          className="flex-1 py-3 bg-white border border-pink-100 text-pink-600 rounded-xl font-bold text-xs hover:bg-pink-50 transition-all"
        >Upload</button>
        {value && (
          <button type="button"
            onClick={() => setFormData({ ...formData, [field]: '' })}
            className="px-4 py-3 bg-red-50 text-red-500 rounded-xl font-bold text-xs hover:bg-red-100 transition-all"
          >Clear</button>
        )}
      </div>
    </div>
  </div>
);

/* ─── Main Component ──────────────────────────────────────── */
const AdminSettings = ({ userRole }) => {
  const { settings, updateSettings } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('branding');
  const [formData, setFormData] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [activeStyleField, setActiveStyleField] = useState(null);

  useEffect(() => { 
    setFormData(settings); 
  }, [settings]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings(formData);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !uploadTarget) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [uploadTarget]: reader.result }));
      setUploadTarget(null);
    };
    reader.readAsDataURL(file);
  };

  const tabs = [
    { id: 'branding',   label: 'Branding',     icon: Palette     },
    { id: 'operation',  label: 'Operation',    icon: Clock       },
    { id: 'contact',    label: 'Connectivity', icon: Phone       },
    { id: 'menu',       label: 'Menu Tweaks',  icon: IndianRupee },
    { id: 'seo',        label: 'SEO & Meta',   icon: Search      },
    { id: 'security',   label: 'Security',     icon: Shield      },
    { id: 'notes',      label: 'Admin Notes',  icon: StickyNote  },
  ];

  if (userRole === 'superadmin') {
    tabs.push({ id: 'advanced', label: 'Advanced', icon: Shield });
  }

  const isFormTab = !['notes'].includes(activeTab);

  return (
    <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-pink-100/50 border border-pink-100">
        {/* Header */}
        <div className="bg-pink-600 p-8 text-white flex justify-between items-center rounded-t-[2.5rem]">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-widest mb-2">Global Settings</h2>
            <p className="text-pink-100 font-medium">Control your brand and operational configuration</p>
          </div>
          {isFormTab && (
            <button onClick={handleSave} disabled={isSaving}
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-pink-600 rounded-2xl font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
            >
              {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
              Save All
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Tabs */}
          <div className="w-full md:w-64 bg-pink-50/30 border-r border-pink-50 p-4 space-y-2 rounded-bl-[2.5rem]">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm ${
                  activeTab === tab.id
                    ? 'bg-white text-pink-600 shadow-sm border border-pink-100'
                    : 'text-gray-400 hover:bg-white/50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
                {tab.id === 'notes' && <span className="ml-auto text-[10px] bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-black">NEW</span>}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-8">
            {/* Independent panels (not in the main form) */}
            {activeTab === 'notes'    && <NotesPanel />}
            {activeTab === 'security' && <SecurityPanel />}

            {/* All other tabs are part of the save form */}
            {isFormTab && !['security'].includes(activeTab) && (
              <form onSubmit={handleSave} className="space-y-8">

                {activeTab === 'branding' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <EditableField label="Restaurant Name" field="restaurantName" icon={Info} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                      <EditableField label="Tagline / Slogan" field="tagline" icon={Globe} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ImageUploadField label="Restaurant Logo" field="logo" value={formData.logo} setFormData={setFormData} setUploadTarget={setUploadTarget} fileInputRef={fileInputRef} formData={formData} />
                      <ImageUploadField label="Browser Favicon" field="favicon" value={formData.favicon} setFormData={setFormData} setUploadTarget={setUploadTarget} fileInputRef={fileInputRef} formData={formData} />
                    </div>
                    <ImageUploadField label="Homepage Banner Image" field="homepageBanner" value={formData.homepageBanner} setFormData={setFormData} setUploadTarget={setUploadTarget} fileInputRef={fileInputRef} formData={formData} />
                    <div className="space-y-2">
                      <label className="text-xs font-black text-pink-900 uppercase tracking-wider flex items-center gap-2"><Palette size={14} /> Brand Primary Color</label>
                      <div className="flex gap-4 items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <input type="color" value={formData.primaryColor || '#db2777'}
                          onChange={e => handleChange('primaryColor', e.target.value)}
                          className="w-12 h-12 rounded-xl cursor-pointer border-none p-0 overflow-hidden shadow-sm" />
                        <input value={formData.primaryColor || '#db2777'}
                          onChange={e => handleChange('primaryColor', e.target.value)}
                          className="flex-1 bg-transparent font-mono text-sm uppercase" />
                        <div className="w-8 h-8 rounded-full shadow-inner" style={{ backgroundColor: formData.primaryColor || '#db2777' }} />
                      </div>
                    </div>
                    <div className="space-y-4 pt-6 border-t border-pink-50">
                      <h4 className="text-sm font-black text-pink-900 uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={16} /> Splash Screen (Loading) Styles
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-pink-900 uppercase tracking-wider flex items-center gap-2">Splash Background Color</label>
                          <div className="flex gap-4 items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <input type="color" value={formData.splashBgColor ?? DEFAULT_SETTINGS.splashBgColor}
                              onChange={e => handleChange('splashBgColor', e.target.value)}
                              className="w-12 h-12 rounded-xl cursor-pointer border-none p-0 overflow-hidden" />
                            <input value={formData.splashBgColor ?? DEFAULT_SETTINGS.splashBgColor}
                              onChange={e => handleChange('splashBgColor', e.target.value)}
                              className="flex-1 bg-transparent font-mono text-sm uppercase" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-pink-900 uppercase tracking-wider flex items-center gap-2">Splash Logo Size (px)</label>
                          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <input type="range" min="80" max="300" value={formData.splashLogoSize ?? DEFAULT_SETTINGS.splashLogoSize}
                              onChange={e => handleChange('splashLogoSize', e.target.value)}
                              className="flex-1 accent-pink-600" />
                            <span className="font-bold text-pink-600 w-12 text-center">{formData.splashLogoSize ?? DEFAULT_SETTINGS.splashLogoSize}px</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'operation' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center justify-between p-8 bg-pink-50 rounded-[2.5rem] border border-pink-100">
                      <div>
                        <h4 className="text-xl font-black text-pink-900 uppercase tracking-tight">Store Status</h4>
                        <p className="text-sm text-pink-400 font-bold">Instantly toggle your restaurant's availability</p>
                      </div>
                      <button type="button" onClick={() => handleChange('isOpen', !formData.isOpen)}
                        className={`w-20 h-10 rounded-full relative transition-all duration-300 ${formData.isOpen ? 'bg-green-500' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 w-8 h-8 bg-white rounded-full transition-all duration-300 ${formData.isOpen ? 'right-1' : 'left-1'} shadow-md flex items-center justify-center font-black text-[10px]`}>
                          {formData.isOpen ? 'ON' : 'OFF'}
                        </div>
                      </button>
                    </div>
                    <EditableField label="Business Hours (Daily)" field="openingHours" icon={Clock} placeholder="e.g. Mon-Sun: 11 AM - 11 PM" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <EditableField 
                        label="WhatsApp Ordering Number" 
                        field="whatsapp" 
                        icon={Phone} 
                        placeholder="e.g. 919876543210" 
                        formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField}
                        extraAction={formData.whatsapp && (
                          <a href={`https://wa.me/${formData.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" 
                             className="text-[10px] font-black text-pink-600 hover:underline flex items-center gap-1 mr-2">
                            <ExternalLink size={10} /> TEST CHAT
                          </a>
                        )}
                      />
                      <EditableField 
                        label="Google Maps Location URL" 
                        field="mapsUrl" 
                        icon={Globe} 
                        placeholder="https://goo.gl/maps/..." 
                        formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField}
                        extraAction={formData.mapsUrl && (
                          <a href={formData.mapsUrl} target="_blank" rel="noreferrer" 
                             className="text-[10px] font-black text-pink-600 hover:underline flex items-center gap-1 mr-2">
                            <ExternalLink size={10} /> TEST LOCATION
                          </a>
                        )}
                      />
                    </div>
                    <EditableField label="Full Address" field="address" icon={MapPin} type="textarea" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-pink-50">
                      {[
                        { label: 'Instagram', icon: Camera, field: 'instagram' },
                        { label: 'Facebook',  icon: MessageCircle,  field: 'facebook'  },
                        { label: 'Twitter (X)', icon: Share2,  field: 'twitter'  },
                      ].map(({ label, icon: Icon, field }) => (
                        <EditableField 
                          key={field}
                          label={label} 
                          field={field} 
                          icon={Icon} 
                          formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField}
                          extraAction={formData[field] && (
                            <a 
                              href={
                                formData[field].startsWith('http') 
                                  ? formData[field] 
                                  : field === 'instagram' ? `https://instagram.com/${formData[field]}`
                                  : field === 'facebook' ? `https://facebook.com/${formData[field]}`
                                  : `https://x.com/${formData[field]}`
                              } 
                              target="_blank" rel="noreferrer" 
                              className="text-[10px] font-black text-pink-600 hover:underline flex items-center gap-1 mr-1"
                            >
                              <ExternalLink size={10} /> TEST
                            </a>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'menu' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <EditableField label="Currency Symbol" field="currencySymbol" icon={IndianRupee} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                      <EditableField label="UPI ID (for Image Licensing & Payments)" field="upiId" icon={IndianRupee} placeholder="e.g. 9032578532@ybl" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                      <EditableField label="Tax Note" field="taxNote" icon={FileText} placeholder="e.g. GST extra / All taxes incl." formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                      <EditableField label="Wait Time Note" field="waitNote" icon={Clock} placeholder="e.g. 15 mins wait time" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                    </div>
                    <EditableField label="Stock Availability Note" field="availabilityNote" icon={Info} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                    <EditableField label="Menu Disclaimer" field="menuDisclaimer" icon={AlertCircle} type="textarea" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                  </div>
                )}

                {activeTab === 'seo' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                      <EditableField label="Google Search Title (Meta)" field="metaTitle" icon={Search} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                    </div>
                    <div className="space-y-2">
                      <EditableField label="Meta Description" field="metaDescription" icon={FileText} type="textarea" formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-pink-900 uppercase tracking-wider flex items-center gap-2"><Shield size={14} /> Google Site Verification (Code)</label>
                      <input value={formData.siteVerification || ''} onChange={e => setFormData({ ...formData, siteVerification: e.target.value })}
                        placeholder="e.g. your-verification-code"
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <EditableField label="Copyright Text (Footer)" field="copyrightText" icon={Check} formData={formData} handleChange={handleChange} activeStyleField={activeStyleField} setActiveStyleField={setActiveStyleField} />
                    </div>
                  </div>
                )}

                {activeTab === 'advanced' && userRole === 'superadmin' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl mb-8">
                      <h4 className="text-blue-900 font-black mb-2 flex items-center gap-2">
                        <Shield size={20} /> Developer Configuration
                      </h4>
                      <p className="text-blue-700 text-sm font-medium">
                        These settings connect your app to the Vercel API. Do not share these tokens with anyone.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-pink-900 uppercase tracking-wider">Vercel API Token</label>
                        <input 
                          type="password"
                          value={formData.vercelToken || ''} 
                          onChange={e => setFormData({ ...formData, vercelToken: e.target.value })}
                          placeholder="vct_..."
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-pink-900 uppercase tracking-wider">Vercel Project ID</label>
                        <input 
                          value={formData.vercelProjectId || ''} 
                          onChange={e => setFormData({ ...formData, vercelProjectId: e.target.value })}
                          placeholder="prj_..."
                          className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-8 border-t border-gray-100">
                  <button type="submit" disabled={isSaving}
                    className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${
                      saveStatus === 'success' ? 'bg-green-500' : 'bg-pink-600 hover:bg-pink-700'
                    } text-white shadow-pink-100`}
                  >
                    {isSaving ? <RefreshCw className="animate-spin" /> : saveStatus === 'success' ? <Check /> : <Save />}
                    {isSaving ? 'Saving Changes...' : saveStatus === 'success' ? 'Settings Updated!' : 'Save All Settings'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
