import React, { useEffect, useState } from 'react';
import {
  AgendaEvent,
  TeamMember,
  NotificationLog,
  GoogleWorkspaceStatus,
  ProductivityMetrics,
} from './types';
import {
  fetchAuthStatus,
  fetchTeamMembers,
  fetchAgendas,
  fetchNotificationLogs,
  fetchProductivityMetrics,
} from './lib/api';
import { GoogleWorkspaceBar } from './components/GoogleWorkspaceBar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { CalendarView } from './components/CalendarView';
import { TeamView } from './components/TeamView';
import { AgendaModal } from './components/AgendaModal';
import { AgendaDetailModal } from './components/AgendaDetailModal';
import { NotificationLogView } from './components/NotificationLogView';
import { initialTeamMembers, initialAgendas, initialNotificationLogs, initialProductivityMetrics } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'team' | 'notifications'>('dashboard');

  const [authStatus, setAuthStatus] = useState<GoogleWorkspaceStatus>({
    isAuthenticated: false,
    calendarSynced: false,
    sheetsSynced: false,
    driveSynced: false,
    gmailSynced: false,
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [agendas, setAgendas] = useState<AgendaEvent[]>(initialAgendas);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(initialNotificationLogs);
  const [metrics, setMetrics] = useState<ProductivityMetrics>(initialProductivityMetrics);

  // Modal States
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [modalInitialDateIso, setModalInitialDateIso] = useState<string | undefined>();
  const [modalInitialParticipantIds, setModalInitialParticipantIds] = useState<string[]>([]);
  const [selectedAgendaForDetail, setSelectedAgendaForDetail] = useState<AgendaEvent | null>(null);

  const reloadData = async () => {
    try {
      const status = await fetchAuthStatus();
      setAuthStatus(status);

      const team = await fetchTeamMembers();
      if (team && team.length > 0) setTeamMembers(team);

      const listAgendas = await fetchAgendas();
      if (listAgendas && listAgendas.length > 0) setAgendas(listAgendas);

      const logs = await fetchNotificationLogs();
      if (logs) setNotificationLogs(logs);

      const met = await fetchProductivityMetrics();
      if (met) setMetrics(met);
    } catch (err) {
      console.warn('Backend API reload offline or booting, using state fallback');
    }
  };

  useEffect(() => {
    reloadData();
    // Poll data every 10 seconds for real-time updates
    const interval = setInterval(reloadData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handlers
  const handleOpenNewAgendaModal = () => {
    setModalInitialDateIso(undefined);
    setModalInitialParticipantIds([]);
    setIsAgendaModalOpen(true);
  };

  const handleOpenNewAgendaWithDate = (dateIso: string) => {
    setModalInitialDateIso(dateIso);
    setModalInitialParticipantIds([]);
    setIsAgendaModalOpen(true);
  };

  const handleOpenNewAgendaWithParticipants = (participantIds: string[]) => {
    setModalInitialDateIso(undefined);
    setModalInitialParticipantIds(participantIds);
    setIsAgendaModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Google Workspace Connection & Status Bar */}
      <GoogleWorkspaceBar status={authStatus} onRefresh={reloadData} />

      {/* Main Company Header Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewAgendaModal={handleOpenNewAgendaModal}
        unreadNotificationsCount={notificationLogs.filter((l) => l.status === 'sent').length}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            metrics={metrics}
            teamMembers={teamMembers}
            agendas={agendas}
            onOpenAgendaDetail={(agenda) => setSelectedAgendaForDetail(agenda)}
            onOpenNewAgendaModal={handleOpenNewAgendaModal}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            agendas={agendas}
            teamMembers={teamMembers}
            onOpenAgendaDetail={(agenda) => setSelectedAgendaForDetail(agenda)}
            onOpenNewAgendaModalWithDate={handleOpenNewAgendaWithDate}
          />
        )}

        {activeTab === 'team' && (
          <TeamView
            teamMembers={teamMembers}
            agendas={agendas}
            onTeamUpdated={reloadData}
            onOpenNewAgendaWithParticipants={handleOpenNewAgendaWithParticipants}
          />
        )}

        {activeTab === 'notifications' && <NotificationLogView logs={notificationLogs} />}
      </main>

      {/* Modals */}
      <AgendaModal
        isOpen={isAgendaModalOpen}
        onClose={() => setIsAgendaModalOpen(false)}
        teamMembers={teamMembers}
        agendas={agendas}
        onAgendaCreated={reloadData}
        initialDateIso={modalInitialDateIso}
        initialParticipantIds={modalInitialParticipantIds}
      />

      <AgendaDetailModal
        agenda={selectedAgendaForDetail}
        onClose={() => setSelectedAgendaForDetail(null)}
        teamMembers={teamMembers}
        onAgendaUpdated={reloadData}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Team Sync - Enterprise Scheduler App. Built for High-Performance Company Workflows.</span>
          <span className="font-semibold text-slate-600">Terintegrasi Google Calendar, Sheets, Drive & Gmail</span>
        </div>
      </footer>
    </div>
  );
}
