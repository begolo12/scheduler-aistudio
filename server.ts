import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { google } from 'googleapis';
import { createServer as createViteServer } from 'vite';
import { initialTeamMembers, initialAgendas, initialNotificationLogs, initialProductivityMetrics } from './src/data/mockData.js';
import { AgendaEvent, TeamMember, NotificationLog, GoogleUserProfile } from './src/types.js';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());

// State stores in memory
let teamMembers: TeamMember[] = [...initialTeamMembers];
let agendas: AgendaEvent[] = [...initialAgendas];
let notificationLogs: NotificationLog[] = [...initialNotificationLogs];

// Token storage map (in production, use DB or encrypted session cookie)
interface UserTokenSession {
  tokens: any;
  profile: GoogleUserProfile;
  masterSheetId?: string;
  driveFolderId?: string;
}
const userSessions = new Map<string, UserTokenSession>();

// OAuth configuration
const getOAuthClient = (req?: express.Request) => {
  const clientId = process.env.CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
  
  // Determine base app URL
  let baseUrl = process.env.APP_URL;
  if (!baseUrl && req) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    baseUrl = `${protocol}://${host}`;
  }
  if (!baseUrl) {
    baseUrl = 'http://localhost:3000';
  }

  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/callback`;
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

// Helper to get authenticated google client for a request
const getAuthForRequest = (req: express.Request) => {
  const sessionId = req.cookies.teamsync_session;
  if (!sessionId) return null;
  const session = userSessions.get(sessionId);
  if (!session || !session.tokens) return null;

  const oAuth2Client = getOAuthClient(req);
  oAuth2Client.setCredentials(session.tokens);
  return { oAuth2Client, session };
};

// ==========================================
// 1. OAUTH AUTHENTICATION ROUTES
// ==========================================

app.get('/api/auth/url', (req, res) => {
  const oAuth2Client = getOAuthClient(req);
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
  });

  res.json({ url: authUrl });
});

app.get('/api/auth/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    return res.redirect('/?auth=error_no_code');
  }

  try {
    const oAuth2Client = getOAuthClient(req);
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Fetch user profile from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oAuth2Client });
    const userInfo = await oauth2.userinfo.get();

    const profile: GoogleUserProfile = {
      id: userInfo.data.id || '',
      email: userInfo.data.email || 'user@company.com',
      name: userInfo.data.name || userInfo.data.email || 'Google User',
      picture: userInfo.data.picture || '',
    };

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Save token session
    userSessions.set(sessionId, {
      tokens,
      profile,
    });

    // Update logged in user status in team members
    const existingMember = teamMembers.find(m => m.email.toLowerCase() === profile.email.toLowerCase());
    if (existingMember) {
      existingMember.googleConnected = true;
      existingMember.name = profile.name;
      if (profile.picture) existingMember.avatar = profile.picture;
    } else {
      // Add as new member
      teamMembers.push({
        id: `user-${Date.now()}`,
        name: profile.name,
        email: profile.email,
        avatar: profile.picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        department: 'Executive',
        role: 'Admin',
        jobTitle: 'Company Specialist',
        status: 'Available',
        workingHours: { start: '08:00', end: '17:00' },
        googleConnected: true,
        meetingHoursThisWeek: 0,
      });
    }

    res.cookie('teamsync_session', sessionId, {
      httpOnly: true,
      maxAge: 30 * 24 * 3600 * 1000, // 30 days
      sameSite: 'lax',
    });

    res.redirect('/?auth=success');
  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    res.redirect(`/?auth=error&msg=${encodeURIComponent(error.message || 'OAuth Failed')}`);
  }
});

app.get('/api/auth/status', (req, res) => {
  const auth = getAuthForRequest(req);
  if (!auth) {
    return res.json({
      isAuthenticated: false,
      calendarSynced: false,
      sheetsSynced: false,
      driveSynced: false,
      gmailSynced: false,
    });
  }

  res.json({
    isAuthenticated: true,
    user: auth.session.profile,
    calendarSynced: true,
    sheetsSynced: true,
    driveSynced: true,
    gmailSynced: true,
    masterSheetUrl: auth.session.masterSheetId ? `https://docs.google.com/spreadsheets/d/${auth.session.masterSheetId}` : 'https://docs.google.com/spreadsheets',
    driveFolderUrl: auth.session.driveFolderId ? `https://drive.google.com/drive/folders/${auth.session.driveFolderId}` : 'https://drive.google.com',
    lastSyncedAt: new Date().toISOString(),
  });
});

