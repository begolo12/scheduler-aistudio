import React from 'react';
import { NotificationLog } from '../types';
import { Mail, CheckCircle2, AlertCircle, Clock, Send, ShieldCheck } from 'lucide-react';

interface NotificationLogViewProps {
  logs: NotificationLog[];
}

export const NotificationLogView: React.FC<NotificationLogViewProps> = ({ logs }) => {
  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-xs px-3 py-1 rounded-full font-bold border border-rose-200 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" /> Gmail Gateway Online
          </div>
          <h2 className="text-xl font-bold text-slate-900">Log Notifikasi Email Gmail Otomatis</h2>
          <p className="text-xs text-slate-500 mt-1">
            Riwayat seluruh email pengingat, undangan rapat, dan pembaruan agenda yang terkirim ke anggota tim.
          </p>
        </div>

        <div className="bg-slate-100 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 flex items-center gap-2 border border-slate-200">
          <Mail className="w-4 h-4 text-rose-500" />
          <span>Total Terkirim: {logs.filter((l) => l.status === 'sent').length} Email</span>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden divide-y divide-slate-100">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Belum ada notifikasi email terkirim. Log akan terisi otomatis saat pengingat diaktifkan.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-5 sm:p-6 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold text-[10px] px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                      log.type === 'invitation'
                        ? 'bg-indigo-100 text-indigo-800'
                        : log.type === 'reminder'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {log.type === 'invitation' ? 'Undangan' : log.type === 'reminder' ? 'Pengingat H-Min' : 'Update'}
                  </span>

                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(log.sentAt).toLocaleString('id-ID')}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{log.subject}</h3>

                <p className="text-xs text-slate-500">
                  Penerima: <strong className="text-slate-800">{log.recipientName}</strong> ({log.recipientEmail})
                </p>
              </div>

              <div className="flex items-center gap-2">
                {log.status === 'sent' ? (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terkirim
                  </span>
                ) : (
                  <span className="bg-rose-50 text-rose-700 border border-rose-200 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Gagal
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
