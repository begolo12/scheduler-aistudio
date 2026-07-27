import React from 'react';
import { CalendarDays, LayoutDashboard, Users, Bell, Plus, Building2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'calendar' | 'team' | 'notifications';
  setActiveTab: (tab: 'dashboard' | 'calendar' | 'team' | 'notifications') => void;
  onOpenNewAgendaModal: () => void;
  unreadNotificationsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewAgendaModal,
  unreadNotificationsCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Company Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">SyncTeams Scheduler</span>
                <span className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                  Bento Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Perencanaan Agenda & Terkoneksi Google Workspace</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard Real-time
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Kalender Agenda Tim
            </button>

            <button
              onClick={() => setActiveTab('team')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4" />
              Tim & Cari Jadwal
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition relative cursor-pointer ${
                activeTab === 'notifications'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Bell className="w-4 h-4" />
              Log Gmail
              {unreadNotificationsCount > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs"></span>
              )}
            </button>
          </nav>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewAgendaModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Jadwalkan Agenda Baru
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs font-medium">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 p-1 ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1 p-1 ${activeTab === 'calendar' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <CalendarDays className="w-4 h-4" />
            Kalender
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex flex-col items-center gap-1 p-1 ${activeTab === 'team' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <Users className="w-4 h-4" />
            Tim
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex flex-col items-center gap-1 p-1 ${activeTab === 'notifications' ? 'text-blue-600' : 'text-slate-500'}`}
          >
            <Bell className="w-4 h-4" />
            Notifikasi
          </button>
        </div>
      </div>
    </header>
  );
};
