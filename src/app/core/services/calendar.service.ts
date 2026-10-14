import { Injectable, signal, computed, inject } from '@angular/core';
import { PlacementEvent, PlacementEventType } from '../models/calendar.model';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';

const INITIAL_EVENTS: PlacementEvent[] = [
  {
    id: 'evt-1',
    title: 'Google SDE Campus Drive Application Deadline',
    description: 'Final submission deadline for 2027 batch software development engineer roles.',
    eventType: 'Application Deadline',
    companyName: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&auto=format&fit=crop&q=80',
    startDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    isMandatory: true,
    forRole: 'student'
  },
  {
    id: 'evt-2',
    title: 'Online Aptitude & Quantitative Assessment Window',
    description: 'TCS & Infosys combined National Qualifier Aptitude Test on CareerNexus Portal.',
    eventType: 'Assessment',
    companyName: 'TCS / Infosys',
    companyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&auto=format&fit=crop&q=80',
    startDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    locationOrUrl: 'https://careernexus.edu/assessments',
    isMandatory: true,
    forRole: 'all'
  },
  {
    id: 'evt-3',
    title: 'Google Round 2 Technical & Architecture Interview',
    description: '1-on-1 video technical interview round covering distributed systems and data structures.',
    eventType: 'Interview',
    companyName: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&auto=format&fit=crop&q=80',
    startDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    locationOrUrl: 'Google Meet / CareerNexus Video',
    isMandatory: true,
    forRole: 'student'
  },
  {
    id: 'evt-4',
    title: 'Microsoft Azure Cloud Day & Pre-Placement Talk',
    description: 'Executive briefing on Cloud Solutions Engineer openings and compensation packages.',
    eventType: 'Placement Drive',
    companyName: 'Microsoft',
    companyLogo: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=128&auto=format&fit=crop&q=80',
    startDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    locationOrUrl: 'Main Auditorium / Hybrid Stream',
    isMandatory: false,
    forRole: 'all'
  },
  {
    id: 'evt-5',
    title: 'System Design Mastery Workshop with Alumni Mentors',
    description: 'Live interactive session led by alumni engineers at Google and Amazon.',
    eventType: 'Training Session',
    companyName: 'Alumni Network',
    startDate: new Date(Date.now() + 8 * 86400000).toISOString(),
    locationOrUrl: 'Seminar Hall 3',
    isMandatory: false,
    forRole: 'student'
  }
];

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private supabase = inject(SupabaseService);
  private toast = inject(ToastService);

  private readonly STORAGE_KEY = 'careernexus_calendar_events_cache';

  private eventsSignal = signal<PlacementEvent[]>(this.loadInitialEvents());
  events = computed(() => this.eventsSignal());

  constructor() {
    this.fetchEventsFromDatabase();
  }

  private loadInitialEvents(): PlacementEvent[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return INITIAL_EVENTS;
  }

  private saveEventsToCache(events: PlacementEvent[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
    } catch {
      // ignore
    }
  }

  async fetchEventsFromDatabase() {
    const client = this.supabase.getClient();
    if (!this.supabase.isConfigured || !client) return;

    try {
      const { data, error } = await client
        .from('placement_events')
        .select('*')
        .order('start_date', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: PlacementEvent[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          description: d.description,
          eventType: d.event_type as PlacementEventType,
          companyName: d.company_name,
          companyLogo: d.company_logo,
          startDate: d.start_date,
          endDate: d.end_date,
          locationOrUrl: d.location_or_url,
          isMandatory: Boolean(d.is_mandatory),
          targetDepartment: d.target_department,
          targetBatch: d.target_batch,
          forRole: d.for_role
        }));
        this.eventsSignal.set(mapped);
        this.saveEventsToCache(mapped);
      }
    } catch (err) {
      console.warn('Error fetching placement events:', err);
    }
  }

  async addEvent(event: Omit<PlacementEvent, 'id'>): Promise<PlacementEvent> {
    const newEvent: PlacementEvent = {
      ...event,
      id: `evt-${Date.now()}`
    };

    this.eventsSignal.update(list => [...list, newEvent]);
    this.saveEventsToCache(this.eventsSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client) {
      try {
        await client.from('placement_events').insert({
          id: newEvent.id,
          title: newEvent.title,
          description: newEvent.description,
          event_type: newEvent.eventType,
          company_name: newEvent.companyName,
          company_logo: newEvent.companyLogo,
          start_date: newEvent.startDate,
          location_or_url: newEvent.locationOrUrl,
          is_mandatory: newEvent.isMandatory,
          for_role: newEvent.forRole
        });
      } catch (err) {
        console.warn('Error syncing calendar event:', err);
      }
    }

    this.toast.success('Calendar Event Added', `"${newEvent.title}" has been scheduled.`);
    return newEvent;
  }
}
