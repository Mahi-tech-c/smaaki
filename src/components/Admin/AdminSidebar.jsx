import { LayoutGrid, Gift, Settings, LogOut, X, ChevronRight, QrCode, Sparkles, Shield, Home, Globe } from 'lucide-react';

const AdminSidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout, onShowQr, user, userRole }) => {
  const menuItems = [
    { id: 'menu', label: 'Menu Items', icon: LayoutGrid, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'home_editor', label: 'Home Page', icon: Home, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'menu_editor', label: 'Menu Page', icon: Sparkles, color: 'text-pink-600', bg: 'bg-pink-50' },
    { id: 'featured', label: 'Featured Items', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'offers', label: 'Special Offers', icon: Gift, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'domain', label: 'Domain Setup', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'qr', label: 'Menu QR Code', icon: QrCode, color: 'text-pink-600', bg: 'bg-pink-50', isAction: true },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-600', bg: 'bg-gray-50' },
  ];

  if (userRole === 'superadmin') {
    menuItems.push({ id: 'team', label: 'Team / Admins', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' });
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-pink-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-pink-100 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full flex flex-col p-6">
          {/* Logo Section */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="bg-pink-600 p-2 rounded-xl text-white shadow-lg shadow-pink-100">
                <LayoutGrid size={20} />
              </div>
              <span className="text-xl font-bold text-pink-900">Smaakenzzoo</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 hover:bg-pink-50 rounded-xl text-pink-400"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.isAction) {
                      onShowQr();
                    } else {
                      setActiveTab(item.id);
                    }
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                    isActive 
                      ? `${item.bg} ${item.color} shadow-sm border border-pink-100/50` 
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={isActive ? item.color : 'text-gray-400 group-hover:text-gray-600'} />
                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  </div>
                  {!item.isAction && isActive && <ChevronRight size={16} className="opacity-50" />}
                </button>
              );
            })}
          </nav>

          {/* Logout Section */}
          <div className="mt-auto pt-6 border-t border-pink-50 space-y-2">
            {user && (
              <div className="px-4 py-3 bg-pink-50 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 font-bold uppercase">
                  {(user.phoneNumber || user.email || 'A')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-pink-500 font-black uppercase tracking-wider">Logged In</p>
                  <p className="text-sm font-black text-pink-900 truncate">
                    {user.phoneNumber || user.email || 'Admin User'}
                  </p>
                </div>
              </div>
            )}
            <button 
              onClick={onLogout}
              className="w-full flex items-center gap-3 p-4 text-red-500 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