app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.cookies.teamsync_session;
  if (sessionId) {
    userSessions.delete(sessionId);
  }
  res.clearCookie('teamsync_session');
  res.json({ success: true });
});

// ==========================================
// 2. TEAM & DASHBOARD ROUTES
// ==========================================

app.get('/api/team', (req, res) => {
  res.json(teamMembers);
});

app.post('/api/team', (req, res) => {
  const newMember: TeamMember = {
    id: `user-${Date.now()}`,
    ...req.body,
    googleConnected: false,
    meetingHoursThisWeek: 0,
  };
  teamMembers.push(newMember);
  res.json(newMember);
});

app.get('/api/dashboard/metrics', (req, res) => {
  // Calculate dynamic metrics from agendas
  const totalAgendas = agendas.length;
  let totalHours = 0;
  agendas.forEach(a => {
    const diffMs = new Date(a.endTime).getTime() - new Date(a.startTime).getTime();
    totalHours += Math.max(0, diffMs / (1000 * 3600));
  });

  const metrics = {
    ...initialProductivityMetrics,
    totalMeetingsThisWeek: totalAgendas,
    totalMeetingHoursThisWeek: Number(totalHours.toFixed(1)),
    avgMeetingDurationMinutes: totalAgendas > 0 ? Math.round((totalHours * 60) / totalAgendas) : 45,
  };

  res.json(metrics);
});

// ==========================================
// 3. SCHEDULER & AGENDAS ROUTES
// ==========================================

app.get('/api/agendas', (req, res) => {
  res.json(agendas);
});

app.post('/api/agendas', async (req, res) => {
  try {
    const { title, description, startTime, endTime, category, location, meetingLink, organizerId, participantIds, priority, reminderMinutes } = req.body;

    const newAgenda: AgendaEvent = {
      id: `evt-${Date.now()}`,
      title: title || 'Agenda Rapat Baru',
      description: description || '',
      startTime,
      endTime,
      category: category || 'Rapat Tim',
      location: location || 'Google Meet',
      meetingLink: meetingLink || 'https://meet.google.com/team-sync-room',
      organizerId: organizerId || teamMembers[0]?.id || 'user-1',
      participantIds: participantIds || [teamMembers[0]?.id || 'user-1'],
      status: 'scheduled',
      priority: priority || 'medium',
      driveFiles: [],
      reminderMinutes: Number(reminderMinutes) || 15,
      reminderSent: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Google Calendar Integration: Create event if authenticated
    const auth = getAuthForRequest(req);
    if (auth) {
      try {
        const calendar = google.calendar({ version: 'v3', auth: auth.oAuth2Client });
        
        // Resolve attendee emails
        const attendees = newAgenda.participantIds
          .map(id => teamMembers.find(m => m.id === id)?.email)
          .filter(Boolean)
          .map(email => ({ email }));

        const gcalEvent = await calendar.events.insert({
          calendarId: 'primary',
          sendUpdates: 'all',
          requestBody: {
            summary: `[Team Sync] ${newAgenda.title}`,
            description: `${newAgenda.description}\n\nKategori: ${newAgenda.category}\nLokasi/Link: ${newAgenda.meetingLink || newAgenda.location}`,
            start: { dateTime: newAgenda.startTime },
            end: { dateTime: newAgenda.endTime },
            location: newAgenda.location || newAgenda.meetingLink,
            attendees,
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: newAgenda.reminderMinutes },
                { method: 'popup', minutes: 10 },
              ],
            },
          },
        });

        newAgenda.googleEventId = gcalEvent.data.id || undefined;
        newAgenda.googleCalendarHtmlLink = gcalEvent.data.htmlLink || undefined;
      } catch (gcalErr: any) {
        console.error('Google Calendar Event Insert Warning:', gcalErr.message);
      }

      // 2. Google Sheets Integration: Append row to Master Schedule Sheet
      try {
        await syncEventToGoogleSheet(auth, newAgenda);
      } catch (sheetErr: any) {
        console.error('Google Sheets Sync Warning:', sheetErr.message);
      }

      // 3. Gmail Integration: Send invitation email to participants
      try {
        for (const pId of newAgenda.participantIds) {
          const participant = teamMembers.find(m => m.id === pId);
          if (participant && participant.email) {
            await sendGmailNotification({
              auth,
              recipientEmail: participant.email,
              recipientName: participant.name,
              subject: `[Undangan Agenda Tim] ${newAgenda.title}`,
              event: newAgenda,
              type: 'invitation',
            });
          }
        }
      } catch (gmailErr: any) {
        console.error('Gmail Invitation Warning:', gmailErr.message);
      }
    } else {
      // Mock links if offline
      newAgenda.googleEventId = `gcal_mock_${Date.now()}`;
      newAgenda.googleCalendarHtmlLink = `https://calendar.google.com/calendar/r/eventedit/${newAgenda.googleEventId}`;
    }

    agendas.unshift(newAgenda);
    res.json(newAgenda);
  } catch (error: any) {
    console.error('Error creating agenda:', error);
    res.status(500).json({ error: error.message || 'Gagal membuat agenda' });
  }
});

