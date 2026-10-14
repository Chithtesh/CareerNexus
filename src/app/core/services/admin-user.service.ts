import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { StudentService } from './student.service';
import { AlumniService } from './alumni.service';
import { AuditLogService } from './audit-log.service';
import { ToastService } from './toast.service';
import { AuthService } from './auth.service';
import { Student, PlacementStatus } from '../models/student.model';
import { Alumni } from '../models/alumni.model';
import { Application } from '../models/application.model';
import { User, UserRole } from '../models/user.model';
import { MOCK_USERS } from '../data/mock-data';

export interface DuplicateCheckResult {
  emailExists: boolean;
  rollNumberExists: boolean;
  alumniIdExists: boolean;
  hasDuplicate: boolean;
  duplicateField?: string;
  duplicateMessage?: string;
}

export interface NewStudentForm {
  fullName: string;
  email: string;
  rollNumber: string;
  department: string;
  departmentId?: string;
  programId?: string;
  batchId?: string;
  course?: string;
  batch?: string;
  graduationYear: number;
  phone?: string;
  cgpa: number;
  tenthPercentage?: number;
  twelfthPercentage?: number;
  skills: string[];
  preferredDomain?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
  placementStatus?: PlacementStatus;
  placedCompany?: string;
  placedPackage?: string;
  customFields?: Record<string, any>;
}

export interface NewAlumniForm {
  fullName: string;
  email: string;
  alumniId?: string;
  graduationYear: number;
  department: string;
  departmentId?: string;
  batchId?: string;
  company?: string;
  companyId?: string;
  designation?: string;
  experienceYears?: number;
  skills: string[];
  preferredDomains?: string[];
  bio?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  contactPreference?: string;
  availableForMentoring?: boolean;
  phone?: string;
  customFields?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private supabase = inject(SupabaseService);
  private studentService = inject(StudentService);
  private alumniService = inject(AlumniService);
  private auditLog = inject(AuditLogService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  // --- ALL USERS SIGNAL ---
  users = signal<User[]>([]);

  // --- DUPLICATE DETECTION ---
  async checkDuplicates(
    email: string,
    rollNumber?: string,
    alumniId?: string,
    excludeUserId?: string
  ): Promise<DuplicateCheckResult> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanRoll = rollNumber?.trim().toLowerCase() || '';
    const cleanAlumniId = alumniId?.trim().toLowerCase() || '';

    // 1. Check local stores first
    const existingStudentByEmail = this.studentService.students().find(
      s => s.email.toLowerCase() === cleanEmail && (!excludeUserId || s.userId !== excludeUserId)
    );
    const existingAlumniByEmail = this.alumniService.alumni().find(
      a => a.email.toLowerCase() === cleanEmail && (!excludeUserId || a.userId !== excludeUserId)
    );
    const emailExistsLocally = !!(existingStudentByEmail || existingAlumniByEmail);

    let rollExistsLocally = false;
    if (cleanRoll) {
      rollExistsLocally = this.studentService.students().some(
        s => s.rollNumber.toLowerCase() === cleanRoll && (!excludeUserId || s.userId !== excludeUserId)
      );
    }

    let alumniIdExistsLocally = false;
    if (cleanAlumniId) {
      alumniIdExistsLocally = this.alumniService.alumni().some(
        a => (a.alumniId || '').toLowerCase() === cleanAlumniId && (!excludeUserId || a.userId !== excludeUserId)
      );
    }

    if (emailExistsLocally || rollExistsLocally || alumniIdExistsLocally) {
      const duplicateField = emailExistsLocally ? 'email' : rollExistsLocally ? 'rollNumber' : 'alumniId';
      const duplicateMessage = emailExistsLocally
        ? `Email address "${email}" is already registered.`
        : rollExistsLocally
        ? `Roll Number "${rollNumber}" is already in use.`
        : `Alumni ID "${alumniId}" is already assigned.`;

      return {
        emailExists: emailExistsLocally,
        rollNumberExists: rollExistsLocally,
        alumniIdExists: alumniIdExistsLocally,
        hasDuplicate: true,
        duplicateField,
        duplicateMessage
      };
    }

    // 2. Check Supabase DB via RPC if available
    if (this.supabase.client) {
      try {
        const { data, error } = await this.supabase.client.rpc('check_user_duplicates', {
          p_email: cleanEmail,
          p_roll_number: cleanRoll || null,
          p_alumni_id: cleanAlumniId || null,
          p_exclude_user_id: excludeUserId && !excludeUserId.startsWith('u-') && !excludeUserId.startsWith('s-') ? excludeUserId : null
        });

        if (!error && data) {
          const res = data as any;
          if (res.hasDuplicate) {
            const field = res.emailExists ? 'email' : res.rollNumberExists ? 'rollNumber' : 'alumniId';
            const msg = res.emailExists
              ? `Email address "${email}" is already registered in the database.`
              : res.rollNumberExists
              ? `Student ID / Roll Number "${rollNumber}" already exists in the database.`
              : `Alumni ID "${alumniId}" already exists in the database.`;

            return {
              emailExists: !!res.emailExists,
              rollNumberExists: !!res.rollNumberExists,
              alumniIdExists: !!res.alumniIdExists,
              hasDuplicate: true,
              duplicateField: field,
              duplicateMessage: msg
            };
          }
        }
      } catch (err) {
        console.warn('Duplicate check DB query warning:', err);
      }
    }

    return {
      emailExists: false,
      rollNumberExists: false,
      alumniIdExists: false,
      hasDuplicate: false
    };
  }

