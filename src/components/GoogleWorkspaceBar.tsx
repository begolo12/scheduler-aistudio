import React from 'react';
import { GoogleWorkspaceStatus } from '../types';
import { Calendar, FileSpreadsheet, HardDrive, Mail, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, LogIn, LogOut } from 'lucide-react';
import { getGoogleAuthUrl, logoutGoogle, syncAllToGoogleSheets } from '../lib/api';

interface GoogleWorkspaceBarProps {
  status: GoogleWorkspaceStatus;
  onRefresh: () => void;
}

export const GoogleWorkspaceBar: React.FC<GoogleWorkspaceBarProps> = ({ status, onRefresh }) => {
  const [syncing, setSyncing] = React.useState(false);
  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);

  const handleConnect = async () => {
    try {
      const url = await getGoogleAuthUrl();
      window.location.href = url;
    } catch (err: any) {
      alert('Gagal mengambil URL Google Auth: ' + err.message);
    }
  };

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari Akun Google?')) {
      await logoutGoogle();
      onRefresh();
    }
  };

  const handleSyncSheets = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncAllToGoogleSheets();
      setSyncMessage(`Berhasil sync ${result.totalSynced} agenda ke Google Sheet!`);
      setTimeout(() => setSyncMessage(null), 5000);
      onRefresh();
    } catch (err: any) {
      alert('Gagal sync ke Google Sheets: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-slate-200 px-4 py-2.5 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left Side: Connection Indicators */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Google Workspace Status:
          </span>

          <div className="flex items-center gap-3 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60">
            {/* Google Calendar */}
            <div className="flex items-center gap-1.5" title="Google Calendar Sync">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium">Calendar</span>
              {status.calendarSynced ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-400" />
              )}
            </div>

            <span className="text-slate-600">|</span>

            {/* Google Sheets */}
            <div className="flex items-center gap-1.5" title="Google Sheets Master Sync">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium">Sheets</span>
              {status.sheetsSynced ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-400" />
              )}
            </div>

            <span className="text-slate-600">|</span>

            {/* Google Drive */}
            <div className="flex items-center gap-1.5" title="Google Drive Storage">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium">Drive</span>
              {status.driveSynced ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-400" />
              )}
            </div>

            <span className="text-slate-600">|</span>

            {/* Gmail */}
            <div className="flex items-center gap-1.5" title="Gmail Automatic Notification Gateway">
              <Mail className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-medium">Gmail</span>
              {status.gmailSynced ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-400" />
              )}
            </div>
          </div>

          {syncMessage && (
            <span className="text-emerald-400 font-medium bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded text-[11px] animate-fade-in">
              {syncMessage}
            </span>
          )}
        </div>

        {/* Right Side: Account Actions & Sheet Shortcuts */}
        <div className="flex items-center gap-2">
          {status.isAuthenticated ? (
            <>
              <button
                onClick={handleSyncSheets}
                disabled={syncing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-2.5 py-1 rounded transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync ke Google Sheet'}
              </button>

              {status.masterSheetUrl && (
                <a
                  href={status.masterSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-2.5 py-1 rounded border border-slate-700 transition flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                  Buka Master Sheet
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              )}

              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-800">
                {status.user?.picture && (
                  <img src={status.user.picture} alt="User" className="w-5 h-5 rounded-full border border-slate-700" />
                )}
                <span className="font-medium text-slate-300 truncate max-w-[120px]">{status.user?.name}</span>
                <button
                  onClick={handleLogout}
                  title="Logout Google"
                  className="text-slate-400 hover:text-rose-400 p-1 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={handleConnect}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1 rounded transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              Login dengan Google Workspace
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
