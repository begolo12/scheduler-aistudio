import React, { useState } from 'react';
import { AgendaEvent, TeamMember, AgendaCategory } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, Plus, Clock, Video, MapPin, CheckCircle2 } from 'lucide-react';

interface CalendarViewProps {
  agendas: AgendaEvent[];
  teamMembers: TeamMember[];
  onOpenAgendaDetail: (agenda: AgendaEvent) => void;
  onOpenNewAgendaModalWithDate?: (dateIso: string) => void;
}

type ViewMode = 'month' | 'week' | 'day' | 'list';

export const CalendarView: React.FC<CalendarViewProps> = ({
  agendas,
  teamMembers,
  onOpenAgendaDetail,
  onOpenNewAgendaModalWithDate,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // Navigate calendar date
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'day') d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'day') d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter agendas by category and department
  const filteredAgendas = agendas.filter((a) => {
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    if (selectedDepartment !== 'all') {
      const organizer = teamMembers.find((m) => m.id === a.organizerId);
      if (organizer?.department !== selectedDepartment) return false;
    }
    return true;
  });

  // Calculate Month Days Grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthGridDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    monthGridDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    monthGridDays.push(new Date(year, month, d));
  }

  const categoryList: AgendaCategory[] = [
    'Rapat Tim',
    'Client Demo',
    '1-on-1',
    'Review Proyek',
    'All-Hands',
    'Workshop / Pelatihan',
  ];

  return (
    <div className="space-y-5">
      {/* Top Header & Controls */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 border border-slate-200">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-white rounded-xl transition text-slate-700 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3.5 py-1 font-bold text-xs text-slate-700 hover:bg-white rounded-xl transition cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-white rounded-xl transition text-slate-700 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-xl font-bold text-slate-900 capitalize tracking-tight">
            {currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </h2>
        </div>

        {/* View Mode Toggle & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filters */}
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {categoryList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <span className="text-slate-300">|</span>

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Departemen</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Executive">Executive</option>
            </select>
          </div>

          {/* View Modes */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-medium">
            {(['month', 'week', 'day', 'list'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3.5 py-1.5 rounded-xl capitalize transition cursor-pointer font-bold ${
                  viewMode === mode
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode === 'month' ? 'Bulan' : mode === 'week' ? 'Minggu' : mode === 'day' ? 'Hari' : 'Daftar'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MONTH VIEW GRID */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div>Minggu</div>
            <div>Senin</div>
            <div>Selasa</div>
            <div>Rabu</div>
            <div>Kamis</div>
            <div>Jumat</div>
            <div>Sabtu</div>
          </div>

          {/* Month Days */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[500px]">
            {monthGridDays.map((date, idx) => {
              if (!date) {
                return <div key={`empty-${idx}`} className="bg-slate-50/50 p-2 min-h-[100px]"></div>;
              }

              const isToday = date.toDateString() === new Date().toDateString();
              const dayAgendas = filteredAgendas.filter(
                (a) => new Date(a.startTime).toDateString() === date.toDateString()
              );

              return (
                <div
                  key={date.toISOString()}
                  className={`p-2 min-h-[110px] transition group hover:bg-indigo-50/20 relative flex flex-col justify-between ${
                    isToday ? 'bg-indigo-50/30 font-bold' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                        isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {onOpenNewAgendaModalWithDate && (
                      <button
                        onClick={() => onOpenNewAgendaModalWithDate(date.toISOString())}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-slate-200/60 transition cursor-pointer"
                        title="Tambah Agenda di Tanggal Ini"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Agendas list in cell */}
                  <div className="space-y-1 my-1 flex-1 overflow-y-auto max-h-[90px] pr-0.5">
                    {dayAgendas.map((agenda) => (
                      <div
                        key={agenda.id}
                        onClick={() => onOpenAgendaDetail(agenda)}
                        className={`text-[11px] p-2 border-l-4 rounded-r-lg transition cursor-pointer truncate ${
                          agenda.category === 'Rapat Tim'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 hover:bg-indigo-100'
                            : agenda.category === 'Client Demo'
                            ? 'bg-amber-50 border-amber-500 text-amber-900 hover:bg-amber-100'
                            : agenda.category === 'All-Hands'
                            ? 'bg-purple-50 border-purple-500 text-purple-900 hover:bg-purple-100'
                            : 'bg-emerald-50 border-emerald-500 text-emerald-900 hover:bg-emerald-100'
                        }`}
                        title={`${agenda.title} (${new Date(agenda.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })})`}
                      >
                        <div className="font-bold truncate text-xs">{agenda.title}</div>
                        <div className="text-[10px] opacity-80 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(agenda.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {filteredAgendas.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Tidak ada agenda rapat ditemukan untuk filter ini.
            </div>
          ) : (
            filteredAgendas.map((agenda) => {
              const organizer = teamMembers.find((m) => m.id === agenda.organizerId);

              return (
                <div
                  key={agenda.id}
                  onClick={() => onOpenAgendaDetail(agenda)}
                  className="p-5 hover:bg-slate-50 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                        {agenda.category}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {new Date(agenda.startTime).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                      </span>
                      {agenda.googleCalendarHtmlLink && (
                        <span className="text-emerald-600 text-[11px] font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Synced GCal
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition">
                      {agenda.title}
                    </h3>

                    {agenda.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{agenda.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        {new Date(agenda.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(agenda.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>

                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{agenda.location || 'Google Meet'}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Host:</span>
                        <span className="font-semibold text-slate-800">{organizer?.name || 'Admin'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <button className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs px-3.5 py-2 rounded-xl border border-blue-200 transition">
                      Lihat Detail & Notula
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* WEEK & DAY VIEWS SIMPLE WRAPPER */}
      {(viewMode === 'week' || viewMode === 'day') && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">
            Tampilan {viewMode === 'week' ? 'Mingguan' : 'Harian'} Agenda Tim
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgendas.map((agenda) => (
              <div
                key={agenda.id}
                onClick={() => onOpenAgendaDetail(agenda)}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition cursor-pointer space-y-2 bg-slate-50/50"
              >
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  {agenda.category}
                </span>
                <h4 className="font-bold text-slate-900 text-sm">{agenda.title}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  {new Date(agenda.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - {new Date(agenda.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
