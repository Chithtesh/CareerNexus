import { Injectable, signal, computed, inject } from '@angular/core';
import { Student, Project, Certification, PlacementStatus } from '../models/student.model';
import { MOCK_STUDENTS } from '../data/mock-data';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  private readonly LOCAL_STORAGE_KEY = 'placementconnect_students_cache';

  // Signals
  private studentsSignal = signal<Student[]>(this.loadInitialStudents());
  isLoading = signal<boolean>(false);

  // Readonly list of all students
  students = computed(() => this.studentsSignal());

  // Active students only (not deactivated)
  activeStudents = computed(() => this.studentsSignal().filter(s => s.isActive !== false));

  // Current logged in student profile
  currentStudent = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return this.studentsSignal()[0];

    const match = this.studentsSignal().find(
      s => s.userId === user.id || s.email.toLowerCase() === user.email.toLowerCase()
    );

    if (match) return match;

    // Create virtual student representation for newly logged in user
    return {
      id: `s-${user.id}`,
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      profilePhoto: user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      phone: '+91 98765 43210',
      department: 'Computer Science & Engineering',
      course: 'B.Tech',
      batch: '2023-2027',
      graduationYear: 2027,
      rollNumber: '23CS101',
      cgpa: 8.85,
      tenthPercentage: 92.5,
      twelfthPercentage: 91.0,
      skills: ['C++', 'Java', 'Data Structures', 'Algorithms', 'SQL', 'TypeScript'],
      preferredDomain: 'Software Development',
      bio: 'Final-year Computer Science Engineering student passionate about distributed systems, backend architectures, and high-performance algorithms.',
      githubUrl: 'https://github.com',
      linkedinUrl: 'https://linkedin.com',
      portfolioUrl: '',
      resumeUrl: '',
      resumeFileName: 'Resume_2026.pdf',
      placementStatus: 'In Progress',
      profileCompletion: 85,
      isActive: true,
      projects: [],
      certifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as Student;
  });

  // Statistics
  stats = computed(() => {
    const list = this.studentsSignal();
    const total = list.length;
    const selected = list.filter(s => s.placementStatus === 'Selected' || s.placementStatus === 'Offer Accepted').length;
    const inProgress = list.filter(s => s.placementStatus === 'In Progress').length;
    const notPlaced = list.filter(s => s.placementStatus === 'Not Placed').length;
    const placementRate = total > 0 ? Math.round((selected / total) * 100) : 0;

    return {
      total,
      selected,
      inProgress,
      notPlaced,
      placementRate
    };
  });

  constructor() {
    this.fetchStudentsFromDatabase();
  }

  private loadInitialStudents(): Student[] {
    try {
      const stored = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return MOCK_STUDENTS;
  }

  private saveStudentsToCache(list: Student[]) {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  async fetchStudentsFromDatabase() {
    const client = this.supabase.getClient();
    if (!this.supabase.isConfigured || !client) return;

    this.isLoading.set(true);
    try {
      const { data, error } = await client
        .from('students')
        .select('*')
        .order('roll_number', { ascending: true });

      if (error) {
        console.warn('Could not fetch students from Supabase:', error.message);
        return;
      }

      if (data && data.length > 0) {
        const mapped: Student[] = data.map((d: any) => this.mapDbRowToStudent(d));
        this.studentsSignal.set(mapped);
        this.saveStudentsToCache(mapped);
      }
    } catch (e) {
      console.warn('Students fetch exception:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private mapDbRowToStudent(row: any): Student {
    return {
      id: row.id,
      userId: row.user_id,
      fullName: row.full_name,
      email: row.email,
      profilePhoto: row.profile_photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      phone: row.phone || '',
      department: row.department || 'Computer Science & Engineering',
      departmentId: row.department_id,
      programId: row.program_id,
      batchId: row.batch_id,
      course: row.course || 'B.Tech',
      batch: row.batch || '2023-2027',
      graduationYear: row.graduation_year || 2027,
      rollNumber: row.roll_number || '',
      cgpa: Number(row.cgpa) || 7.50,
      tenthPercentage: Number(row.tenth_percentage) || 85.0,
      twelfthPercentage: Number(row.twelfth_percentage) || 85.0,
      skills: row.skills || ['Java', 'SQL'],
      preferredDomain: row.preferred_domain || 'Software Development',
      bio: row.bio || '',
      githubUrl: row.github_url || '',
      linkedinUrl: row.linkedin_url || '',
      portfolioUrl: row.portfolio_url || '',
      resumeUrl: row.resume_url || '',
      resumeFileName: row.resume_file_name || '',
      placementStatus: (row.placement_status as PlacementStatus) || 'Not Placed',
      placedCompany: row.placed_company || '',
      placedPackage: row.placed_package || '',
      profileCompletion: row.profile_completion || 70,
      isActive: row.is_active ?? true,
      projects: row.projects || [],
      certifications: row.certifications || [],
      customFields: row.custom_fields || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  getStudentById(id: string): Student | undefined {
    return this.studentsSignal().find(s => s.id === id || s.userId === id);
  }

  addStudentDirectly(student: Student) {
    this.studentsSignal.update(list => [student, ...list.filter(s => s.id !== student.id && s.rollNumber !== student.rollNumber)]);
    this.saveStudentsToCache(this.studentsSignal());
  }

  updateStudentDirectly(id: string, updates: Partial<Student>) {
    this.studentsSignal.update(list =>
      list.map(s => (s.id === id || s.userId === id) ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s)
    );
    this.saveStudentsToCache(this.studentsSignal());
  }

  removeStudentDirectly(id: string) {
    this.studentsSignal.update(list => list.filter(s => s.id !== id && s.userId !== id));
    this.saveStudentsToCache(this.studentsSignal());
  }

  async updateCurrentStudentProfile(profile: Partial<Student>) {
    const current = this.currentStudent();
    const updated: Student = {
      ...current,
      ...profile,
      updatedAt: new Date().toISOString()
    };
    updated.profileCompletion = this.calculateProfileCompletion(updated);

    this.studentsSignal.update(list =>
      list.map(s => (s.id === updated.id || s.userId === updated.userId) ? updated : s)
    );
    this.saveStudentsToCache(this.studentsSignal());

    const client = this.supabase.getClient();
    if (this.supabase.isConfigured && client) {
      try {
        const payload: any = {
          full_name: updated.fullName,
          bio: updated.bio,
          cgpa: updated.cgpa,
          phone: updated.phone,
          github_url: updated.githubUrl,
          linkedin_url: updated.linkedinUrl,
          portfolio_url: updated.portfolioUrl,
          resume_url: updated.resumeUrl,
          resume_file_name: updated.resumeFileName,
          skills: updated.skills,
          preferred_domain: updated.preferredDomain,
          placement_status: updated.placementStatus,
          placed_company: updated.placedCompany,
          placed_package: updated.placedPackage,
          profile_completion: updated.profileCompletion,
          projects: updated.projects,
          certifications: updated.certifications,
          updated_at: new Date().toISOString()
        };

        const { error } = await client
          .from('students')
          .update(payload)
          .eq('user_id', updated.userId);

        if (error) {
          console.warn('Could not update student profile in Supabase:', error.message);
        }
      } catch (err) {
        console.warn('Student profile update DB exception:', err);
      }
    }

    this.toast.success('Profile Updated', 'Your student career profile has been saved successfully.');
  }

  async uploadResumeFile(file: File): Promise<string | null> {
    const current = this.currentStudent();
    let uploadedUrl = '';

    if (this.supabase.isConfigured && this.supabase.getClient()) {
      const fileName = `${current.rollNumber || current.userId}_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const res = await this.supabase.uploadFile('resumes', fileName, file);
      if (res) {
        uploadedUrl = res.url;
      }
    }

    if (!uploadedUrl) {
      uploadedUrl = URL.createObjectURL(file);
    }

    await this.updateCurrentStudentProfile({
      resumeFileName: file.name,
      resumeUrl: uploadedUrl
    });

    this.toast.success('Resume Uploaded', `"${file.name}" is now active and attached to all your applications.`);
    return uploadedUrl;
  }

  async addProject(project: Omit<Project, 'id'>) {
    const newProj: Project = {
      ...project,
      id: `p-${Date.now()}`
    };
    const current = this.currentStudent();
    const projects = [...(current.projects || []), newProj];
    await this.updateCurrentStudentProfile({ projects });
    this.toast.success('Project Added', `"${newProj.title}" added to your profile showcase.`);
  }

  async removeProject(id: string) {
    const current = this.currentStudent();
    const projects = (current.projects || []).filter(p => p.id !== id);
    await this.updateCurrentStudentProfile({ projects });
    this.toast.info('Project Removed', 'The project has been removed from your showcase.');
  }

  async addCertification(cert: Omit<Certification, 'id'>) {
    const newCert: Certification = {
      ...cert,
      id: `cert-${Date.now()}`
    };
    const current = this.currentStudent();
    const certifications = [...(current.certifications || []), newCert];
    await this.updateCurrentStudentProfile({ certifications });
    this.toast.success('Certification Added', `"${newCert.title}" added to your verified credentials.`);
  }

  calculateProfileCompletion(s: Student): number {
    let score = 0;
    if (s.fullName) score += 10;
    if (s.profilePhoto) score += 10;
    if (s.phone) score += 5;
    if (s.bio) score += 10;
    if (s.skills && s.skills.length >= 3) score += 15;
    if (s.githubUrl) score += 10;
    if (s.linkedinUrl) score += 10;
    if (s.portfolioUrl) score += 5;
    if (s.resumeUrl || s.resumeFileName) score += 15;
    if (s.projects && s.projects.length >= 1) score += 10;
    if (s.certifications && s.certifications.length >= 1) score += 10;
    return Math.min(100, score);
  }
}