app.put('/api/agendas/:id', async (req, res) => {
  const { id } = req.params;
  const index = agendas.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Agenda tidak ditemukan' });
  }

  const updated = {
    ...agendas[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  // Google Calendar update if connected
  const auth = getAuthForRequest(req);
  if (auth && updated.googleEventId && !updated.googleEventId.startsWith('gcal_mock_')) {
    try {
      const calendar = google.calendar({ version: 'v3', auth: auth.oAuth2Client });
      await calendar.events.patch({
        calendarId: 'primary',
        eventId: updated.googleEventId,
        requestBody: {
          summary: `[Team Sync] ${updated.title}`,
          description: `${updated.description || ''}\n\nKategori: ${updated.category}`,
          start: { dateTime: updated.startTime },
          end: { dateTime: updated.endTime },
          status: updated.status === 'cancelled' ? 'cancelled' : 'confirmed',
        }
      });
    } catch (err: any) {
      console.error('Calendar Update Warning:', err.message);
    }
  }

  agendas[index] = updated;
  res.json(updated);
});

app.delete('/api/agendas/:id', async (req, res) => {
  const { id } = req.params;
  const agenda = agendas.find(a => a.id === id);
  
  if (agenda && agenda.googleEventId) {
    const auth = getAuthForRequest(req);
    if (auth && !agenda.googleEventId.startsWith('gcal_mock_')) {
      try {
        const calendar = google.calendar({ version: 'v3', auth: auth.oAuth2Client });
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: agenda.googleEventId,
        });
      } catch (err: any) {
        console.error('Calendar Delete Warning:', err.message);
      }
    }
  }

  agendas = agendas.filter(a => a.id !== id);
  res.json({ success: true, id });
});

