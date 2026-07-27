import React, { useState } from 'react';
import { AgendaEvent, TeamMember, AgendaCategory } from '../types';
import { X, Calendar, Clock, MapPin, Users, Mail, FileSpreadsheet, HardDrive, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { createAgenda } from '../lib/api';

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  agendas: AgendaEvent[];
  onAgendaCreated: () => void;
  initialDateIso?: string;
  initialParticipantIds?: string[];
}

export const AgendaModal: React.FC<AgendaModalProps> = ({
  isOpen,
  onClose,
  teamMembers,
  agendas,
  onAgendaCreated,
  initialDateIso,
  initialParticipantIds = [],
}) => {
  if (!isOpen) return null;

  // Initial date time helper
  const now = initialDateIso ? new Date(initialDateIso) : new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    now.setHours(9, 0, 0, 0);
  }
  const defaultStart = now.toISOString().slice(0, 16);
  const end = new Date(now.getTime() + 3600000);
  const defaultEnd = end.toISOString().slice(0, 16);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [category, setCategory] = useState<AgendaCategory>('Rapat Tim');
  const [location, setLocation] = useState('Google Meet');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/team-sync-room');
  const [organizerId, setOrganizerId] = useState(teamMembers[0]?.id || 'user-1');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    initialParticipantIds.length > 0 ? initialParticipantIds : [teamMembers[0]?.id || 'user-1']
  );
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [reminderMinutes, setReminderMinutes] = useState<number>(15);

  // Integration Toggles
  const [syncGCal, setSyncGCal] = useState(true);
  const [syncGSheets, setSyncGSheets] = useState(true);
  const [sendGmail, setSendGmail] = useState(true);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // CONFLICT DETECTION ENGINE
  const checkConflicts = () => {
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    const conflicts: { participantName: string; conflictingTitle: string }[] = [];

    agendas.forEach((agenda) => {
      if (agenda.status === 'cancelled') return;
      const aStart = new Date(agenda.startTime).getTime();
      const aEnd = new Date(agenda.endTime).getTime();

      // Check overlap
      const hasTimeOverlap = startMs < aEnd && endMs > aStart;
      if (hasTimeOverlap) {
        selectedParticipants.forEach((pId) => {
          if (agenda.participantIds.includes(pId)) {
            const member = teamMembers.find((m) => m.id === pId);
            conflicts.push({
              participantName: member?.name || 'Peserta',
              conflictingTitle: agenda.title,
            });
          }
        });
      }
    });

    return conflicts;
  };

  const conflicts = checkConflicts();

  const toggleParticipant = (id: string) => {
    if (selectedParticipants.includes(id)) {
      if (selectedParticipants.length > 1) {
        setSelectedParticipants(selectedParticipants.filter((p) => p !== id));
      }
    } else {
      setSelectedParticipants([...selectedParticipants, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) {
      setErrorMessage('Harap isi judul dan rentang waktu agenda.');
      return;
    }

    if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      setErrorMessage('Waktu selesai harus setelah waktu mulai.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await createAgenda({
        title,
        description,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        category,
        location,
        meetingLink,
        organizerId,
        participantIds: selectedParticipants,
        priority,
        reminderMinutes: Number(reminderMinutes),
      });

      onAgendaCreated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan agenda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Jadwalkan Agenda Rapat Tim Baru
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Otomatis terhubung ke Google Calendar, Google Sheet Master, & Pengingat Email
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Conflict Alert Warning */}
        {conflicts.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Peringatan Bentrok Jadwal Deteksi Otomatis!
            </div>
            <p className="text-slate-600 pl-5">
              Beberapa peserta terpilih memiliki rapat lain di jam yang sama:
            </p>
            <ul className="list-disc pl-9 space-y-0.5 font-medium text-slate-800">
              {conflicts.map((c, i) => (
                <li key={i}>
                  <strong>{c.participantName}</strong> - "{c.conflictingTitle}"
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-700">Judul Agenda Rapat *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Sprint Planning & Sync Fitur Q3"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Kategori Agenda</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AgendaCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Rapat Tim">Rapat Tim</option>
                <option value="Client Demo">Client Demo</option>
                <option value="1-on-1">1-on-1</option>
                <option value="Review Proyek">Review Proyek</option>
                <option value="All-Hands">All-Hands</option>
                <option value="Workshop / Pelatihan">Workshop / Pelatihan</option>
              </select>
            </div>
          </div>

          {/* Time Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Waktu Mulai *
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-rose-600" /> Waktu Selesai *
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Location & Google Meet Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> Lokasi / Ruangan
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Google Meet / Ruang Rapat lt. 3"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Link Google Meet / Zoom</label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/abc-xyz"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Participants Multi-select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" /> Pilih Peserta Rapat Tim
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {teamMembers.map((member) => {
                const isSelected = selectedParticipants.includes(member.id);
                return (
                  <button
                    type="button"
                    key={member.id}
                    onClick={() => toggleParticipant(member.id)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <img src={member.avatar} alt={member.name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="truncate">{member.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reminder Timing & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-rose-500" /> Waktu Pengingat Email Otomatis
              </label>
              <select
                value={reminderMinutes}
                onChange={(e) => setReminderMinutes(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value={15}>15 Menit Sebelum Rapat</option>
                <option value={30}>30 Menit Sebelum Rapat</option>
                <option value={60}>1 Jam Sebelum Rapat</option>
                <option value={1440}>1 Hari (24 Jam) Sebelum Rapat</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Prioritas Rapat</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="low">Rendah (Fleksibel)</option>
                <option value="medium">Sedang (Standar)</option>
                <option value="high">Tinggi (Penting / Mandatori)</option>
              </select>
            </div>
          </div>

          {/* Description / Agenda Points */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Deskripsi & Poin Pembahasan Agenda</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tuliskan tujuan rapat, deliverable yang diharapkan, atau bahan siapan..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          {/* Automatic Workspace Integrations Checkbox Badges */}
          <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Integrasi Otomatis Google Workspace:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-800 p-2 rounded-lg border border-slate-700/80">
                <input
                  type="checkbox"
                  checked={syncGCal}
                  onChange={(e) => setSyncGCal(e.target.checked)}
                  className="rounded text-blue-500 focus:ring-0 cursor-pointer"
                />
                <span className="font-medium text-slate-200">Google Calendar</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-800 p-2 rounded-lg border border-slate-700/80">
                <input
                  type="checkbox"
                  checked={syncGSheets}
                  onChange={(e) => setSyncGSheets(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <span className="font-medium text-slate-200">Google Sheet Master</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-800 p-2 rounded-lg border border-slate-700/80">
                <input
                  type="checkbox"
                  checked={sendGmail}
                  onChange={(e) => setSendGmail(e.target.checked)}
                  className="rounded text-rose-500 focus:ring-0 cursor-pointer"
                />
                <span className="font-medium text-slate-200">Email Gmail Auto</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? 'Menyimpan & Syncing...' : 'Simpan & Kirim Undangan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
