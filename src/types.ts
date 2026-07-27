export type Department = 'Engineering' | 'Marketing' | 'Sales' | 'HR' | 'Executive' | 'Product' | 'Finance';

export type TeamRole = 'Admin' | 'Manager' | 'Member';

export type UserStatus = 'Available' | 'In Meeting' | 'Out of Office' | 'Busy';

export type AgendaCategory = 'Rapat Tim' | 'Client Demo' | '1-on-1' | 'Review Proyek' | 'All-Hands' | 'Workshop / Pelatihan';

export type AgendaStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  department: Department;
  role: TeamRole;
  jobTitle: string;
  status: UserStatus;
  workingHours: {
    start: string; // e.g. "08:00"
    end: string;   // e.g. "17:00"
  };
  googleConnected: boolean;
  meetingHoursThisWeek: number;
}

export interface DriveAttachment {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  size?: string;
  uploadedAt: string;
}

export interface AgendaEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string; // ISO String
  endTime: string;   // ISO String
  category: AgendaCategory;
  location?: string;
  meetingLink?: string;
  organizerId: string;
  participantIds: string[];
  status: AgendaStatus;
  priority: 'low' | 'medium' | 'high';
  
  // Google Workspace integrations metadata
  googleEventId?: string;
  googleCalendarHtmlLink?: string;
  googleSheetRowIndex?: number;
  driveFiles: DriveAttachment[];
  
  // Reminder settings
  reminderMinutes: number; // e.g. 15, 60, 1440
  reminderSent: boolean;
  reminderSentAt?: string;
  
  // Notula / Meeting Notes
  meetingNotes?: string;
  notulaDriveLink?: string;

  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  eventId: string;
  eventTitle: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  type: 'invitation' | 'reminder' | 'update' | 'cancellation';
  status: 'sent' | 'failed' | 'queued';
  sentAt: string;
  errorMessage?: string;
}

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
  id?: string;
}

export interface GoogleWorkspaceStatus {
  isAuthenticated: boolean;
  user?: GoogleUserProfile;
  calendarSynced: boolean;
  sheetsSynced: boolean;
  driveSynced: boolean;
  gmailSynced: boolean;
  masterSheetUrl?: string;
  driveFolderUrl?: string;
  lastSyncedAt?: string;
}

export interface ProductivityMetrics {
  totalMeetingsThisWeek: number;
  totalMeetingHoursThisWeek: number;
  avgMeetingDurationMinutes: number;
  busiestDepartment: Department;
  teamWorkloadScore: number; // 0 - 100
  productivityScore: number; // 0 - 100
  departmentStats: {
    department: Department;
    memberCount: number;
    totalMeetingHours: number;
    avgWorkload: number;
  }[];
  actionableInsights: {
    id: string;
    type: 'warning' | 'tip' | 'success';
    title: string;
    description: string;
  }[];
}
