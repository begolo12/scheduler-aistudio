import React, { useState } from 'react';
import { AgendaEvent, TeamMember } from '../types';
import { X, Calendar, Clock, MapPin, ExternalLink, Mail, HardDrive, FileText, CheckCircle2, Send, Save, Trash2 } from 'lucide-react';
import { saveMeetingNotes, triggerManualEmailReminder, deleteAgenda } from '../lib/api';

interface AgendaDetailModalProps {
  agenda: AgendaEvent | null;
  onClose: () => void;
  teamMembers: TeamMember[];
  onAgendaUpdated: () => void;
}

export const AgendaDetailModal: React.FC<AgendaDetailModalProps> = ({
  agenda,
  onClose,
  teamMembers,
  onAgendaUpdated,
}) => {
  if (!agenda) return null;

  const [notes, setNotes] = useState(agenda.meetingNotes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedMessage, setNotesSavedMessage] = useState<string | null>(null);

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSentMessage, setEmailSentMessage] = useState<string | null>(null);

  const organizer = teamMembers.find((m) => m.id === agenda.organizerId);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    setNotesSavedMessage(null);
    try {
      const updated = await saveMeetingNotes(agenda.id, notes);
      setNotesSavedMessage('Notula berhasil disimpan & diunggah ke Google Drive!');
      setTimeout(() => setNotesSavedMessage(null), 5000);
      onAgendaUpdated();
    } catch (err: any) {
      alert('Gagal menyimpan notula: ' + err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSendManualEmail = async () => {
    setSendingEmail(true);
    setEmailSentMessage(null);
    try {
      const result = await triggerManualEmailReminder(agenda.id);
      setEmailSentMessage(result.message);
      setTimeout(() => setEmailSentMessage(null), 5000);
      onAgendaUpdated();
    } catch (err: any) {
      alert('Gagal mengirim email pengingat: ' + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Apakah Anda yakin ingin membatalkan & menghapus agenda "${agenda.title}"?`)) {
      await deleteAgenda(agenda.id);
      onAgendaUpdated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-6 my-8 animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-blue-800 font-bold text-[10px] px-2 py-0.5 rounded uppercase">
                {agenda.category}
              </span>
              <span className="text-xs text-slate-500">
                Prioritas: <strong className="capitalize">{agenda.priority}</strong>
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{agenda.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              title="Hapus Agenda"
              className="p-2 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Meeting Details Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{new Date(agenda.startTime).toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>
                {new Date(agenda.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {new Date(agenda.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <MapPin className="w-4 h-4 text-rose-600" />
              <span>{agenda.location || 'Google Meet'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-slate-400">Penyelenggara / Host:</span>
              <span className="font-bold text-slate-800 ml-1.5">{organizer?.name || 'Admin'}</span>
            </div>

            <div>
              <span className="text-slate-400">Status Google Calendar:</span>
              {agenda.googleCalendarHtmlLink ? (
                <a
                  href={agenda.googleCalendarHtmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-bold ml-1.5 inline-flex items-center gap-1 hover:underline"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Terhubung GCal
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-slate-500 ml-1.5">Standar Local</span>
              )}
            </div>

            <div>
              <span className="text-slate-400">Link Rapat:</span>
              <a
                href={agenda.meetingLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-bold ml-1.5 truncate max-w-[200px] inline-block hover:underline"
              >
                {agenda.meetingLink || 'Buka Google Meet'}
              </a>
            </div>
          </div>
        </div>

        {/* Participant Avatars & Email Status */}
        <div className="space-y-2">
          <h3 className="font-bold text-xs text-slate-900">
            Daftar Peserta Rapat ({agenda.participantIds.length} Orang)
          </h3>
          <div className="flex flex-wrap gap-2">
            {agenda.participantIds.map((pId) => {
              const member = teamMembers.find((m) => m.id === pId);
              return (
                <div
                  key={pId}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs"
                >
                  <img
                    src={member?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt="Member"
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <span className="font-semibold text-slate-800">{member?.name || 'Anggota Tim'}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({member?.email})</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action: Send Manual Instant Email Reminder */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <h4 className="font-bold flex items-center gap-1.5 text-sm">
              <Mail className="w-4 h-4 text-rose-400" /> Kirim Pengingat Email Seketika (Instant Gmail)
            </h4>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Kirim email pengingat otomatis sekarang ke seluruh email Google peserta rapat.
            </p>
            {emailSentMessage && (
              <p className="text-emerald-400 font-semibold mt-1 animate-fade-in">{emailSentMessage}</p>
            )}
          </div>

          <button
            onClick={handleSendManualEmail}
            disabled={sendingEmail}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Send className={`w-3.5 h-3.5 ${sendingEmail ? 'animate-bounce' : ''}`} />
            {sendingEmail ? 'Mengirim Email...' : 'Kirim Email Sekarang'}
          </button>
        </div>

        {/* Notula / Meeting Notes Editor & Save to Google Drive */}
        <div className="space-y-2 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Catatan & Notula Rapat (Google Drive Doc)</h3>
            </div>
            {agenda.notulaDriveLink && (
              <a
                href={agenda.notulaDriveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1"
              >
                <HardDrive className="w-3.5 h-3.5 text-amber-500" /> Buka Dokumen Notula di Google Drive
              </a>
            )}
          </div>

          <textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tuliskan hasil diskusi, keputusan rapat, action items, serta pendelegasian tugas di sini..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          ></textarea>

          {notesSavedMessage && (
            <p className="text-emerald-600 font-semibold text-xs animate-fade-in">{notesSavedMessage}</p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingNotes ? 'Menyimpan ke Drive...' : 'Simpan Notula & Upload ke Google Drive'}
            </button>
          </div>
        </div>

        {/* Attached Google Drive Files */}
        {agenda.driveFiles && agenda.driveFiles.length > 0 && (
          <div className="space-y-2 border-t border-slate-100 pt-4 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-amber-500" /> Dokumen & Lampiran Google Drive ({agenda.driveFiles.length})
            </h3>
            <div className="space-y-1.5">
              {agenda.driveFiles.map((file) => (
                <div
                  key={file.id}
                  className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <h4 className="font-bold text-slate-800">{file.name}</h4>
                      <p className="text-[10px] text-slate-400">
                        {file.size || 'Google Doc'} • Diunggah {new Date(file.uploadedAt).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>

                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      Buka Dokumen <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
