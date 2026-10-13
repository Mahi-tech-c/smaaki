import React, { useContext, useState, useMemo, useRef, useEffect } from 'react';
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
  FileImage,
  Bell,
  Utensils,
  Volume2,
  VolumeX
} from 'lucide-react';
import { soundManager } from '../../utils/sound';
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
import { doc, getDoc, collection, query, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';

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
  const [qrTargetMode, setQrTargetMode] = useState('table'); // 'table' | 'home' | 'menu' | 'custom'
  const [selectedTableNumber, setSelectedTableNumber] = useState(1);
  const [customQrUrl, setCustomQrUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Audio Alert States & Engine
  const [isAudioMuted, setIsAudioMuted] = useState(() => soundManager.isMuted);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(() => {
    const ctx = soundManager.audioCtx;
    return Boolean(ctx && ctx.state === 'running');
  });

  const handleToggleSound = async () => {
    await soundManager.unlock();
    setIsAudioUnlocked(true);
    const muted = soundManager.toggleMute();
    setIsAudioMuted(muted);
    if (!muted) {
      soundManager.playTapSound();
    }
  };

  const handleUnlockAudio = async () => {
    const unlocked = await soundManager.unlock();
    setIsAudioUnlocked(unlocked);
    if (unlocked) {
      soundManager.playNewOrderChime();
    }
  };

  // Live Waiter Calls Management
  const [tableCalls, setTableCalls] = useState([]);
  const [isCallsModalOpen, setIsCallsModalOpen] = useState(false);
  const initialCallsLoadedRef = useRef(false);

  useEffect(() => {
    try {
      const q = query(collection(db, COLLECTIONS?.tableCalls || 'table_calls'));
      const unsub = onSnapshot(q, (snapshot) => {
        // Trigger waiter bell if new call added after initial load
        if (initialCallsLoadedRef.current) {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              const data = change.doc.data();
              if (!data.resolved) {
                soundManager.playWaiterBell();
              }
            }
          });
        } else {
          initialCallsLoadedRef.current = true;
        }

        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const active = list.filter(c => !c.resolved);
        active.sort((a, b) => {
          const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.createdAt || 0).getTime();
          const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
        setTableCalls(active);
      }, (err) => {
        console.warn("Table calls listener err:", err);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Table calls listener setup:", e);
    }
  }, []);

  // Live Kitchen Orders Listener for Incoming Order Chime
  const initialOrdersLoadedRef = useRef(false);
  useEffect(() => {
    try {
      const ordersQ = query(collection(db, COLLECTIONS?.orders || 'orders'));
      const unsub = onSnapshot(ordersQ, (snapshot) => {
        if (initialOrdersLoadedRef.current) {
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              soundManager.playNewOrderChime();
            }
          });
        } else {
          initialOrdersLoadedRef.current = true;
        }
      }, (err) => {
        console.warn("Orders sound listener err:", err);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Orders sound listener setup failed:", e);
    }
  }, []);

  const handleResolveCall = async (callId) => {
    try {
      await updateDoc(doc(db, COLLECTIONS?.tableCalls || 'table_calls', callId), {
        resolved: true,
        resolvedAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to resolve call:", e);
    }
  };

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

    if (qrTargetMode === 'table') {
      return `${cleanBase}/table/${selectedTableNumber}`;
    }
    if (qrTargetMode === 'home') {
      return `${cleanBase}/`;
    }
    if (qrTargetMode === 'menu') {
      return `${cleanBase}/menu`;
    }
    if (qrTargetMode === 'custom') {
      return customQrUrl.trim() || `${cleanBase}/`;
    }
    return `${cleanBase}/`;
  }, [qrTargetMode, selectedTableNumber, customQrUrl, settings.customDomain, settings.domain]);

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
    const fileName = qrTargetMode === 'table' 
      ? `Smaakenzzoo-Table-${selectedTableNumber}-QR.png` 
      : `${(settings.restaurantName || "Smaakenzzoo").replace(/\s+/g, '-')}-QR-Code.png`;
    downloadLink.download = fileName;
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

    // 1. Sleek Modern Pink Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, settings.primaryColor || "#db2777");
    gradient.addColorStop(0.5, "#be185d");
    gradient.addColorStop(1, "#831843");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. High-Tech Decorative Floating Ambient Circles
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath(); ctx.arc(0, 0, 600, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(width, height, 800, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(width, 200, 400, 0, Math.PI * 2); ctx.fill();

    // 3. Header Brand
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.font = "bold 80px 'Outfit', system-ui, sans-serif";
    ctx.fillText(settings.restaurantName || "Smaakenzzoo", width / 2, 190);
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "bold 28px 'Inter', system-ui, sans-serif";
    ctx.fillText(
      qrTargetMode === 'table'
        ? "ARTISANAL CAFE • WARANGAL, TELANGANA"
        : (settings.tagline ? settings.tagline.toUpperCase() : "DIGITAL STOREFRONT & MENU • SCAN TO ORDER"),
      width / 2, 
      250
    );

    // Table Badge (if table mode)
    if (qrTargetMode === 'table') {
      const badgeText = `TABLE ${String(selectedTableNumber).padStart(2, '0')}`;
      ctx.font = "900 46px 'Outfit', system-ui, sans-serif";
      const textWidth = ctx.measureText(badgeText).width;
      const pillW = textWidth + 80;
      const pillH = 70;
      const pillX = (width - pillW) / 2;
      const pillY = 285;

      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 35);
      ctx.fill();

      ctx.fillStyle = "#db2777";
      ctx.fillText(badgeText, width / 2, pillY + 50);
    }

    // 4. White Card Container for QR Code
    const boxSize = 820;
    const boxX = (width - boxSize) / 2;
    const boxY = qrTargetMode === 'table' ? 390 : 380;
    const radius = 60;

    // Card Glow / Drop Shadow with soft pink tint
    ctx.shadowColor = "rgba(131, 24, 67, 0.4)";
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
    ctx.font = "900 70px 'Outfit', system-ui, sans-serif";
    ctx.fillText(
      qrTargetMode === 'table' ? "SCAN TO ORDER & PAY" : "SCAN TO BROWSE & ORDER", 
      width / 2, 
      boxY + boxSize + 160
    );
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "500 32px 'Inter', system-ui, sans-serif";
    ctx.fillText(
      qrTargetMode === 'table'
        ? `Food freshly prepared & brought directly to Table ${selectedTableNumber}`
        : "Point your smartphone camera to open live catalog", 
      width / 2, 
      boxY + boxSize + 230
    );

    // 7. Footer Direct Link
    ctx.fillStyle = "#fbcfe8";
    ctx.font = "bold 30px 'Inter', system-ui, sans-serif";
    const displayDomain = resolvedQrUrl.replace(/^https?:\/\//, '');
    ctx.fillText(displayDomain, width / 2, height - 90);

    const finalJpegUrl = canvas.toDataURL("image/jpeg", 0.95);
    const downloadLink = document.createElement("a");
    downloadLink.href = finalJpegUrl;
    const flyerName = qrTargetMode === 'table'
      ? `Smaakenzzoo-Table-${selectedTableNumber}-QR-Flyer.jpg`
      : `${(settings.restaurantName || "Smaakenzzoo").replace(/\s+/g, '-')}-Menu-QR-Flyer.jpg`;
    downloadLink.download = flyerName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleBatchPrintTables = () => {
    const maxTables = Number(settings.maxTables) || 20;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const base = settings.customDomain 
      ? (settings.customDomain.startsWith('http') ? settings.customDomain : `https://${settings.customDomain}`)
      : (settings.domain ? (settings.domain.startsWith('http') ? settings.domain : `https://${settings.domain}`) : origin);
    const cleanBase = (base || origin).replace(/\/+$/, '');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let cardsHtml = '';
    for (let i = 1; i <= maxTables; i++) {
      const tableUrl = `${cleanBase}/table/${i}`;
      const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(tableUrl)}&color=db-27-77`;
      cardsHtml += `
        <div class="card">
          <div class="header">
            <div class="logo-title">${settings.restaurantName || 'Smaakenzzoo'}</div>
            <div class="tagline">Artisanal Cafe • Warangal</div>
          </div>
          <div class="table-badge">TABLE ${String(i).padStart(2, '0')}</div>
          <div class="qr-box">
            <img src="${qrImgUrl}" alt="QR Table ${i}" />
          </div>
          <div class="cta">SCAN TO ORDER & PAY</div>
          <div class="sub">Freshly prepared & served to your table</div>
          <div class="footer">${tableUrl.replace(/^https?:\/\//, '')}</div>
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Smaakenzzoo Table QRs (Tables 1 to ${maxTables})</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; margin: 0; padding: 0; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12mm; }
            .card { page-break-inside: avoid; border: 2.5px dashed #db2777; border-radius: 18px; padding: 22px; text-align: center; background: #fff; box-shadow: 0 4px 12px rgba(219,39,119,0.08); }
            .header { margin-bottom: 6px; }
            .logo-title { font-size: 26px; font-weight: 900; color: #db2777; letter-spacing: -0.5px; }
            .tagline { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
            .table-badge { display: inline-block; background: #db2777; color: #fff; font-size: 20px; font-weight: 900; padding: 6px 24px; border-radius: 30px; margin: 10px 0; }
            .qr-box { margin: 10px auto; width: 175px; height: 175px; padding: 10px; border: 2px solid #fce7f3; border-radius: 16px; background: #fff; }
            .qr-box img { width: 100%; height: 100%; display: block; }
            .cta { font-size: 15px; font-weight: 900; color: #0f172a; letter-spacing: 0.5px; margin-top: 8px; }
            .sub { font-size: 11px; color: #64748b; margin-top: 4px; }
            .footer { font-size: 10px; color: #db2777; font-weight: 700; margin-top: 8px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="grid">
            ${cardsHtml}
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
        onShowCalls={() => setIsCallsModalOpen(true)}
        waiterCallsCount={tableCalls.length}
        user={auth.currentUser}
        userRole={userRole}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <header className="lg:hidden bg-white border-b border-pink-100 p-4 flex items-center justify-between sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-pink-50 rounded-xl text-pink-600 cursor-pointer"
          >
            <MenuIcon size={24} />
          </button>
          <h1 className="text-xl font-bold text-pink-900">Admin Panel</h1>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                !isAudioMuted 
                  ? 'text-emerald-600 hover:bg-emerald-50' 
                  : 'text-gray-400 hover:bg-gray-100'
              }`}
              title={isAudioMuted ? "Sound Muted (Click to Unmute)" : "Kitchen Chimes Active"}
            >
              {isAudioMuted ? <VolumeX size={20} /> : <Volume2 size={20} className="text-emerald-600 animate-pulse" />}
            </button>

            <button
              onClick={() => setIsCallsModalOpen(true)}
              className="relative p-2 text-pink-600 hover:bg-pink-50 rounded-xl transition-colors cursor-pointer"
              title="Active Waiter Calls"
            >
              <Bell size={22} />
              {tableCalls.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white font-extrabold text-[10px] flex items-center justify-center animate-pulse">
                  {tableCalls.length}
                </span>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* Browser Audio Unlock Banner */}
          {!isAudioUnlocked && (
            <div 
              onClick={handleUnlockAudio}
              className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 cursor-pointer hover:bg-amber-100 transition-all shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-bounce">🔔</span>
                <div>
                  <p className="font-bold text-xs sm:text-sm">Browser audio is locked by default</p>
                  <p className="text-[11px] text-amber-700">Click anywhere or tap here to enable live kitchen chimes for incoming orders and waiter calls.</p>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-amber-500 text-white rounded-xl font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                Enable Audio
              </span>
            </div>
          )}

          {/* Breadcrumb / Title & Quick Sound Actions */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
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

            {/* Desktop Kitchen Audio Controls */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleSound}
                className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
                  !isAudioMuted
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-white border-pink-200 text-gray-500 hover:bg-pink-50/50'
                }`}
                title={isAudioMuted ? "Audio muted (Click to activate kitchen chimes)" : "Kitchen sound alerts active (Click to mute)"}
              >
                {isAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} className="text-emerald-600 animate-pulse" />}
                <span>{isAudioMuted ? 'Kitchen Sound: Muted' : 'Kitchen Sound: Active'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundManager.unlock();
                  soundManager.playNewOrderChime();
                }}
                className="px-3 py-2.5 bg-white border border-pink-200 hover:bg-pink-50 text-pink-700 rounded-2xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                title="Play sample kitchen chime"
              >
                <span>🔔 Test Chime</span>
              </button>
            </div>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setQrTargetMode('table')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 cursor-pointer ${
                      qrTargetMode === 'table'
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs ring-2 ring-pink-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span className="font-extrabold text-pink-600">Table QR</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-pink-100 text-pink-700">DINE-IN</span>
                    </span>
                    <span className="text-[10px] opacity-70">Dedicated /table/:id</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrTargetMode('home')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 cursor-pointer ${
                      qrTargetMode === 'home'
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-center justify-between">
                      <span>Home Page</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-emerald-100 text-emerald-700">DEFAULT</span>
                    </span>
                    <span className="text-[10px] opacity-70">Storefront (/)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrTargetMode('menu')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 cursor-pointer ${
                      qrTargetMode === 'menu'
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>Direct Menu</span>
                    <span className="text-[10px] opacity-70">Catalog (/menu)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQrTargetMode('custom')}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all text-left flex flex-col gap-0.5 cursor-pointer ${
                      qrTargetMode === 'custom'
                        ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span>Custom / IP</span>
                    <span className="text-[10px] opacity-70">Manual URL</span>
                  </button>
                </div>

                {/* Table Picker if Table Mode */}
                {qrTargetMode === 'table' && (
                  <div className="mt-3 p-3.5 bg-pink-50/70 rounded-2xl border border-pink-200/80 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-pink-900 flex items-center gap-1.5">
                        <Utensils size={14} className="text-pink-600" />
                        <span>Select Dine-In Table</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleBatchPrintTables}
                        className="px-3 py-1 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                      >
                        <Printer size={13} />
                        <span>Batch Print Tables 1–{Number(settings.maxTables) || 20}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        min={1}
                        max={Number(settings.maxTables) || 20}
                        value={selectedTableNumber}
                        onChange={(e) => setSelectedTableNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-24 px-3 py-1.5 text-sm font-black border border-pink-300 rounded-xl bg-white text-pink-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      <span className="text-xs text-pink-700 font-medium">
                        of {Number(settings.maxTables) || 20} total cafe tables
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {Array.from({ length: Math.min(10, Number(settings.maxTables) || 20) }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSelectedTableNumber(num)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedTableNumber === num
                              ? 'bg-pink-600 text-white shadow-xs'
                              : 'bg-white text-pink-700 border border-pink-200 hover:bg-pink-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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
                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
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
              <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-pink-50/70 via-rose-50/40 to-white rounded-3xl border border-pink-200/80 shadow-inner">
                <div className="p-4 bg-white rounded-3xl border-2 border-pink-100 shadow-xl shadow-pink-200/50">
                  <QRCodeCanvas 
                    id="qr-code-canvas"
                    value={resolvedQrUrl}
                    size={220}
                    level={"H"}
                    includeMargin={true}
                    fgColor={settings.primaryColor || "#db2777"}
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

                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-pink-700 bg-pink-100/90 px-3.5 py-1.5 rounded-full border border-pink-200/80">
                  <Check size={14} className="stroke-[2.5]" />
                  <span>
                    {qrTargetMode === 'table' 
                      ? `Signature Pink QR • Scans to Table ${selectedTableNumber}` 
                      : 'Signature Pink QR • Scans to Target URL'}
                  </span>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={downloadQR}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 hover:from-pink-700 hover:to-rose-600 text-white rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-pink-200 active:scale-98 cursor-pointer"
                >
                  <Printer size={16} />
                  <span>{qrTargetMode === 'table' ? `Download Table ${selectedTableNumber} Flyer` : 'Download Print Flyer'}</span>
                </button>

                <button
                  type="button"
                  onClick={downloadQRPngOnly}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-pink-700 border border-pink-200 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-pink-50 transition-all shadow-xs active:scale-98 cursor-pointer"
                >
                  <Download size={16} />
                  <span>Export Pink QR (PNG)</span>
                </button>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Live Waiter Calls Management Modal */}
      {isCallsModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh] animate-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Bell size={18} className="fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Active Waiter Calls</h3>
                  <p className="text-xs text-slate-400">{tableCalls.length} pending guest requests</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCallsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
              {tableCalls.length === 0 ? (
                <div className="text-center py-12 space-y-2 text-gray-400">
                  <Check size={36} className="mx-auto text-emerald-500" />
                  <h4 className="font-bold text-gray-900 text-sm">All Tables Attended</h4>
                  <p className="text-xs">No pending waiter calls from customers at this time.</p>
                </div>
              ) : (
                tableCalls.map((call) => (
                  <div 
                    key={call.id}
                    className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/50 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-gray-900">
                          Table {call.table}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                          {call.type === 'water' ? '💧 Drinking Water' :
                           call.type === 'bill' ? '🧾 Request Bill' :
                           call.type === 'clean' ? '🧹 Clear Table' : '🙋 Call Server'}
                        </span>
                      </div>
                      {call.note && (
                        <p className="text-xs text-gray-600 italic">
                          "{call.note}"
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400">
                        {call.createdAt ? new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleResolveCall(call.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm shrink-0"
                    >
                      Resolve
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AdminDashboard;