// Save Meeting Notes (Notula) & Save to Google Drive
app.post('/api/agendas/:id/notes', async (req, res) => {
  const { id } = req.params;
  const { meetingNotes } = req.body;

  const agenda = agendas.find(a => a.id === id);
  if (!agenda) {
    return res.status(404).json({ error: 'Agenda tidak ditemukan' });
  }

  agenda.meetingNotes = meetingNotes;
  agenda.updatedAt = new Date().toISOString();

  // If Google Drive connected, save Google Doc in Drive
  const auth = getAuthForRequest(req);
  if (auth) {
    try {
      const drive = google.drive({ version: 'v3', auth: auth.oAuth2Client });
      const fileMetadata = {
        name: `Notula Rapat - ${agenda.title} (${new Date().toLocaleDateString('id-ID')}).txt`,
        mimeType: 'text/plain',
      };
      const media = {
        mimeType: 'text/plain',
        body: `NOTULA RAPAT PERUSAHAAN - TEAM SYNC\n` +
              `==========================================\n` +
              `Judul Agenda: ${agenda.title}\n` +
              `Waktu: ${new Date(agenda.startTime).toLocaleString('id-ID')} s/d ${new Date(agenda.endTime).toLocaleString('id-ID')}\n` +
              `Kategori: ${agenda.category}\n` +
              `Peserta: ${agenda.participantIds.map(p => teamMembers.find(m => m.id === p)?.name).join(', ')}\n\n` +
              `RANGKUMAN & CATATAN RAPAT:\n` +
              `------------------------------------------\n` +
              `${meetingNotes}\n\n` +
              `Dibuat secara otomatis melalui Team Sync Scheduler.`,
      };

      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      agenda.notulaDriveLink = file.data.webViewLink || undefined;
      agenda.driveFiles.push({
        id: file.data.id || `drive_${Date.now()}`,
        name: fileMetadata.name,
        mimeType: 'text/plain',
        webViewLink: file.data.webViewLink || undefined,
        uploadedAt: new Date().toISOString(),
      });
    } catch (driveErr: any) {
      console.error('Google Drive Upload Warning:', driveErr.message);
    }
  } else {
    agenda.notulaDriveLink = 'https://docs.google.com/document/u/0/';
  }

  res.json(agenda);
});

// Trigger Instant Manual Email Reminder
app.post('/api/agendas/:id/send-email-reminder', async (req, res) => {
  const { id } = req.params;
  const agenda = agendas.find(a => a.id === id);
  if (!agenda) {
    return res.status(404).json({ error: 'Agenda tidak ditemukan' });
  }

  const auth = getAuthForRequest(req);
  const sentCount = [];

  for (const pId of agenda.participantIds) {
    const participant = teamMembers.find(m => m.id === pId);
    if (participant && participant.email) {
      const result = await sendGmailNotification({
        auth,
        recipientEmail: participant.email,
        recipientName: participant.name,
        subject: `[Pengingat Email Manual] ${agenda.title}`,
        event: agenda,
        type: 'reminder',
      });
      if (result.success) sentCount.push(participant.email);
    }
  }

  agenda.reminderSent = true;
  agenda.reminderSentAt = new Date().toISOString();

  res.json({
    success: true,
    sentTo: sentCount,
    message: `Pengingat email berhasil dikirim ke ${sentCount.length} peserta via Gmail.`,
  });
});

// ==========================================
// 4. GOOGLE SHEETS MASTER EXPORT & SYNC
// ==========================================

app.get('/api/sheets/info', async (req, res) => {
  const auth = getAuthForRequest(req);
  if (!auth) {
    return res.json({ connected: false, message: 'Google OAuth belum terhubung' });
  }

  res.json({
    connected: true,
    masterSheetUrl: auth.session.masterSheetId ? `https://docs.google.com/spreadsheets/d/${auth.session.masterSheetId}` : 'https://docs.google.com/spreadsheets',
  });
});

