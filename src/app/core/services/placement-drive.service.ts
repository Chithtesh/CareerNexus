import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';
import { AuditLogService } from './audit-log.service';
import { 
  PlacementDrive, 
  DriveRound, 
  DriveRoundResult, 
  InterviewSlot, 
  DriveOffer, 
  DriveStatus, 
  SlotStatus 
} from '../models/placement-drive.model';

const STORAGE_KEYS = {
  DRIVES: 'careernexus_placement_drives_cache',
  ROUNDS: 'careernexus_drive_rounds_cache',
  RESULTS: 'careernexus_round_results_cache',
  SLOTS: 'careernexus_interview_slots_cache',
  OFFERS: 'careernexus_drive_offers_cache'
};

const INITIAL_DRIVES: PlacementDrive[] = [
  {
    id: 'drv-google-2026',
    companyId: 'comp-google',
    companyName: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop&q=80',
    title: 'Google Campus Placement Drive 2026',
    roleDesignation: 'Software Development Engineer I',
    description: 'On-campus recruitment drive for 2026 and 2027 graduating cohorts. Evaluation across data structures, system design, and Go/Java development.',
    eligibleDepartments: ['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication'],
    minimumCgpa: 8.0,
    maxBacklogs: 0,
    requiredSkills: ['Data Structures & Algorithms', 'Java', 'Python', 'System Design', 'Git'],
    applicationDeadline: new Date(Date.now() + 10 * 86400000).toISOString(),
    driveDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    mode: 'Hybrid',
    venue: 'Campus Tech Hall / Google Meet Virtual Assessment',
    salaryCtc: '₹32 - ₹45 LPA',
    status: 'In Progress',
    currentRoundNumber: 2,
    totalRounds: 4,
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    applicantCount: 42
  },
  {
    id: 'drv-microsoft-2026',
    companyId: 'comp-msft',
    companyName: 'Microsoft',
    companyLogo: 'https://images.unsplash.com/photo-1642132652809-8c6ef031dcf7?w=150&auto=format&fit=crop&q=80',
    title: 'Microsoft College Hiring Wave',
    roleDesignation: 'Cloud Solutions & Software Engineer',
    description: 'Full-time campus intake for Azure Cloud Infrastructure and Core Software Engineering engineering teams.',
    eligibleDepartments: ['Computer Science & Engineering', 'Information Technology'],
    minimumCgpa: 7.5,
    maxBacklogs: 0,
    requiredSkills: ['C#', 'TypeScript', 'Azure', 'Algorithms', 'SQL'],
    applicationDeadline: new Date(Date.now() + 15 * 86400000).toISOString(),
    driveDate: new Date(Date.now() + 20 * 86400000).toISOString(),
    mode: 'Online',
    venue: 'Microsoft Teams Assessment Portal',
    salaryCtc: '₹28 - ₹36 LPA',
    status: 'Applications Open',
    currentRoundNumber: 1,
    totalRounds: 3,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    applicantCount: 38
  },
  {
    id: 'drv-amazon-2026',
    companyId: 'comp-amazon',
    companyName: 'Amazon',
    companyLogo: 'https://images.unsplash.com/photo-1523474255658-4af61b1684c2?w=150&auto=format&fit=crop&q=80',
    title: 'Amazon SDE University Hiring',
    roleDesignation: 'Software Development Engineer',
    description: 'Annual placement drive focusing on Leadership Principles, scalable distributed systems, and real-time coding challenges.',
    eligibleDepartments: ['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication'],
    minimumCgpa: 7.0,
    maxBacklogs: 1,
    requiredSkills: ['Java', 'Object Oriented Programming', 'AWS', 'Data Structures', 'REST API'],
    applicationDeadline: new Date(Date.now() + 5 * 86400000).toISOString(),
    driveDate: new Date(Date.now() + 8 * 86400000).toISOString(),
    mode: 'Online',
    venue: 'Amazon Chime & HackerRank Platform',
    salaryCtc: '₹26 - ₹34 LPA',
    status: 'Screening',
    currentRoundNumber: 1,
    totalRounds: 4,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    applicantCount: 56
  }
];

