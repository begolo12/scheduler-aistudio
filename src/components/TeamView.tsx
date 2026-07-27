import React, { useState } from 'react';
import { TeamMember, AgendaEvent, Department } from '../types';
import { Users, UserPlus, Search, Clock, Calendar, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { createTeamMember } from '../lib/api';

interface TeamViewProps {
  teamMembers: TeamMember[];
  agendas: AgendaEvent[];
  onTeamUpdated: () => void;
  onOpenNewAgendaWithParticipants?: (participantIds: string[]) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  teamMembers,
  agendas,
  onTeamUpdated,
  onOpenNewAgendaWithParticipants,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedForOverlap, setSelectedForOverlap] = useState<string[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);

  // New member form
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberDept, setNewMemberDept] = useState<Department>('Engineering');
  const [newMemberTitle, setNewMemberTitle] = useState('');

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName || !newMemberEmail) return;

    try {
      await createTeamMember({
        name: newMemberName,
        email: newMemberEmail,
        department: newMemberDept,
        jobTitle: newMemberTitle || 'Spesialis Tim',
        role: 'Member',
        status: 'Available',
        workingHours: { start: '08:30', end: '17:30' },
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      });

      setNewMemberName('');
      setNewMemberEmail('');
      setNewMemberTitle('');
      setIsAddingMember(false);
      onTeamUpdated();
    } catch (err: any) {
      alert('Gagal menambah anggota tim: ' + err.message);
    }
  };

  const toggleSelectMemberForOverlap = (id: string) => {
    if (selectedForOverlap.includes(id)) {
      setSelectedForOverlap(selectedForOverlap.filter((m) => m !== id));
    } else {
      setSelectedForOverlap([...selectedForOverlap, id]);
    }
  };

  const filteredMembers = teamMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = departmentFilter === 'all' || m.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Free-Time Overlap Finder Header */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Manajemen Anggota Tim & Penemu Jadwal Kosong
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Pilih anggota tim untuk mencari waktu luang bersama (mutually free slots) tanpa terjadi bentrok rapat.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingMember(!isAddingMember)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <UserPlus className="w-4 h-4" />
              + Tambah Anggota Tim
            </button>
          </div>
        </div>

        {/* Selected Members for Overlap Finder Bar */}
        {selectedForOverlap.length > 0 && (
          <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs text-indigo-900 flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                {selectedForOverlap.length} Anggota Dipilih untuk Rapat:
              </span>
              {selectedForOverlap.map((id) => {
                const member = teamMembers.find((m) => m.id === id);
                return (
                  <span
                    key={id}
                    className="bg-white text-indigo-800 text-xs font-bold px-3 py-1 rounded-xl border border-indigo-200 flex items-center gap-1"
                  >
                    {member?.name}
                  </span>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedForOverlap([])}
                className="text-xs text-slate-600 hover:text-slate-900 font-bold cursor-pointer px-2"
              >
                Batal
              </button>
              {onOpenNewAgendaWithParticipants && (
                <button
                  onClick={() => onOpenNewAgendaWithParticipants(selectedForOverlap)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs cursor-pointer"
                >
                  Jadwalkan Rapat Bersama
                </button>
              )}
            </div>
          </div>
        )}

        {/* Add Member Form Modal / Panel */}
        {isAddingMember && (
          <form
            onSubmit={handleAddMember}
            className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 animate-fade-in"
          >
            <h3 className="font-bold text-sm text-slate-900">Tambah Anggota Tim Perusahaan Baru</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                required
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                placeholder="Email Google Perusahaan"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                required
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Jabatan / Job Title"
                value={newMemberTitle}
                onChange={(e) => setNewMemberTitle(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={newMemberDept}
                onChange={(e) => setNewMemberDept(e.target.value as Department)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="HR">HR</option>
                <option value="Executive">Executive</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingMember(false)}
                className="px-3 py-1.5 text-xs text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Simpan Anggota
              </button>
            </div>
          </form>
        )}

        {/* Search & Department Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nama, email, atau jabatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['all', 'Engineering', 'Product', 'Marketing', 'Sales', 'HR', 'Executive'].map((dept) => (
              <button
                key={dept}
                onClick={() => setDepartmentFilter(dept)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  departmentFilter === dept
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {dept === 'all' ? 'Semua Departemen' : dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMembers.map((member) => {
          const isSelected = selectedForOverlap.includes(member.id);

          return (
            <div
              key={member.id}
              className={`bg-white p-6 rounded-3xl border transition shadow-xs space-y-4 relative ${
                isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10' : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-100 shadow-xs"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        member.status === 'Available'
                          ? 'bg-emerald-500 shadow-[0_0_8px_#22c55e]'
                          : member.status === 'In Meeting'
                          ? 'bg-rose-500'
                          : member.status === 'Busy'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    ></span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                    <p className="text-xs text-slate-500">{member.jobTitle}</p>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block mt-1 uppercase tracking-wider">
                      {member.department}
                    </span>
                  </div>
                </div>

                {/* Checkbox for Free-Time Overlap Selection */}
                <button
                  onClick={() => toggleSelectMemberForOverlap(member.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isSelected ? '✓ Dipilih' : '+ Pilih'}
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Email Google:</span>
                  <span className="font-mono text-[11px] text-slate-700 font-semibold">{member.email}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Jam Kerja:</span>
                  <span className="font-bold text-slate-800">{member.workingHours.start} - {member.workingHours.end}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Status Google Sync:</span>
                  {member.googleConnected ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Terhubung
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Offline
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-400">Rapat Minggu Ini:</span>
                  <span className="font-black text-slate-900">{member.meetingHoursThisWeek} Jam</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
