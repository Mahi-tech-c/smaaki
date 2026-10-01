import React, { useContext, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AppContext } from '../../context/AppContext';
import { 
  X, 
  Download, 
  Menu as MenuIcon, 
  Coffee, 
  Shield, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  Globe, 
  Smartphone, 
  Sparkles,
  Printer,
  FileImage
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import AdminItemForm from './AdminItemForm';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminMenuItems from './AdminMenuItems';
import AdminOffers from './AdminOffers';
import AdminFeatured from './AdminFeatured';
import AdminSettings from './AdminSettings';
import AdminMenuEditor from './AdminMenuEditor';
import AdminHomeEditor from './AdminHomeEditor';
import AdminDomainManager from './AdminDomainManager';
import AdminUsersPanel from './AdminUsersPanel';

import { auth, db, COLLECTIONS } from '../../firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AdminDashboard = () => {
  const { deleteItem, settings } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('menu');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  React.useEffect(() => {
    const fetchRole = async () => {
      if (auth.currentUser) {
        try {
          const snap = await getDoc(doc(db, COLLECTIONS.adminRoles, auth.currentUser.uid));
          if (snap.exists()) {
            setUserRole(snap.data().status);
          }
        } catch (e) {
          console.error("Failed to fetch role", e);
        }
      }
    };
    fetchRole();
  }, []);
  
  // Menu Item States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  // Developer QR Management States
  const [qrTargetMode, setQrTargetMode] = useState('menu'); // 'menu' | 'home' | 'custom'
  const [customQrUrl, setCustomQrUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    navigate('/admin/login');
  };

  // Compute the live resolved target URL for the QR code
  const resolvedQrUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const base = settings.customDomain 
      ? (settings.customDomain.startsWith('http') ? settings.customDomain : `https://${settings.customDomain}`)
      : (settings.domain ? (settings.domain.startsWith('http') ? settings.domain : `https://${settings.domain}`) : origin);
    
    const cleanBase = (base || origin).replace(/\/+$/, '');

    if (qrTargetMode === 'menu') {
      return `${cleanBase}/menu`;
    }
    if (qrTargetMode === 'home') {
      return `${cleanBase}/`;
    }
    if (qrTargetMode === 'custom') {
      return customQrUrl.trim() || `${cleanBase}/menu`;
    }
    return `${cleanBase}/menu`;
  }, [qrTargetMode, customQrUrl, settings.customDomain, settings.domain]);

  const copyQrUrl = () => {
    navigator.clipboard.writeText(resolvedQrUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const downloadQRPngOnly = () => {
    const originalCanvas = document.getElementById("qr-code-canvas");
    if (!originalCanvas) return;
    const pngUrl = originalCanvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${(settings.restaurantName || "Smaakii").replace(/\s+/g, '-')}-QR-Code.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const downloadQR = async () => {
    const originalCanvas = document.getElementById("qr-code-canvas");
    if (!originalCanvas) return;

    const width = 1200;
    const height = 1800;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // 1. Sleek Modern Dark Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#09090b");
    gradient.addColorStop(0.4, "#18181b");
    gradient.addColorStop(1, "#000000");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. High-Tech Dot Matrix Grid Background
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    for (let x = 40; x < width; x += 50) {
      for (let y = 40; y < height; y += 50) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Header Brand
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.font = "bold 85px 'Outfit', system-ui, sans-serif";
    ctx.fillText(settings.restaurantName || "Smaakii", width / 2, 210);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = "bold 32px 'Inter', system-ui, sans-serif";
    ctx.fillText("DIGITAL E-COMMERCE MENU • SCAN TO ORDER", width / 2, 290);

    // 4. White Card Container for QR Code
    const boxSize = 820;
    const boxX = (width - boxSize) / 2;
    const boxY = 380;
    const radius = 60;

    // Card Glow / Drop Shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 25;

    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(boxX + radius, boxY);
    ctx.lineTo(boxX + boxSize - radius, boxY);
    ctx.quadraticCurveTo(boxX + boxSize, boxY, boxX + boxSize, boxY + radius);
    ctx.lineTo(boxX + boxSize, boxY + boxSize - radius);
    ctx.quadraticCurveTo(boxX + boxSize, boxY + boxSize, boxX + boxSize - radius, boxY + boxSize);
    ctx.lineTo(boxX + radius, boxY + boxSize);
    ctx.quadraticCurveTo(boxX, boxY + boxSize, boxX, boxY + boxSize - radius);
    ctx.lineTo(boxX, boxY + radius);
    ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
    ctx.closePath();
    ctx.fill();

    // Reset Shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 5. Draw QR Canvas
    const qrSize = 680;
    const qrPadding = (boxSize - qrSize) / 2;
    ctx.drawImage(originalCanvas, boxX + qrPadding, boxY + qrPadding, qrSize, qrSize);

    // 6. Action Callouts
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 75px 'Outfit', system-ui, sans-serif";
    ctx.fillText("SCAN TO BROWSE & ORDER", width / 2, boxY + boxSize + 170);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.font = "500 36px 'Inter', system-ui, sans-serif";
    ctx.fillText("Point your smartphone camera to open live catalog", width / 2, boxY + boxSize + 245);

    // 7. Footer Direct Link
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 32px 'Inter', system-ui, sans-serif";
    const displayDomain = resolvedQrUrl.replace(/^https?:\/\//, '');
    ctx.fillText(displayDomain, width / 2, height - 90);

    const finalJpegUrl = canvas.toDataURL("image/jpeg", 0.95);
    const downloadLink = document.createElement("a");
    downloadLink.href = finalJpegUrl;
    downloadLink.download = `${(settings.restaurantName || "Smaakii").replace(/\s+/g, '-')}-Menu-QR-Flyer.jpg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="flex min-h-screen bg-pink-50/20">
      {/* Sidebar */}
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={handleLogout}
        onShowQr={() => setIsQrModalOpen(true)}
        user={auth.currentUser}
        userRole={userRole}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="lg:hidden bg-white border-b border-pink-100 p-4 flex items-center justify-between sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-pink-50 rounded-xl text-pink-600"
          >
            <MenuIcon size={24} />
          </button>
          <h1 className="text-xl font-bold text-pink-900">Admin Panel</h1>
          <div className="w-10"></div> {/* Spacer */}
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Breadcrumb / Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-pink-900 capitalize tracking-tight">
              {activeTab === 'menu' ? 'Menu Management' : 
               activeTab === 'home_editor' ? 'Home Page Content' :
               activeTab === 'menu_editor' ? 'Menu Page Content' :
               activeTab === 'domain' ? 'Domain Setup' :
               activeTab === 'offers' ? 'Special Offers' : 
               activeTab === 'featured' ? 'Featured Items' : 'Global Configuration'}
            </h2>
            <p className="text-pink-500 font-medium">Manage your restaurant content and appearance</p>
          </div>

          {/* Module Switching */}
          {activeTab === 'menu' && (
            <AdminMenuItems 
              onAdd={() => { setEditingItem(null); setIsFormOpen(true); }}
              onEdit={(item) => { setEditingItem(item); setIsFormOpen(true); }}
              onDelete={(item) => setItemToDelete(item)}
              onGetQr={() => setIsQrModalOpen(true)}
            />
          )}

          {activeTab === 'menu_editor' && (
            <AdminMenuEditor />
          )}

          {activeTab === 'home_editor' && (
            <AdminHomeEditor />
          )}

          {activeTab === 'domain' && (
            <AdminDomainManager />
          )}

          {activeTab === 'offers' && (
            <AdminOffers />
          )}

          {activeTab === 'featured' && (
            <AdminFeatured />
          )}

          {activeTab === 'settings' && (
            <AdminSettings userRole={userRole} />
          )}

          {activeTab === 'team' && userRole === 'superadmin' && (
            <AdminUsersPanel />
          )}

          {activeTab === 'team' && userRole !== 'superadmin' && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Shield size={48} className="text-pink-300 mb-4" />
              <h2 className="text-2xl font-black text-pink-900 mb-2">Access Denied</h2>
              <p className="text-pink-500 font-medium">Only the Master Administrator can manage the team.</p>
            </div>
          )}
        </main>
      </div>

      {/* Shared Modals */}
      {isFormOpen && (
        <AdminItemForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          item={editingItem}
        />
      )}

      {itemToDelete && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-pink-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center border border-pink-100">
            <h3 className="text-xl font-bold text-pink-900 mb-2">Delete Item?</h3>
            <p className="text-pink-600 mb-6">Delete <span className="font-bold">"{itemToDelete.name}"</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setItemToDelete(null)} className="flex-1 px-4 py-3 border border-pink-200 rounded-xl font-bold">Cancel</button>
              <button 
                onClick={async () => { await deleteItem(itemToDelete.id); setItemToDelete(null); }}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isQrModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100 relative animate-in fade-in zoom-in duration-200 my-8">
            
            {/* Executive Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <QrCode size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">QR Dispatch & Menu Gateway</h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Manage scan-to-order destinations and generate print flyers</p>
                </div>
              </div>
              <button 
                onClick={() => setIsQrModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Route Destination Selector */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2">
                  1. Scan Destination Route
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQrTargetMode('menu')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 ${
                      qrTargetMode === 'menu'
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>E-Commerce Menu</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                        qrTargetMode === 'menu' ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-100 text-emerald-700'
                      }`}>NEW</span>
                    </span>
                    <span className="text-[10px] opacity-70">Direct to /menu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrTargetMode('home')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 ${
                      qrTargetMode === 'home'
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>Storefront</span>
                    <span className="text-[10px] opacity-70">Root page /</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrTargetMode('custom')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 ${
                      qrTargetMode === 'custom'
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>Custom / Wi-Fi IP</span>
                    <span className="text-[10px] opacity-70">Manual URL override</span>
                  </button>
                </div>

                {qrTargetMode === 'custom' && (
                  <div className="mt-3 animate-in fade-in">
                    <input
                      type="url"
                      placeholder="e.g. http://192.168.1.15:5173/menu or https://smaakii.vercel.app/menu"
                      value={customQrUrl}
                      onChange={e => setCustomQrUrl(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs font-medium border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-950"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Tip: Enter your computer's local Wi-Fi IP to test scanning directly on your mobile device.
                    </p>
                  </div>
                )}
              </div>

              {/* Live Encoded URL Bar */}
              <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-0.5">
                    Encoded Target URL
                  </span>
                  <div className="font-mono text-xs font-bold text-gray-900 truncate">
                    {resolvedQrUrl}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={copyQrUrl}
                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Copy URL"
                  >
                    {copiedUrl ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                  <a
                    href={resolvedQrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                    title="Test Open in New Tab"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* QR Code Presentation Box */}
              <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-50 to-white rounded-3xl border border-gray-200/80">
                <div className="p-4 bg-white rounded-2xl border border-gray-200/60 shadow-lg">
                  <QRCodeCanvas 
                    id="qr-code-canvas"
                    value={resolvedQrUrl}
                    size={220}
                    level={"H"}
                    includeMargin={true}
                    fgColor={"#09090b"}
                    imageSettings={settings.logo ? {
                      src: settings.logo,
                      x: undefined,
                      y: undefined,
                      height: 42,
                      width: 42,
                      excavate: true,
                    } : undefined}
                  />
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/50">
                  <Check size={14} />
                  <span>Configured for New E-Commerce Page View</span>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={downloadQR}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-950 text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-black transition-all shadow-md active:scale-98"
                >
                  <Printer size={16} />
                  <span>Download Print Flyer</span>
                </button>

                <button
                  type="button"
                  onClick={downloadQRPngOnly}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-gray-800 border border-gray-200 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition-all shadow-xs active:scale-98"
                >
                  <Download size={16} />
                  <span>Export QR Only (PNG)</span>
                </button>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminDashboard;