const INITIAL_ROUNDS: DriveRound[] = [
  {
    id: 'rnd-g-1',
    driveId: 'drv-google-2026',
    roundOrder: 1,
    roundName: 'Round 1: Online Coding Challenge',
    roundType: 'Coding Assessment',
    scheduledAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    durationMinutes: 90,
    description: '3 algorithmic problems on dynamic programming, graph traversal, and arrays.',
    venueOrLink: 'Google Online Assessment Platform',
    status: 'Completed',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rnd-g-2',
    driveId: 'drv-google-2026',
    roundOrder: 2,
    roundName: 'Round 2: Technical Problem Solving',
    roundType: 'Technical Interview',
    scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    durationMinutes: 45,
    description: '1-on-1 live coding session defending time complexity and optimal space allocation.',
    venueOrLink: 'https://meet.google.com/nexus-tech-round2',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rnd-g-3',
    driveId: 'drv-google-2026',
    roundOrder: 3,
    roundName: 'Round 3: System Architecture & Core CS',
    roundType: 'Technical Interview',
    scheduledAt: new Date(Date.now() + 4 * 86400000).toISOString(),
    durationMinutes: 45,
    description: 'Operating systems, network protocols, database transactions, and scalable architecture.',
    venueOrLink: 'https://meet.google.com/nexus-system-round3',
    status: 'Pending',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rnd-g-4',
    driveId: 'drv-google-2026',
    roundOrder: 4,
    roundName: 'Round 4: Googliness & Leadership',
    roundType: 'HR Interview',
    scheduledAt: new Date(Date.now() + 6 * 86400000).toISOString(),
    durationMinutes: 30,
    description: 'Behavioral scenarios, cross-functional collaboration, and cultural alignment.',
    venueOrLink: 'https://meet.google.com/nexus-hr-round4',
    status: 'Pending',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_SLOTS: InterviewSlot[] = [
  {
    id: 'slt-101',
    driveId: 'drv-google-2026',
    roundId: 'rnd-g-2',
    studentId: 'std-101',
    studentName: 'Aarav Sharma',
    studentRoll: '2023CSE042',
    interviewerName: 'Senior Google Staff Engineer',
    interviewerEmail: 'interviewer.g@google.com',
    slotDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '10:45 AM',
    meetingLink: 'https://meet.google.com/nexus-slot-101',
    venue: 'Google Meet Room A',
    status: 'Scheduled',
    feedback: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'slt-102',
    driveId: 'drv-google-2026',
    roundId: 'rnd-g-2',
    studentId: 'std-102',
    studentName: 'Priya Patel',
    studentRoll: '2023IT019',
    interviewerName: 'Principal Tech Lead',
    interviewerEmail: 'techlead.g@google.com',
    slotDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    startTime: '11:00 AM',
    endTime: '11:45 AM',
    meetingLink: 'https://meet.google.com/nexus-slot-102',
    venue: 'Google Meet Room B',
    status: 'Scheduled',
    feedback: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_OFFERS: DriveOffer[] = [
  {
    id: 'ofr-901',
    driveId: 'drv-google-2026',
    studentId: 'std-101',
    studentName: 'Aarav Sharma',
    studentEmail: 'aarav.sharma@careernexus.edu',
    companyName: 'Google',
    roleDesignation: 'Software Development Engineer I',
    ctcPackage: '₹42 LPA',
    baseSalary: '₹22 LPA',
    joiningDate: '2027-07-01',
    offerLetterUrl: 'https://careernexus.edu/docs/offers/google-sde-aarav.pdf',
    status: 'Offered',
    acceptanceDeadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

@Injectable({
  providedIn: 'root'
})
export class PlacementDriveService {
  private supabase = inject(SupabaseService);
  private toast = inject(ToastService);
  private auditLog = inject(AuditLogService);

  private drivesSignal = signal<PlacementDrive[]>(this.loadCache(STORAGE_KEYS.DRIVES, INITIAL_DRIVES));
  private roundsSignal = signal<DriveRound[]>(this.loadCache(STORAGE_KEYS.ROUNDS, INITIAL_ROUNDS));
  private slotsSignal = signal<InterviewSlot[]>(this.loadCache(STORAGE_KEYS.SLOTS, INITIAL_SLOTS));
  private offersSignal = signal<DriveOffer[]>(this.loadCache(STORAGE_KEYS.OFFERS, INITIAL_OFFERS));

  isLoading = signal<boolean>(false);

  drives = computed(() => this.drivesSignal());
  rounds = computed(() => this.roundsSignal());
  slots = computed(() => this.slotsSignal());
  offers = computed(() => this.offersSignal());

  activeDrives = computed(() => 
    this.drivesSignal().filter(d => d.status !== 'Completed' && d.status !== 'Cancelled')
  );

  constructor() {
    this.fetchDrivesFromSupabase();
  }

  private loadCache<T>(key: string, fallback: T[]): T[] {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return fallback;
  }

  private saveCache<T>(key: string, data: T[]) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  }

  async fetchDrivesFromSupabase() {
    const client = this.supabase.getClient();
    if (!this.supabase.isConfigured || !client) return;

    this.isLoading.set(true);
    try {
      // 1. Fetch Drives
      const { data: driveData, error: driveErr } = await client
        .from('placement_drives')
        .select('*')
        .order('drive_date', { ascending: true });

      if (!driveErr && driveData && driveData.length > 0) {
        const formatted: PlacementDrive[] = driveData.map((d: any) => ({
          id: d.id,
          companyId: d.company_id,
          jobId: d.job_id,
          companyName: d.company_name,
          companyLogo: d.company_logo,
          title: d.title,
          roleDesignation: d.role_designation,
          description: d.description,
          eligibleDepartments: d.eligible_departments || [],
          minimumCgpa: Number(d.minimum_cgpa) || 6.5,
          maxBacklogs: d.max_backlogs || 0,
          requiredSkills: d.required_skills || [],
          applicationDeadline: d.application_deadline,
          driveDate: d.drive_date,
          mode: d.mode,
          venue: d.venue,
          salaryCtc: d.salary_ctc,
          status: d.status,
          currentRoundNumber: d.current_round_number || 1,
          totalRounds: d.total_rounds || 3,
          createdAt: d.created_at,
          updatedAt: d.updated_at
        }));
        this.drivesSignal.set(formatted);
        this.saveCache(STORAGE_KEYS.DRIVES, formatted);
      }

      // 2. Fetch Rounds
      const { data: roundData } = await client
        .from('drive_rounds')
        .select('*')
        .order('round_order', { ascending: true });

      if (roundData && roundData.length > 0) {
        const formattedRounds: DriveRound[] = roundData.map((r: any) => ({
          id: r.id,
          driveId: r.drive_id,
          roundOrder: r.round_order,
          roundName: r.round_name,
          roundType: r.round_type,
          scheduledAt: r.scheduled_at,
          durationMinutes: r.duration_minutes,
          description: r.description || '',
          venueOrLink: r.venue_or_link || '',
          status: r.status,
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
        this.roundsSignal.set(formattedRounds);
        this.saveCache(STORAGE_KEYS.ROUNDS, formattedRounds);
      }

      // 3. Fetch Slots
      const { data: slotData } = await client
        .from('interview_slots')
        .select('*')
        .order('slot_date', { ascending: true });

      if (slotData && slotData.length > 0) {
        const formattedSlots: InterviewSlot[] = slotData.map((s: any) => ({
          id: s.id,
          driveId: s.drive_id,
          roundId: s.round_id,
          studentId: s.student_id,
          studentName: s.student_name,
          studentRoll: s.student_roll,
          interviewerName: s.interviewer_name,
          interviewerEmail: s.interviewer_email,
          slotDate: s.slot_date,
          startTime: s.start_time,
          endTime: s.end_time,
          meetingLink: s.meeting_link,
          venue: s.venue,
          status: s.status,
          createdAt: s.created_at,
          updatedAt: s.updated_at
        }));
        this.slotsSignal.set(formattedSlots);
        this.saveCache(STORAGE_KEYS.SLOTS, formattedSlots);
      }

      // 4. Fetch Offers
      const { data: offerData } = await client
        .from('drive_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (offerData && offerData.length > 0) {
        const formattedOffers: DriveOffer[] = offerData.map((o: any) => ({
          id: o.id,
          driveId: o.drive_id,
          studentId: o.student_id,
          studentName: o.student_name,
          studentEmail: o.student_email,
          companyName: o.company_name,
          roleDesignation: o.role_designation,
          ctcPackage: o.ctc_package,
          baseSalary: o.base_salary,
          joiningDate: o.joining_date,
          offerLetterUrl: o.offer_letter_url,
          status: o.status,
          acceptanceDeadline: o.acceptance_deadline,
          createdAt: o.created_at,
          updatedAt: o.updated_at
        }));
        this.offersSignal.set(formattedOffers);
        this.saveCache(STORAGE_KEYS.OFFERS, formattedOffers);
      }
    } catch (err) {
      console.warn('Could not sync placement drives from Supabase:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async createDrive(driveInput: Partial<PlacementDrive>): Promise<PlacementDrive> {
    const newDrive: PlacementDrive = {
      id: 'drv-' + Math.random().toString(36).substring(2, 9),
      companyId: driveInput.companyId || 'comp-default',
      companyName: driveInput.companyName || 'Hiring Partner',
      companyLogo: driveInput.companyLogo || 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=150&auto=format&fit=crop&q=80',
      title: driveInput.title || 'Campus Recruitment Drive',
      roleDesignation: driveInput.roleDesignation || 'Associate Engineer',
      description: driveInput.description || 'University placement hiring drive.',
      eligibleDepartments: driveInput.eligibleDepartments || ['Computer Science & Engineering', 'Information Technology'],
      minimumCgpa: driveInput.minimumCgpa ?? 7.0,
      maxBacklogs: driveInput.maxBacklogs ?? 0,
      requiredSkills: driveInput.requiredSkills || ['Java', 'SQL', 'Git'],
      applicationDeadline: driveInput.applicationDeadline || new Date(Date.now() + 7 * 86400000).toISOString(),
      driveDate: driveInput.driveDate || new Date(Date.now() + 10 * 86400000).toISOString(),
      mode: driveInput.mode || 'Online',
      venue: driveInput.venue || 'Virtual Campus Hall',
      salaryCtc: driveInput.salaryCtc || '₹12 - ₹16 LPA',
      status: driveInput.status || 'Published',
      currentRoundNumber: 1,
      totalRounds: driveInput.totalRounds || 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.drivesSignal.update(list => [newDrive, ...list]);
    this.saveCache(STORAGE_KEYS.DRIVES, this.drivesSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client) {
      try {
        const { data, error } = await client.from('placement_drives').insert({
          company_name: newDrive.companyName,
          company_logo: newDrive.companyLogo,
          title: newDrive.title,
          role_designation: newDrive.roleDesignation,
          description: newDrive.description,
          eligible_departments: newDrive.eligibleDepartments,
          minimum_cgpa: newDrive.minimumCgpa,
          max_backlogs: newDrive.maxBacklogs,
          required_skills: newDrive.requiredSkills,
          application_deadline: newDrive.applicationDeadline,
          drive_date: newDrive.driveDate,
          mode: newDrive.mode,
          venue: newDrive.venue,
          salary_ctc: newDrive.salaryCtc,
          status: newDrive.status,
          current_round_number: newDrive.currentRoundNumber,
          total_rounds: newDrive.totalRounds
        }).select().single();

        if (!error && data) {
          newDrive.id = data.id;
        }
      } catch (err) {
        console.warn('Error inserting placement drive to Supabase:', err);
      }
    }

    this.auditLog.logAction(
      'CREATE_PLACEMENT_DRIVE',
      'placement_drive',
      newDrive.id,
      { title: newDrive.title, companyName: newDrive.companyName }
    );

    this.toast.success('Drive Created Successfully', `Placement drive for ${newDrive.companyName} is live.`);
    return newDrive;
  }

  async updateDrive(driveId: string, updates: Partial<PlacementDrive>): Promise<void> {
    this.drivesSignal.update(list =>
      list.map(d => d.id === driveId ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d)
    );
    this.saveCache(STORAGE_KEYS.DRIVES, this.drivesSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client && !driveId.startsWith('drv-')) {
      try {
        const payload: any = { updated_at: new Date().toISOString() };
        if (updates.title) payload.title = updates.title;
        if (updates.roleDesignation) payload.role_designation = updates.roleDesignation;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.status) payload.status = updates.status;
        if (updates.salaryCtc) payload.salary_ctc = updates.salaryCtc;
        if (updates.minimumCgpa !== undefined) payload.minimum_cgpa = updates.minimumCgpa;
        if (updates.venue) payload.venue = updates.venue;
        if (updates.mode) payload.mode = updates.mode;
        if (updates.driveDate) payload.drive_date = updates.driveDate;
        if (updates.applicationDeadline) payload.application_deadline = updates.applicationDeadline;

        await client.from('placement_drives').update(payload).eq('id', driveId);
      } catch (err) {
        console.warn('Error updating drive in Supabase:', err);
      }
    }

    this.toast.info('Drive Updated', 'Placement drive details saved.');
  }

  async deleteDrive(driveId: string): Promise<void> {
    const drive = this.drivesSignal().find(d => d.id === driveId);
    this.drivesSignal.update(list => list.filter(d => d.id !== driveId));
    this.saveCache(STORAGE_KEYS.DRIVES, this.drivesSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client && !driveId.startsWith('drv-')) {
      try {
        await client.from('placement_drives').delete().eq('id', driveId);
      } catch (err) {
        console.warn('Error deleting drive from Supabase:', err);
      }
    }

    this.toast.info('Drive Removed', `${drive?.title || 'Placement drive'} has been removed.`);
  }

  async updateDriveStatus(driveId: string, status: DriveStatus): Promise<void> {
    const existing = this.drivesSignal().find(d => d.id === driveId);
    if (!existing) return;

    this.drivesSignal.update(list => 
      list.map(d => d.id === driveId ? { ...d, status, updatedAt: new Date().toISOString() } : d)
    );
    this.saveCache(STORAGE_KEYS.DRIVES, this.drivesSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client && !driveId.startsWith('drv-')) {
      try {
        await client.from('placement_drives').update({ status, updated_at: new Date().toISOString() }).eq('id', driveId);
      } catch (err) {
        console.warn('Error updating drive status in Supabase:', err);
      }
    }

    this.auditLog.logAction(
      'UPDATE_DRIVE_STATUS',
      'placement_drive',
      driveId,
      { status, title: existing.title }
    );

    this.toast.info('Drive Lifecycle Updated', `Status changed to "${status}".`);
  }

  async addRound(roundInput: Partial<DriveRound>): Promise<DriveRound> {
    const newRound: DriveRound = {
      id: 'rnd-' + Math.random().toString(36).substring(2, 9),
      driveId: roundInput.driveId!,
      roundOrder: roundInput.roundOrder || (this.roundsSignal().filter(r => r.driveId === roundInput.driveId).length + 1),
      roundName: roundInput.roundName || 'Technical Interview',
      roundType: roundInput.roundType || 'Technical Interview',
      scheduledAt: roundInput.scheduledAt || new Date().toISOString(),
      durationMinutes: roundInput.durationMinutes || 60,
      description: roundInput.description || '',
      venueOrLink: roundInput.venueOrLink || 'Google Meet',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.roundsSignal.update(list => [...list, newRound]);
    this.saveCache(STORAGE_KEYS.ROUNDS, this.roundsSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client && !roundInput.driveId?.startsWith('drv-')) {
      try {
        const { data } = await client.from('drive_rounds').insert({
          drive_id: newRound.driveId,
          round_order: newRound.roundOrder,
          round_name: newRound.roundName,
          round_type: newRound.roundType,
          scheduled_at: newRound.scheduledAt,
          duration_minutes: newRound.durationMinutes,
          description: newRound.description,
          venue_or_link: newRound.venueOrLink,
          status: newRound.status
        }).select().single();
        if (data) newRound.id = data.id;
      } catch (err) {
        console.warn('Error saving round to Supabase:', err);
      }
    }

    this.toast.success('Round Configured', `Added "${newRound.roundName}" to drive.`);
    return newRound;
  }

  async updateRoundStatus(roundId: string, status: 'Pending' | 'In Progress' | 'Completed'): Promise<void> {
    this.roundsSignal.update(list =>
      list.map(r => r.id === roundId ? { ...r, status, updatedAt: new Date().toISOString() } : r)
    );
    this.saveCache(STORAGE_KEYS.ROUNDS, this.roundsSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client && !roundId.startsWith('rnd-')) {
      try {
        await client.from('drive_rounds').update({ status, updated_at: new Date().toISOString() }).eq('id', roundId);
      } catch (err) {
        console.warn('Error updating round in Supabase:', err);
      }
    }

    this.toast.info('Round Updated', `Round status changed to ${status}.`);
  }

  async deleteRound(roundId: string): Promise<void> {
    this.roundsSignal.update(list => list.filter(r => r.id !== roundId));
    this.saveCache(STORAGE_KEYS.ROUNDS, this.roundsSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client && !roundId.startsWith('rnd-')) {
      try {
        await client.from('drive_rounds').delete().eq('id', roundId);
      } catch (err) {
        console.warn('Error deleting round in Supabase:', err);
      }
    }

    this.toast.info('Round Removed', 'Round deleted from drive.');
  }

  async scheduleSlot(slotInput: Partial<InterviewSlot>): Promise<InterviewSlot> {
    const newSlot: InterviewSlot = {
      id: 'slt-' + Math.random().toString(36).substring(2, 9),
      driveId: slotInput.driveId!,
      roundId: slotInput.roundId,
      studentId: slotInput.studentId,
      studentName: slotInput.studentName || 'Student Candidate',
      studentRoll: slotInput.studentRoll || '',
      interviewerName: slotInput.interviewerName || 'Technical Interviewer',
      interviewerEmail: slotInput.interviewerEmail || '',
      slotDate: slotInput.slotDate || new Date().toISOString().split('T')[0],
      startTime: slotInput.startTime || '10:00 AM',
      endTime: slotInput.endTime || '10:45 AM',
      meetingLink: slotInput.meetingLink || 'https://meet.google.com/interview',
      venue: slotInput.venue || 'Virtual Panel',
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.slotsSignal.update(list => [...list, newSlot]);
    this.saveCache(STORAGE_KEYS.SLOTS, this.slotsSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client && !slotInput.driveId?.startsWith('drv-')) {
      try {
        const { data } = await client.from('interview_slots').insert({
          drive_id: newSlot.driveId,
          round_id: newSlot.roundId?.startsWith('rnd-') ? null : newSlot.roundId,
          student_id: newSlot.studentId?.startsWith('s-') ? null : newSlot.studentId,
          student_name: newSlot.studentName,
          student_roll: newSlot.studentRoll,
          interviewer_name: newSlot.interviewerName,
          interviewer_email: newSlot.interviewerEmail,
          slot_date: newSlot.slotDate,
          start_time: newSlot.startTime,
          end_time: newSlot.endTime,
          meeting_link: newSlot.meetingLink,
          venue: newSlot.venue,
          status: newSlot.status
        }).select().single();
        if (data) newSlot.id = data.id;
      } catch (err) {
        console.warn('Error saving slot to Supabase:', err);
      }
    }

    this.toast.success('Interview Slot Scheduled', `Slot allocated for ${newSlot.studentName} at ${newSlot.startTime}.`);
    return newSlot;
  }

  async updateSlotStatus(slotId: string, status: SlotStatus): Promise<void> {
    this.slotsSignal.update(list => 
      list.map(s => s.id === slotId ? { ...s, status, updatedAt: new Date().toISOString() } : s)
    );
    this.saveCache(STORAGE_KEYS.SLOTS, this.slotsSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client && !slotId.startsWith('slt-')) {
      try {
        await client.from('interview_slots').update({ status, updated_at: new Date().toISOString() }).eq('id', slotId);
      } catch (err) {
        console.warn('Error updating slot in Supabase:', err);
      }
    }

    this.toast.info('Slot Updated', `Interview slot marked as ${status}.`);
  }

  async releaseOffer(offerInput: Partial<DriveOffer>): Promise<DriveOffer> {
    const newOffer: DriveOffer = {
      id: 'ofr-' + Math.random().toString(36).substring(2, 9),
      driveId: offerInput.driveId!,
      studentId: offerInput.studentId!,
      studentName: offerInput.studentName || 'Selected Candidate',
      studentEmail: offerInput.studentEmail || '',
      companyName: offerInput.companyName || 'Hiring Partner',
      roleDesignation: offerInput.roleDesignation || 'Software Engineer',
      ctcPackage: offerInput.ctcPackage || '₹18 LPA',
      baseSalary: offerInput.baseSalary,
      joiningDate: offerInput.joiningDate,
      offerLetterUrl: offerInput.offerLetterUrl || 'https://careernexus.edu/docs/sample-offer.pdf',
      status: 'Offered',
      acceptanceDeadline: offerInput.acceptanceDeadline || new Date(Date.now() + 14 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.offersSignal.update(list => [newOffer, ...list]);
    this.saveCache(STORAGE_KEYS.OFFERS, this.offersSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client && !offerInput.driveId?.startsWith('drv-')) {
      try {
        const { data } = await client.from('drive_offers').insert({
          drive_id: newOffer.driveId,
          student_id: newOffer.studentId.startsWith('s-') ? null : newOffer.studentId,
          student_name: newOffer.studentName,
          student_email: newOffer.studentEmail,
          company_name: newOffer.companyName,
          role_designation: newOffer.roleDesignation,
          ctc_package: newOffer.ctcPackage,
          base_salary: newOffer.baseSalary,
          joining_date: newOffer.joiningDate,
          offer_letter_url: newOffer.offerLetterUrl,
          status: newOffer.status,
          acceptance_deadline: newOffer.acceptanceDeadline
        }).select().single();
        if (data) newOffer.id = data.id;
      } catch (err) {
        console.warn('Error saving offer to Supabase:', err);
      }
    }

    this.auditLog.logAction(
      'RELEASE_OFFER',
      'placement_offer',
      newOffer.id,
      { studentName: newOffer.studentName, companyName: newOffer.companyName, ctcPackage: newOffer.ctcPackage }
    );

    this.toast.success('Placement Offer Released! 🏆', `Offer extended to ${newOffer.studentName} (${newOffer.ctcPackage}).`);
    return newOffer;
  }

  getRoundsForDrive(driveId: string): DriveRound[] {
    return this.roundsSignal().filter(r => r.driveId === driveId).sort((a, b) => a.roundOrder - b.roundOrder);
  }

  getSlotsForDrive(driveId: string): InterviewSlot[] {
    return this.slotsSignal().filter(s => s.driveId === driveId);
  }

  getOffersForDrive(driveId: string): DriveOffer[] {
    return this.offersSignal().filter(o => o.driveId === driveId);
  }
}
