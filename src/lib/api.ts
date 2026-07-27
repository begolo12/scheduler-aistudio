import { AgendaEvent, TeamMember, NotificationLog, GoogleWorkspaceStatus, ProductivityMetrics } from '../types';

export async function fetchAuthStatus(): Promise<GoogleWorkspaceStatus> {
  try {
    const res = await fetch('/api/auth/status');
    if (!res.ok) throw new Error('Failed to fetch auth status');
    return await res.json();
  } catch (err) {
    return {
      isAuthenticated: false,
      calendarSynced: false,
      sheetsSynced: false,
      driveSynced: false,
      gmailSynced: false,
    };
  }
}

export async function getGoogleAuthUrl(): Promise<string> {
  const res = await fetch('/api/auth/url');
  const data = await res.json();
  return data.url;
}

export async function logoutGoogle(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const res = await fetch('/api/team');
  return await res.json();
}

export async function createTeamMember(member: Partial<TeamMember>): Promise<TeamMember> {
  const res = await fetch('/api/team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member),
  });
  return await res.json();
}

export async function fetchAgendas(): Promise<AgendaEvent[]> {
  const res = await fetch('/api/agendas');
  return await res.json();
}

export async function createAgenda(agenda: Partial<AgendaEvent>): Promise<AgendaEvent> {
  const res = await fetch('/api/agendas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agenda),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gagal membuat agenda');
  }
  return await res.json();
}

export async function updateAgenda(id: string, agenda: Partial<AgendaEvent>): Promise<AgendaEvent> {
  const res = await fetch(`/api/agendas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agenda),
  });
  return await res.json();
}

export async function deleteAgenda(id: string): Promise<void> {
  await fetch(`/api/agendas/${id}`, { method: 'DELETE' });
}

export async function saveMeetingNotes(id: string, meetingNotes: string): Promise<AgendaEvent> {
  const res = await fetch(`/api/agendas/${id}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meetingNotes }),
  });
  return await res.json();
}

export async function triggerManualEmailReminder(id: string): Promise<{ success: boolean; message: string; sentTo: string[] }> {
  const res = await fetch(`/api/agendas/${id}/send-email-reminder`, {
    method: 'POST',
  });
  return await res.json();
}

export async function syncAllToGoogleSheets(): Promise<{ success: boolean; spreadsheetUrl: string; totalSynced: number }> {
  const res = await fetch('/api/sheets/sync-all', {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gagal sync ke Google Sheets');
  }
  return await res.json();
}

export async function fetchNotificationLogs(): Promise<NotificationLog[]> {
  const res = await fetch('/api/notifications/logs');
  return await res.json();
}

export async function fetchProductivityMetrics(): Promise<ProductivityMetrics> {
  const res = await fetch('/api/dashboard/metrics');
  return await res.json();
}