  // --- CREATE STUDENT ---
  async createStudent(form: NewStudentForm): Promise<Student> {
    const cleanEmail = form.email.trim();
    const cleanRoll = form.rollNumber.trim().toUpperCase();

    // Check Duplicates
    const dup = await this.checkDuplicates(cleanEmail, cleanRoll);
    if (dup.hasDuplicate) {
      this.toast.error('Duplicate Detected', dup.duplicateMessage || 'User already exists.');
      throw new Error(dup.duplicateMessage);
    }

    const userId = `u-student-${Date.now()}`;
    const studentId = `s-${Date.now()}`;

    const newStudent: Student = {
      id: studentId,
      userId: userId,
      fullName: form.fullName.trim(),
      email: cleanEmail,
      rollNumber: cleanRoll,
      department: form.department,
      departmentId: form.departmentId,
      programId: form.programId,
      batchId: form.batchId,
      course: form.course || 'B.Tech',
      batch: form.batch || `Batch ${form.graduationYear - 4}-${form.graduationYear}`,
      graduationYear: Number(form.graduationYear),
      phone: form.phone || '',
      cgpa: Number(form.cgpa),
      tenthPercentage: Number(form.tenthPercentage || 85.0),
      twelfthPercentage: Number(form.twelfthPercentage || 85.0),
      skills: form.skills.length > 0 ? form.skills : ['Java', 'SQL'],
      preferredDomain: form.preferredDomain || 'Software Development',
      bio: form.bio || '',
      profilePhoto: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      githubUrl: form.githubUrl || '',
      linkedinUrl: form.linkedinUrl || '',
      portfolioUrl: form.portfolioUrl || '',
      resumeUrl: form.resumeUrl || '',
      resumeFileName: form.resumeUrl ? 'Resume.pdf' : '',
      placementStatus: form.placementStatus || 'Not Placed',
      placedCompany: form.placedCompany || '',
      placedPackage: form.placedPackage || '',
      profileCompletion: 75,
      isActive: true,
      projects: [],
      certifications: [],
      customFields: form.customFields || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to Supabase
    if (this.supabase.client) {
      try {
        // 1. Create User record in public.users marked as pending_activation
        const userInsert = await this.supabase.client
          .from('users')
          .insert({
            email: cleanEmail,
            full_name: form.fullName.trim(),
            role: 'student',
            status: 'pending_activation',
            is_active: true,
            phone: form.phone || '',
            invited_at: new Date().toISOString()
          })
          .select()
          .single();

        let dbUserId = userId;
        if (userInsert.data) {
          dbUserId = userInsert.data.id;
          newStudent.userId = dbUserId;
        }

        // 2. Insert Student record
        const studentInsert = await this.supabase.client
          .from('students')
          .insert({
            user_id: dbUserId,
            full_name: newStudent.fullName,
            email: newStudent.email,
            roll_number: newStudent.rollNumber,
            department: newStudent.department,
            department_id: form.departmentId && !form.departmentId.startsWith('d-') ? form.departmentId : null,
            program_id: form.programId && !form.programId.startsWith('p-') ? form.programId : null,
            batch_id: form.batchId && !form.batchId.startsWith('b-') ? form.batchId : null,
            course: newStudent.course,
            batch: newStudent.batch,
            graduation_year: newStudent.graduationYear,
            phone: newStudent.phone,
            cgpa: newStudent.cgpa,
            tenth_percentage: newStudent.tenthPercentage,
            twelfth_percentage: newStudent.twelfthPercentage,
            skills: newStudent.skills,
            preferred_domain: newStudent.preferredDomain,
            bio: newStudent.bio,
            github_url: newStudent.githubUrl,
            linkedin_url: newStudent.linkedinUrl,
            portfolio_url: newStudent.portfolioUrl,
            resume_url: newStudent.resumeUrl,
            placement_status: newStudent.placementStatus,
            placed_company: newStudent.placedCompany,
            placed_package: newStudent.placedPackage,
            profile_completion: newStudent.profileCompletion,
            is_active: true,
            custom_fields: newStudent.customFields
          })
          .select()
          .single();

        if (studentInsert.data) {
          newStudent.id = studentInsert.data.id;
          newStudent.createdAt = studentInsert.data.created_at;
        }
      } catch (err) {
        console.warn('Student creation DB warning:', err);
      }
    }

    this.studentService.addStudentDirectly(newStudent);
    this.toast.success('Student Enrolled', `${newStudent.fullName} (${newStudent.rollNumber}) has been added.`);
    this.auditLog.logAction('CREATE_STUDENT', 'student', newStudent.id, {
      name: newStudent.fullName,
      roll: newStudent.rollNumber,
      department: newStudent.department,
      batch: newStudent.batch
    });

    return newStudent;
  }

  // --- UPDATE STUDENT ---
  async updateStudent(studentId: string, updates: Partial<Student>): Promise<void> {
    const existing = this.studentService.getStudentById(studentId);
    if (!existing) {
      throw new Error('Student not found.');
    }

    // Check Duplicate if email or roll number changed
    if (
      (updates.email && updates.email.toLowerCase() !== existing.email.toLowerCase()) ||
      (updates.rollNumber && updates.rollNumber.toUpperCase() !== existing.rollNumber.toUpperCase())
    ) {
      const dup = await this.checkDuplicates(
        updates.email || existing.email,
        updates.rollNumber || existing.rollNumber,
        undefined,
        existing.userId
      );
      if (dup.hasDuplicate) {
        this.toast.error('Duplicate Detected', dup.duplicateMessage || 'Value conflict with existing user.');
        throw new Error(dup.duplicateMessage);
      }
    }

    this.studentService.updateStudentDirectly(studentId, updates);

    if (this.supabase.client && !studentId.startsWith('s-')) {
      try {
        const payload: any = {};
        if (updates.fullName) payload.full_name = updates.fullName;
        if (updates.email) payload.email = updates.email;
        if (updates.rollNumber) payload.roll_number = updates.rollNumber;
        if (updates.department) payload.department = updates.department;
        if (updates.departmentId !== undefined) payload.department_id = updates.departmentId;
        if (updates.programId !== undefined) payload.program_id = updates.programId;
        if (updates.batchId !== undefined) payload.batch_id = updates.batchId;
        if (updates.course) payload.course = updates.course;
        if (updates.batch) payload.batch = updates.batch;
        if (updates.graduationYear !== undefined) payload.graduation_year = Number(updates.graduationYear);
        if (updates.cgpa !== undefined) payload.cgpa = Number(updates.cgpa);
        if (updates.tenthPercentage !== undefined) payload.tenth_percentage = Number(updates.tenthPercentage);
        if (updates.twelfthPercentage !== undefined) payload.twelfth_percentage = Number(updates.twelfthPercentage);
        if (updates.skills) payload.skills = updates.skills;
        if (updates.preferredDomain) payload.preferred_domain = updates.preferredDomain;
        if (updates.bio !== undefined) payload.bio = updates.bio;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.githubUrl !== undefined) payload.github_url = updates.githubUrl;
        if (updates.linkedinUrl !== undefined) payload.linkedin_url = updates.linkedinUrl;
        if (updates.portfolioUrl !== undefined) payload.portfolio_url = updates.portfolioUrl;
        if (updates.resumeUrl !== undefined) payload.resume_url = updates.resumeUrl;
        if (updates.placementStatus) payload.placement_status = updates.placementStatus;
        if (updates.placedCompany !== undefined) payload.placed_company = updates.placedCompany;
        if (updates.placedPackage !== undefined) payload.placed_package = updates.placedPackage;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;
        if (updates.customFields) payload.custom_fields = updates.customFields;
        payload.updated_at = new Date().toISOString();

        await this.supabase.client.from('students').update(payload).eq('id', studentId);

        // Also update public.users if email or name changed
        if (updates.fullName || updates.email || updates.phone) {
          const userPayload: any = {};
          if (updates.fullName) userPayload.full_name = updates.fullName;
          if (updates.email) userPayload.email = updates.email;
          if (updates.phone) userPayload.phone = updates.phone;
          await this.supabase.client.from('users').update(userPayload).eq('id', existing.userId);
        }
      } catch (err) {
        console.warn('Update student DB error:', err);
      }
    }

    this.toast.info('Student Record Updated', `${existing.fullName}'s profile has been updated.`);
    this.auditLog.logAction('UPDATE_STUDENT', 'student', studentId, updates);
  }