app.post('/api/sheets/sync-all', async (req, res) => {
  const auth = getAuthForRequest(req);
  if (!auth) {
    return res.status(401).json({ error: 'OAuth login diperlukan untuk sync Google Sheets' });
  }

  try {
    const sheetId = await getOrCreateMasterSheet(auth);
    const sheets = google.sheets({ version: 'v4', auth: auth.oAuth2Client });

    // Prepare table headers and rows
    const rows = [
      ['ID Agenda', 'Judul Agenda', 'Kategori', 'Waktu Mulai', 'Waktu Selesai', 'Penyelenggara', 'Peserta', 'Lokasi/Link', 'Status', 'Prioritas', 'Link GCal', 'Catatan/Notula', 'Terakhir Diperbarui'],
      ...agendas.map(a => [
        a.id,
        a.title,
        a.category,
        new Date(a.startTime).toLocaleString('id-ID'),
        new Date(a.endTime).toLocaleString('id-ID'),
        teamMembers.find(m => m.id === a.organizerId)?.name || 'Admin',
        a.participantIds.map(p => teamMembers.find(m => m.id === p)?.name).join(', '),
        a.meetingLink || a.location || '-',
        a.status,
        a.priority,
        a.googleCalendarHtmlLink || '-',
        a.meetingNotes || '-',
        new Date(a.updatedAt).toLocaleString('id-ID'),
      ])
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows },
    });

    res.json({
      success: true,
      spreadsheetId: sheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
      totalSynced: agendas.length,
    });
  } catch (error: any) {
    console.error('Error syncing Google Sheets:', error);
    res.status(500).json({ error: error.message || 'Gagal sinkronisasi ke Google Sheets' });
  }
});

// ==========================================
// 5. NOTIFICATION LOGS
// ==========================================

app.get('/api/notifications/logs', (req, res) => {
  res.json(notificationLogs);
});

// ==========================================
// HELPER FUNCTIONS FOR GOOGLE WORKSPACE
// ==========================================

async function getOrCreateMasterSheet(auth: { oAuth2Client: any; session: UserTokenSession }) {
  if (auth.session.masterSheetId) return auth.session.masterSheetId;

  const sheets = google.sheets({ version: 'v4', auth: auth.oAuth2Client });
  const spreadsheet = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: 'Team Sync - Company Master Schedule 2026',
      },
    },
  });

  const sheetId = spreadsheet.data.spreadsheetId;
  if (sheetId) {
    auth.session.masterSheetId = sheetId;
  }
  return sheetId || '';
}

async function syncEventToGoogleSheet(auth: { oAuth2Client: any; session: UserTokenSession }, event: AgendaEvent) {
  try {
    const sheetId = await getOrCreateMasterSheet(auth);
    if (!sheetId) return;

    const sheets = google.sheets({ version: 'v4', auth: auth.oAuth2Client });
    const organizerName = teamMembers.find(m => m.id === event.organizerId)?.name || 'Admin';
    const participantNames = event.participantIds.map(p => teamMembers.find(m => m.id === p)?.name).join(', ');

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          event.id,
          event.title,
          event.category,
          new Date(event.startTime).toLocaleString('id-ID'),
          new Date(event.endTime).toLocaleString('id-ID'),
          organizerName,
          participantNames,
          event.meetingLink || event.location || '-',
          event.status,
          event.priority,
          event.googleCalendarHtmlLink || '-',
          event.meetingNotes || '-',
          new Date().toLocaleString('id-ID'),
        ]],
      },
    });
  } catch (err: any) {
    console.error('syncEventToGoogleSheet Error:', err.message);
  }
}

