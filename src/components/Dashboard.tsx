import React from 'react';
import { ProductivityMetrics, TeamMember, AgendaEvent } from '../types';
import { TrendingUp, Clock, Users, AlertTriangle, Lightbulb, CheckCircle2, ArrowUpRight, Calendar, Sparkles } from 'lucide-react';

interface DashboardProps {
  metrics: ProductivityMetrics;
  teamMembers: TeamMember[];
  agendas: AgendaEvent[];
  onOpenAgendaDetail: (agenda: AgendaEvent) => void;
  onOpenNewAgendaModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  teamMembers,
  agendas,
  onOpenAgendaDetail,
  onOpenNewAgendaModal,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Callout */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800/80 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Bento Real-time Workspace Sync
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Dashboard Produktivitas Tim</h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Pantau beban rapat tim, tingkat keterisian jadwal, dan sinkronisasi otomatis Google Calendar, Sheets, Drive & Gmail.
            </p>
          </div>
          <button
            onClick={onOpenNewAgendaModal}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 self-start md:self-auto cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            + Jadwalkan Agenda
          </button>
        </div>
      </div>

      {/* Bento Grid Top Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Productivity Hero Metric Bento Card (Deep Dark Blue Card) */}
        <div className="md:col-span-5 bg-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-900/60 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-200/80">Skor Produktivitas Tim</h3>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                OPTIMUM
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-5xl font-black text-white">{metrics.productivityScore}%</span>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-0.5">
                <ArrowUpRight className="w-4 h-4" /> +4.2%
              </span>
            </div>

            {/* Micro Bar Chart Visualizer */}
            <div className="flex items-end gap-2 h-16 pt-2">
              <div className="flex-1 bg-white/20 rounded-t-sm h-[40%] hover:bg-white/30 transition"></div>
              <div className="flex-1 bg-white/20 rounded-t-sm h-[60%] hover:bg-white/30 transition"></div>
              <div className="flex-1 bg-white/20 rounded-t-sm h-[80%] hover:bg-white/30 transition"></div>
              <div className="flex-1 bg-indigo-400 rounded-t-sm h-[100%] shadow-[0_0_12px_#818cf8]"></div>
              <div className="flex-1 bg-white/20 rounded-t-sm h-[70%] hover:bg-white/30 transition"></div>
            </div>
            <div className="mt-3 flex justify-between text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest">
              <span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards Bento Grid */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Agenda Minggu Ini</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-900">{metrics.totalMeetingsThisWeek}</span>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Synced to Google Calendar</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Durasi Rapat</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-900">{metrics.totalMeetingHoursThisWeek}j</span>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Avg {metrics.avgMeetingDurationMinutes} m / rapat</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kapasitas Beban</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-900">{metrics.teamWorkloadScore}%</span>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${metrics.teamWorkloadScore}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Department Workload Breakdown & AI Actionable Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Workload Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Distribusi Beban Rapat per Departemen</h2>
              <p className="text-xs text-slate-500">Evaluasi durasi rapat dan alokasi waktu kerja anggota tim</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-xl border border-slate-200">
              {metrics.departmentStats.length} Departemen Aktif
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {metrics.departmentStats.map((dept) => (
              <div key={dept.department} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{dept.department}</span>
                    <span className="text-slate-400">({dept.memberCount} Orang)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 font-medium">{dept.totalMeetingHours} Jam</span>
                    <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                      dept.avgWorkload > 75
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : dept.avgWorkload > 55
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      Beban {dept.avgWorkload}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      dept.avgWorkload > 75
                        ? 'bg-rose-500'
                        : dept.avgWorkload > 55
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${dept.avgWorkload}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actionable Recommendations & Insights */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-slate-900">Rekomendasi Produktivitas</h2>
          </div>

          <div className="space-y-3">
            {metrics.actionableInsights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 rounded-2xl border text-xs space-y-1 ${
                  insight.type === 'warning'
                    ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                    : insight.type === 'tip'
                    ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                  {insight.type === 'tip' && <Lightbulb className="w-4 h-4 text-indigo-600" />}
                  {insight.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  <span>{insight.title}</span>
                </div>
                <p className="text-slate-600 leading-relaxed pl-5">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Team Availability & Live Agenda Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Availability Status Cards */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Team Presence</h2>
            <span className="text-xs text-slate-500 font-bold">{teamMembers.length} Anggota</span>
          </div>

          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition border border-slate-100 hover:border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      member.status === 'Available'
                        ? 'bg-emerald-500 shadow-[0_0_8px_#22c55e]'
                        : member.status === 'In Meeting'
                        ? 'bg-rose-500'
                        : member.status === 'Busy'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}></span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{member.name}</h4>
                    <p className="text-[11px] text-slate-500">{member.jobTitle}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    member.status === 'Available'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : member.status === 'In Meeting'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : member.status === 'Busy'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {member.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Agenda List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Agenda Hari Ini & Mendatang</h2>
              <p className="text-xs text-slate-500">Terhubung langsung ke Google Calendar & Email Notifikasi</p>
            </div>
            <button
              onClick={onOpenNewAgendaModal}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3.5 py-2 rounded-xl border border-indigo-200 cursor-pointer"
            >
              + Tambah Agenda
            </button>
          </div>

          <div className="space-y-3">
            {agendas.slice(0, 4).map((agenda) => {
              const organizer = teamMembers.find(m => m.id === agenda.organizerId);
              const isToday = new Date(agenda.startTime).toDateString() === new Date().toDateString();

              return (
                <div
                  key={agenda.id}
                  onClick={() => onOpenAgendaDetail(agenda)}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition cursor-pointer bg-white group space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                        agenda.category === 'Rapat Tim'
                          ? 'bg-indigo-100 text-indigo-800'
                          : agenda.category === 'Client Demo'
                          ? 'bg-amber-100 text-amber-800'
                          : agenda.category === 'All-Hands'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {agenda.category}
                      </span>
                      {isToday && (
                        <span className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                          Hari Ini
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      {new Date(agenda.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      {' - '}
                      {new Date(agenda.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition">
                    {agenda.title}
                  </h3>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px]">Host: <strong>{organizer?.name || 'Admin'}</strong></span>
                      <span>•</span>
                      <span className="text-[11px]">{agenda.participantIds.length} Peserta Tim</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      {agenda.googleCalendarHtmlLink && (
                        <span className="text-indigo-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Google Calendar
                        </span>
                      )}
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        Pengingat H-{agenda.reminderMinutes}m
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