  // --- CREATE ALUMNI ---
  async createAlumni(form: NewAlumniForm): Promise<Alumni> {
    const cleanEmail = form.email.trim();
    const cleanAlumniId = form.alumniId?.trim().toUpperCase() || undefined;

    // Check Duplicates
    const dup = await this.checkDuplicates(cleanEmail, undefined, cleanAlumniId);
    if (dup.hasDuplicate) {
      this.toast.error('Duplicate Detected', dup.duplicateMessage || 'Alumni already exists.');
      throw new Error(dup.duplicateMessage);
    }

    const userId = `u-alumni-${Date.now()}`;
    const alumniId = `a-${Date.now()}`;

    const newAlumni: Alumni = {
      id: alumniId,
      userId: userId,
      alumniId: cleanAlumniId,
      fullName: form.fullName.trim(),
      email: cleanEmail,
      phone: form.phone || '',
      graduationYear: Number(form.graduationYear),
      department: form.department,
      departmentId: form.departmentId,
      batchId: form.batchId,
      company: form.company?.trim() || '',
      companyId: form.companyId,
      designation: form.designation?.trim() || 'Software Engineer',
      experienceYears: Number(form.experienceYears || 2.0),
      skills: form.skills.length > 0 ? form.skills : ['System Design', 'Cloud'],
      preferredDomains: form.preferredDomains?.length ? form.preferredDomains : ['Software Development'],
      bio: form.bio || '',
      profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      linkedinUrl: form.linkedinUrl || '',
      githubUrl: form.githubUrl || '',
      portfolioUrl: form.portfolioUrl || '',
      contactPreference: form.contactPreference || 'Email & Chat',
      availableForMentoring: form.availableForMentoring ?? true,
      menteesCount: 0,
      rating: 5.0,
      isActive: true,
      customFields: form.customFields || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (this.supabase.client) {
      try {
        // 1. Create User in public.users
        const userInsert = await this.supabase.client
          .from('users')
          .insert({
            email: cleanEmail,
            full_name: form.fullName.trim(),
            role: 'alumni',
            status: 'pending_activation',
            is_active: true,
            phone: form.phone || '',
            invited_at: new Date().toISOString()
          })
          .select()
          .single();

        let dbUserId = userId;
        if (userInsert.data) {
          dbUserId = userInsert.data.id;
          newAlumni.userId = dbUserId;
        }

        // 2. Insert Alumni Record
        const alumniInsert = await this.supabase.client
          .from('alumni')
          .insert({
            user_id: dbUserId,
            alumni_id: cleanAlumniId || null,
            full_name: newAlumni.fullName,
            email: newAlumni.email,
            phone: newAlumni.phone,
            graduation_year: newAlumni.graduationYear,
            department: newAlumni.department,
            department_id: form.departmentId && !form.departmentId.startsWith('d-') ? form.departmentId : null,
            batch_id: form.batchId && !form.batchId.startsWith('b-') ? form.batchId : null,
            company: newAlumni.company,
            company_id: form.companyId && !form.companyId.startsWith('c-') ? form.companyId : null,
            designation: newAlumni.designation,
            experience_years: newAlumni.experienceYears,
            skills: newAlumni.skills,
            preferred_domains: newAlumni.preferredDomains,
            bio: newAlumni.bio,
            linkedin_url: newAlumni.linkedinUrl,
            github_url: newAlumni.githubUrl,
            portfolio_url: newAlumni.portfolioUrl,
            contact_preference: newAlumni.contactPreference,
            available_for_mentoring: newAlumni.availableForMentoring,
            is_active: true,
            custom_fields: newAlumni.customFields
          })
          .select()
          .single();

        if (alumniInsert.data) {
          newAlumni.id = alumniInsert.data.id;
          newAlumni.createdAt = alumniInsert.data.created_at;
        }
      } catch (err) {
        console.warn('Alumni creation DB warning:', err);
      }
    }

    this.alumniService.addAlumniDirectly(newAlumni);
    this.toast.success('Alumni Registered', `${newAlumni.fullName} added to Alumni Mentors network.`);
    this.auditLog.logAction('CREATE_ALUMNI', 'alumni', newAlumni.id, {
      name: newAlumni.fullName,
      company: newAlumni.company,
      graduationYear: newAlumni.graduationYear
    });

    return newAlumni;
  }

  // --- UPDATE ALUMNI ---
  async updateAlumni(alumniId: string, updates: Partial<Alumni>): Promise<void> {
    const existing = this.alumniService.getAlumniById(alumniId);
    if (!existing) {
      throw new Error('Alumni not found.');
    }

    if (
      (updates.email && updates.email.toLowerCase() !== existing.email.toLowerCase()) ||
      (updates.alumniId && updates.alumniId.toUpperCase() !== (existing.alumniId || '').toUpperCase())
    ) {
      const dup = await this.checkDuplicates(
        updates.email || existing.email,
        undefined,
        updates.alumniId || existing.alumniId,
        existing.userId
      );
      if (dup.hasDuplicate) {
        this.toast.error('Duplicate Detected', dup.duplicateMessage || 'Value conflict with existing user.');
        throw new Error(dup.duplicateMessage);
      }
    }

    this.alumniService.updateAlumniDirectly(alumniId, updates);

    if (this.supabase.client && !alumniId.startsWith('a-')) {
      try {
        const payload: any = {};
        if (updates.fullName) payload.full_name = updates.fullName;
        if (updates.email) payload.email = updates.email;
        if (updates.alumniId !== undefined) payload.alumni_id = updates.alumniId || null;
        if (updates.department) payload.department = updates.department;
        if (updates.departmentId !== undefined) payload.department_id = updates.departmentId;
        if (updates.batchId !== undefined) payload.batch_id = updates.batchId;
        if (updates.graduationYear !== undefined) payload.graduation_year = Number(updates.graduationYear);
        if (updates.company !== undefined) payload.company = updates.company;
        if (updates.companyId !== undefined) payload.company_id = updates.companyId;
        if (updates.designation !== undefined) payload.designation = updates.designation;
        if (updates.experienceYears !== undefined) payload.experience_years = Number(updates.experienceYears);
        if (updates.skills) payload.skills = updates.skills;
        if (updates.preferredDomains) payload.preferred_domains = updates.preferredDomains;
        if (updates.bio !== undefined) payload.bio = updates.bio;
        if (updates.phone !== undefined) payload.phone = updates.phone;
        if (updates.linkedinUrl !== undefined) payload.linkedin_url = updates.linkedinUrl;
        if (updates.githubUrl !== undefined) payload.github_url = updates.githubUrl;
        if (updates.portfolioUrl !== undefined) payload.portfolio_url = updates.portfolioUrl;
        if (updates.contactPreference) payload.contact_preference = updates.contactPreference;
        if (updates.availableForMentoring !== undefined) payload.available_for_mentoring = updates.availableForMentoring;
        if (updates.isActive !== undefined) payload.is_active = updates.isActive;
        if (updates.customFields) payload.custom_fields = updates.customFields;
        payload.updated_at = new Date().toISOString();

        await this.supabase.client.from('alumni').update(payload).eq('id', alumniId);

        if (updates.fullName || updates.email || updates.phone) {
          const userPayload: any = {};
          if (updates.fullName) userPayload.full_name = updates.fullName;
          if (updates.email) userPayload.email = updates.email;
          if (updates.phone) userPayload.phone = updates.phone;
          await this.supabase.client.from('users').update(userPayload).eq('id', existing.userId);
        }
      } catch (err) {
        console.warn('Update alumni DB error:', err);
      }
    }

    this.toast.info('Alumni Record Updated', `${existing.fullName}'s profile has been updated.`);
    this.auditLog.logAction('UPDATE_ALUMNI', 'alumni', alumniId, updates);
  }

  // --- GRADUATE STUDENT TO ALUMNI ---
  async graduateStudentToAlumni(
    studentId: string,
    gradDetails: {
      graduationYear: number;
      company?: string;
      designation?: string;
      alumniId?: string;
    }
  ): Promise<void> {
    const student = this.studentService.getStudentById(studentId);
    if (!student) {
      this.toast.error('Student Not Found', 'Could not locate student to graduate.');
      throw new Error('Student not found.');
    }

    const company = gradDetails.company?.trim() || student.placedCompany || 'Leading Technology Firm';
    const designation = gradDetails.designation?.trim() || 'Software Engineer';
    const gradYear = Number(gradDetails.graduationYear) || 2026;
    const generatedAlumniId = gradDetails.alumniId?.trim().toUpperCase() || `ALUM-${gradYear}-${student.rollNumber.substring(0, 6)}`;

    // 1. Check RPC on Supabase
    if (this.supabase.client && !studentId.startsWith('s-')) {
      try {
        const { data, error } = await this.supabase.client.rpc('graduate_student_to_alumni', {
          p_student_id: studentId,
          p_graduation_year: gradYear,
          p_company: company,
          p_designation: designation,
          p_alumni_id: generatedAlumniId,
          p_admin_id: this.authService.currentUser()?.id || null
        });

        if (error) {
          console.warn('RPC graduate_student_to_alumni returned error:', error.message);
        }
      } catch (err) {
        console.warn('Error executing graduate RPC:', err);
      }
    }

    // 2. Update local Student state
    this.studentService.updateStudentDirectly(studentId, {
      graduationYear: gradYear,
      placementStatus: student.placementStatus === 'Not Placed' ? 'Selected' : student.placementStatus,
      placedCompany: company
    });

    // 3. Create/Update local Alumni record
    const newAlumniRecord: Alumni = {
      id: `a-grad-${Date.now()}`,
      userId: student.userId,
      alumniId: generatedAlumniId,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      profilePhoto: student.profilePhoto,
      graduationYear: gradYear,
      department: student.department,
      departmentId: student.departmentId,
      company: company,
      designation: designation,
      experienceYears: 1.0,
      skills: student.skills,
      preferredDomains: [student.preferredDomain || 'Software Development'],
      bio: student.bio || `Graduated ${gradYear} from ${student.department}. Working as ${designation} at ${company}.`,
      linkedinUrl: student.linkedinUrl,
      githubUrl: student.githubUrl,
      portfolioUrl: student.portfolioUrl,
      contactPreference: 'Email & Chat',
      availableForMentoring: true,
      menteesCount: 0,
      rating: 5.0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.alumniService.addAlumniDirectly(newAlumniRecord);

    this.toast.success(
      'Graduation Complete! 🎓',
      `${student.fullName} has been graduated into Alumni Network (${company} - ${designation}).`
    );

    this.auditLog.logAction('GRADUATE_STUDENT', 'student', studentId, {
      student_name: student.fullName,
      roll: student.rollNumber,
      graduationYear: gradYear,
      company,
      designation,
      alumniId: generatedAlumniId
    });
  }

  // --- DEACTIVATE / REACTIVATE USER ---
  async toggleUserStatus(userId: string, isActive: boolean, reason?: string): Promise<void> {
    const student = this.studentService.students().find(s => s.userId === userId || s.id === userId);
    const alumnus = this.alumniService.alumni().find(a => a.userId === userId || a.id === userId);

    if (student) {
      this.studentService.updateStudentDirectly(student.id, { isActive });
    }
    if (alumnus) {
      this.alumniService.updateAlumniDirectly(alumnus.id, { isActive });
    }

    if (this.supabase.client) {
      try {
        await this.supabase.client.rpc('admin_toggle_user_status', {
          p_user_id: userId,
          p_is_active: isActive,
          p_admin_id: this.authService.currentUser()?.id || null,
          p_reason: reason || ''
        });
      } catch (err) {
        console.warn('Error toggling user status via RPC:', err);
      }
    }

    const name = student?.fullName || alumnus?.fullName || 'User';
    if (isActive) {
      this.toast.success('Account Reactivated', `${name}'s account is active and placement history preserved.`);
      this.auditLog.logAction('REACTIVATE_USER', 'user', userId, { name, reason });
    } else {
      this.toast.warning('Account Deactivated', `${name}'s account has been deactivated without deleting historical applications.`);
      this.auditLog.logAction('DEACTIVATE_USER', 'user', userId, { name, reason });
    }
  }

  // --- FETCH USER APPLICATIONS ---
  async getStudentApplications(studentId: string): Promise<Application[]> {
    if (this.supabase.client && !studentId.startsWith('s-')) {
      try {
        const { data, error } = await this.supabase.client
          .from('applications')
          .select('*')
          .eq('student_id', studentId)
          .order('applied_at', { ascending: false });

        if (!error && data) {
          return data.map((row: any) => ({
            id: row.id,
            studentId: row.student_id,
            studentName: row.student_name,
            studentRoll: row.student_roll,
            studentDepartment: row.student_department,
            studentCgpa: Number(row.student_cgpa),
            studentEmail: row.student_email,
            studentAvatar: row.student_avatar,
            studentResumeUrl: row.student_resume_url,
            jobId: row.job_id,
            jobTitle: row.job_title,
            companyId: row.company_id,
            companyName: row.company_name,
            companyLogo: row.company_logo,
            salary: row.salary,
            status: row.status,
            notes: row.notes,
            timeline: row.timeline || [],
            appliedAt: row.applied_at,
            updatedAt: row.updated_at
          }));
        }
      } catch (err) {
        console.warn('Error fetching student applications:', err);
      }
    }

    // Fallback demo applications
    return [
      {
        id: `app-demo-${studentId}-1`,
        studentId: studentId,
        studentName: 'Student',
        studentRoll: '23CS101',
        studentDepartment: 'CSE',
        studentCgpa: 8.5,
        studentEmail: '',
        jobId: 'j0000001-0000-0000-0000-000000000001',
        jobTitle: 'Software Development Engineer',
        companyId: 'c0000001-0000-0000-0000-000000000001',
        companyName: 'Google',
        companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&auto=format&fit=crop&q=60',
        salary: '₹32 - ₹42 LPA',
        status: 'Shortlisted',
        notes: 'Shortlisted based on algorithmic test score.',
        timeline: [
          { status: 'Applied', date: new Date(Date.now() - 3600000 * 48).toISOString(), notes: 'Application filed online' },
          { status: 'Shortlisted', date: new Date(Date.now() - 3600000 * 24).toISOString(), notes: 'Selected for Coding Round' }
        ],
        appliedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ];
  }

  // =========================================================================
  // USER & ROLE MANAGEMENT SYSTEM (Zero Data Loss)
  // =========================================================================

  async loadUsers(): Promise<User[]> {
    const list: User[] = [];
    const seen = new Set<string>();

    // 1. If Supabase is connected, query public.users
    if (this.supabase.client) {
      try {
        const { data, error } = await this.supabase.client
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          for (const row of data) {
            const u: User = {
              id: row.id,
              email: row.email,
              role: row.role as UserRole,
              fullName: row.full_name || row.email.split('@')[0],
              avatarUrl: row.avatar_url,
              phone: row.phone,
              status: (row.status as any) || (row.is_active ? 'active' : 'deactivated'),
              isActive: row.is_active !== false,
              invitedAt: row.invited_at,
              activatedAt: row.activated_at,
              createdAt: row.created_at || new Date().toISOString(),
              updatedAt: row.updated_at
            };
            seen.add(u.email.toLowerCase());
            seen.add(u.id);
            list.push(u);
          }
        }
      } catch (err) {
        console.warn('Could not query public.users:', err);
      }
    }

    // 2. Incorporate Students from StudentService
    for (const s of this.studentService.students()) {
      const emailKey = s.email.toLowerCase();
      if (!seen.has(emailKey) && !seen.has(s.userId) && !seen.has(s.id)) {
        seen.add(emailKey);
        if (s.userId) seen.add(s.userId);
        list.push({
          id: s.userId || s.id,
          email: s.email,
          fullName: s.fullName,
          role: 'student',
          avatarUrl: s.profilePhoto,
          phone: s.phone,
          department: s.department,
          rollNumber: s.rollNumber,
          isActive: s.isActive !== false,
          status: s.isActive === false ? 'deactivated' : 'active',
          createdAt: s.createdAt || '2025-08-01T10:00:00Z',
          updatedAt: s.updatedAt
        });
      }
    }

    // 3. Incorporate Alumni from AlumniService
    for (const a of this.alumniService.alumni()) {
      const emailKey = a.email.toLowerCase();
      if (!seen.has(emailKey) && !seen.has(a.userId) && !seen.has(a.id)) {
        seen.add(emailKey);
        if (a.userId) seen.add(a.userId);
        list.push({
          id: a.userId || a.id,
          email: a.email,
          fullName: a.fullName,
          role: 'alumni',
          avatarUrl: a.profilePhoto,
          phone: a.phone,
          department: a.department,
          company: a.company,
          designation: a.designation,
          isActive: a.isActive !== false,
          status: a.isActive === false ? 'deactivated' : 'active',
          createdAt: a.createdAt || '2024-06-15T09:30:00Z',
          updatedAt: a.updatedAt
        });
      }
    }

    // 4. Incorporate Mock Users (Recruiters, Admins, etc.)
    for (const m of MOCK_USERS) {
      const emailKey = m.email.toLowerCase();
      if (!seen.has(emailKey) && !seen.has(m.id)) {
        seen.add(emailKey);
        seen.add(m.id);
        list.push({
          ...m,
          status: m.isActive === false ? 'deactivated' : 'active',
          isActive: m.isActive !== false
        });
      }
    }

    this.users.set(list);
    return list;
  }

  async updateUserRole(
    userId: string,
    newRole: UserRole,
    reason: string = 'Administrative role reassignment'
  ): Promise<{ success: boolean; message: string }> {
    const currentAdmin = this.authService.currentUser();
    if (!this.authService.isAdmin()) {
      this.toast.error('Unauthorized', 'Only system administrators can modify user roles.');
      return { success: false, message: 'Unauthorized: Admin privileges required.' };
    }

    // Prevent self-demotion
    if (currentAdmin && (currentAdmin.id === userId || currentAdmin.email === userId) && newRole !== 'admin') {
      this.toast.error('Operation Blocked', 'You cannot demote your own administrator account to prevent administrative lockout.');
      return { success: false, message: 'Self-demotion blocked.' };
    }

    const targetUser = this.users().find(u => u.id === userId || u.email === userId);
    const oldRole = targetUser?.role || 'student';
    const userName = targetUser?.fullName || 'User';

    if (oldRole === newRole) {
      this.toast.info('No Change', `${userName} is already assigned the ${newRole.toUpperCase()} role.`);
      return { success: true, message: 'Role unchanged.' };
    }

    // 1. Supabase RPC / DB Update
    if (this.supabase.client) {
      try {
        const { error: rpcError } = await this.supabase.client.rpc('admin_update_user_role', {
          p_user_id: userId,
          p_new_role: newRole,
          p_reason: reason
        });

        if (rpcError) {
          const { error: updError } = await this.supabase.client
            .from('users')
            .update({ role: newRole, updated_at: new Date().toISOString() })
            .eq('id', userId);

          if (updError) throw updError;
        }
      } catch (err) {
        console.warn('Supabase role update error (fallback to local state):', err);
      }
    }

    // 2. Update local users signal
    this.users.update(list => list.map(u => {
      if (u.id === userId || u.email === userId) {
        return { ...u, role: newRole, updatedAt: new Date().toISOString() };
      }
      return u;
    }));

    // 3. Synchronize corresponding student/alumni stores without deleting data
    if (newRole === 'alumni') {
      const existingAlumni = this.alumniService.alumni().find(a => a.userId === userId || a.email === targetUser?.email);
      if (!existingAlumni) {
        const student = this.studentService.students().find(s => s.userId === userId || s.email === targetUser?.email);
        const newAlum: Alumni = {
          id: `a-${Date.now()}`,
          userId: userId,
          alumniId: `ALUM-${new Date().getFullYear()}-${userId.substring(0, 4)}`,
          fullName: userName,
          email: targetUser?.email || '',
          profilePhoto: targetUser?.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          phone: student?.phone || targetUser?.phone || '+91 98765 43210',
          graduationYear: student?.graduationYear || new Date().getFullYear(),
          department: student?.department || 'Computer Science & Engineering',
          company: student?.placedCompany || 'Corporate Partner',
          designation: 'Software Engineer',
          experienceYears: 1,
          skills: student?.skills || ['System Design', 'Cloud'],
          preferredDomains: ['Software Development'],
          bio: student?.bio || 'Alumni mentor and industry professional offering career guidance.',
          linkedinUrl: student?.linkedinUrl || 'https://linkedin.com',
          availableForMentoring: true,
          menteesCount: 0,
          rating: 5.0,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.alumniService.addAlumniDirectly(newAlum);
      }
    } else if (newRole === 'student') {
      const existingStudent = this.studentService.students().find(s => s.userId === userId || s.email === targetUser?.email);
      if (!existingStudent) {
        const alumni = this.alumniService.alumni().find(a => a.userId === userId || a.email === targetUser?.email);
        const newStud: Student = {
          id: `s-${Date.now()}`,
          userId: userId,
          fullName: userName,
          email: targetUser?.email || '',
          profilePhoto: targetUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          phone: alumni?.phone || targetUser?.phone || '+91 98765 43210',
          department: alumni?.department || 'Computer Science & Engineering',
          graduationYear: new Date().getFullYear() + 1,
          rollNumber: `26CS${Math.floor(Math.random() * 899 + 100)}`,
          cgpa: 8.5,
          tenthPercentage: 88.0,
          twelfthPercentage: 86.5,
          skills: alumni?.skills || ['Java', 'SQL'],
          preferredDomain: 'Software Engineering',
          bio: alumni?.bio || 'Placement candidate preparing for campus recruitment drives.',
          githubUrl: 'https://github.com',
          linkedinUrl: alumni?.linkedinUrl || 'https://linkedin.com',
          portfolioUrl: '',
          resumeUrl: '',
          placementStatus: 'In Progress',
          profileCompletion: 85,
          isActive: true,
          projects: [],
          certifications: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        this.studentService.addStudentDirectly(newStud);
      }
    }

    // 4. Update current user if acting on self
    if (this.authService.currentUser()?.id === userId) {
      this.authService.currentUser.update(curr => curr ? { ...curr, role: newRole } : null);
    }

    // 5. Log audit trail
    this.auditLog.logAction('UPDATE_USER_ROLE', 'user', userId, {
      userName,
      userEmail: targetUser?.email,
      oldRole,
      newRole,
      reason,
      performedBy: currentAdmin?.fullName || 'Placement Administrator',
      dataPreserved: 'All student/alumni records, applications, tasks, and historical placement records preserved intact'
    });

    this.toast.success(
      'Role Updated Successfully',
      `${userName}'s role changed from ${oldRole.toUpperCase()} to ${newRole.toUpperCase()}. Zero data was lost.`
    );

    return { success: true, message: 'Role updated successfully.' };
  }

  getUserDetails(userId: string): {
    user?: User;
    student?: Student;
    alumni?: Alumni;
  } {
    const user = this.users().find(u => u.id === userId || u.email === userId);
    const student = this.studentService.students().find(s => s.userId === userId || s.id === userId || s.email === user?.email);
    const alumni = this.alumniService.alumni().find(a => a.userId === userId || a.id === userId || a.email === user?.email);

    return { user, student, alumni };
  }
}