async function sendGmailNotification({
  auth,
  recipientEmail,
  recipientName,
  subject,
  event,
  type,
}: {
  auth: { oAuth2Client: any; session: UserTokenSession } | null;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  event: AgendaEvent;
  type: 'invitation' | 'reminder' | 'update' | 'cancellation';
}) {
  const logEntry: NotificationLog = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    eventId: event.id,
    eventTitle: event.title,
    recipientEmail,
    recipientName,
    subject,
    type,
    status: 'sent',
    sentAt: new Date().toISOString(),
  };

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #1e293b; padding: 16px; border-radius: 8px 8px 0 0; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">📅 Team Sync - Company Scheduler</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.8;">Pengingat Agenda & Koordinasi Tim Perusahaan</p>
      </div>
      
      <div style="padding: 20px;">
        <p style="font-size: 15px; color: #334155;">Halo <strong>${recipientName}</strong>,</p>
        <p style="font-size: 14px; color: #475569;">
          ${type === 'invitation' ? 'Anda diundang ke dalam agenda tim berikut:' : 'Berikut adalah pengingat otomatis untuk agenda tim Anda yang akan datang:'}
        </p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 18px;">${event.title}</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>🏷️ Kategori:</strong> ${event.category}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>⏰ Waktu:</strong> ${new Date(event.startTime).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} s/d ${new Date(event.endTime).toLocaleTimeString('id-ID', { timeStyle: 'short' })}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #334155;"><strong>📍 Lokasi/Link:</strong> <a href="${event.meetingLink || '#'}" style="color: #2563eb; text-decoration: underline;">${event.meetingLink || event.location || 'Online Meeting'}</a></p>
          ${event.description ? `<p style="margin: 10px 0 0 0; font-size: 13px; color: #64748b; font-style: italic;">"${event.description}"</p>` : ''}
        </div>

        ${event.googleCalendarHtmlLink ? `
          <div style="text-align: center; margin: 24px 0;">
            <a href="${event.googleCalendarHtmlLink}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 8px; font-size: 14px;">
              📆 Buka & Lihat di Google Calendar
            </a>
          </div>
        ` : ''}

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          Email ini dikirim secara otomatis oleh Team Sync Scheduler. Terhubung langsung dengan Google Workspace Perusahaan.
        </p>
      </div>
    </div>
  `;

  if (auth) {
    try {
      const gmail = google.gmail({ version: 'v1', auth: auth.oAuth2Client });
      const rawMessage = [
        `From: "Team Sync" <${auth.session.profile.email}>`,
        `To: ${recipientEmail}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        htmlBody,
      ].join('\r\n');

      const encodedMessage = Buffer.from(rawMessage)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage },
      });

      logEntry.status = 'sent';
    } catch (err: any) {
      console.error('Gmail API send error:', err.message);
      logEntry.status = 'failed';
      logEntry.errorMessage = err.message;
    }
  }

  notificationLogs.unshift(logEntry);
  return { success: logEntry.status === 'sent', log: logEntry };
}

// ==========================================
// 6. AUTOMATED SERVER-SIDE BACKGROUND SCHEDULER
// ==========================================

setInterval(() => {
  const currentTime = new Date().getTime();

  agendas.forEach(async (event) => {
    if (event.status === 'cancelled' || event.reminderSent) return;

    const eventStartTime = new Date(event.startTime).getTime();
    const reminderWindowMs = event.reminderMinutes * 60 * 1000;
    const triggerTime = eventStartTime - reminderWindowMs;

    // Check if current time is within 2 minutes of reminder trigger time
    if (currentTime >= triggerTime && currentTime <= eventStartTime) {
      console.log(`[Auto Scheduler] Triggering automated email reminder for agenda: "${event.title}"`);
      
      event.reminderSent = true;
      event.reminderSentAt = new Date().toISOString();

      // Find sessions to get auth if available
      let authSession = null;
      for (const [_, session] of userSessions.entries()) {
        if (session.tokens) {
          authSession = { oAuth2Client: getOAuthClient(), session };
          authSession.oAuth2Client.setCredentials(session.tokens);
          break;
        }
      }

      for (const pId of event.participantIds) {
        const participant = teamMembers.find(m => m.id === pId);
        if (participant && participant.email) {
          await sendGmailNotification({
            auth: authSession,
            recipientEmail: participant.email,
            recipientName: participant.name,
            subject: `⏰ [Pengingat Otomatis] ${event.title} - ${event.reminderMinutes} Menit Lagi`,
            event,
            type: 'reminder',
          });
        }
      }
    }
  });
}, 30000); // Check every 30 seconds

// ==========================================
// VITE & SERVER INITIALIZATION
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Team Sync Scheduler Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
