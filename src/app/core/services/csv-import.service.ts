import { Injectable, inject } from '@angular/core';
import { AdminUserService, NewStudentForm, NewAlumniForm } from './admin-user.service';
import { OrganizationService } from './organization.service';
import { AuditLogService } from './audit-log.service';
import { ToastService } from './toast.service';

export interface CsvValidationError {
  rowNumber: number;
  field: string;
  message: string;
  rawValue?: string;
}

export interface CsvParseResult<T> {
  role: 'student' | 'alumni';
  totalRows: number;
  validRows: T[];
  invalidRows: { rowNumber: number; data: any; errors: CsvValidationError[] }[];
  errorsCount: number;
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CsvImportService {
  private adminUserService = inject(AdminUserService);
  private orgService = inject(OrganizationService);
  private auditLog = inject(AuditLogService);
  private toast = inject(ToastService);

  // Parse CSV text into raw header and row arrays
  parseRawCsv(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[\s_-]+/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.every(v => v === '')) continue;
      const rowObj: Record<string, string> = {};
      rawHeaders.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      rows.push(rowObj);
    }

    return { headers: rawHeaders, rows };
  }

  // Validate and parse Students CSV
  async validateStudentsCsv(csvText: string): Promise<CsvParseResult<NewStudentForm>> {
    const { rows } = this.parseRawCsv(csvText);
    const validRows: NewStudentForm[] = [];
    const invalidRows: { rowNumber: number; data: any; errors: CsvValidationError[] }[] = [];
    const warnings: string[] = [];

    const depts = this.orgService.departments();
    const batches = this.orgService.batches();

    const seenEmails = new Set<string>();
    const seenRolls = new Set<string>();

    for (let idx = 0; idx < rows.length; idx++) {
      const rowNum = idx + 2; // +1 for 1-indexing, +1 for header
      const r = rows[idx];
      const errors: CsvValidationError[] = [];

      // Extract fields flexibly with fallback headers
      const fullName = (r['fullname'] || r['name'] || r['studentname'] || '').trim();
      const email = (r['email'] || r['emailaddress'] || '').trim();
      const rollNumber = (r['rollnumber'] || r['rollno'] || r['studentid'] || r['id'] || '').trim().toUpperCase();
      const deptRaw = (r['department'] || r['branch'] || r['dept'] || 'CSE').trim();
      const course = (r['course'] || r['degree'] || 'B.Tech').trim();
      const batchRaw = (r['batch'] || '').trim();
      const gradYearStr = (r['graduationyear'] || r['gradyear'] || r['year'] || '2027').trim();
      const cgpaStr = (r['cgpa'] || r['gpa'] || '7.5').trim();
      const phone = (r['phone'] || r['mobilenumber'] || r['contact'] || '').trim();
      const skillsStr = (r['skills'] || r['technologies'] || 'Java, SQL').trim();
      const preferredDomain = (r['preferreddomain'] || r['domain'] || 'Software Development').trim();
      const placementStatus = (r['placementstatus'] || r['status'] || 'Not Placed').trim();

      // Validation 1: Full Name
      if (!fullName || fullName.length < 2) {
        errors.push({ rowNumber: rowNum, field: 'fullName', message: 'Full name is required (min 2 chars).' });
      }

      // Validation 2: Email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        errors.push({ rowNumber: rowNum, field: 'email', message: 'Valid email address is required.', rawValue: email });
      } else if (seenEmails.has(email.toLowerCase())) {
        errors.push({ rowNumber: rowNum, field: 'email', message: `Duplicate email "${email}" within CSV file.` });
      } else {
        seenEmails.add(email.toLowerCase());
      }

      // Validation 3: Roll Number
      if (!rollNumber) {
        errors.push({ rowNumber: rowNum, field: 'rollNumber', message: 'Student Roll Number is required.' });
      } else if (seenRolls.has(rollNumber)) {
        errors.push({ rowNumber: rowNum, field: 'rollNumber', message: `Duplicate Roll Number "${rollNumber}" within CSV file.` });
      } else {
        seenRolls.add(rollNumber);
      }

      // Validation 4: CGPA range
      const cgpa = parseFloat(cgpaStr);
      if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
        errors.push({ rowNumber: rowNum, field: 'cgpa', message: `CGPA must be a number between 0.0 and 10.0 (got "${cgpaStr}").`, rawValue: cgpaStr });
      }

      // Validation 5: Graduation Year
      const gradYear = parseInt(gradYearStr, 10);
      if (isNaN(gradYear) || gradYear < 2000 || gradYear > 2035) {
        errors.push({ rowNumber: rowNum, field: 'graduationYear', message: `Graduation year must be between 2000 and 2035 (got "${gradYearStr}").` });
      }

      // Resolve Department
      let resolvedDept = 'Computer Science & Engineering';
      let resolvedDeptId: string | undefined = undefined;
      const matchedDept = depts.find(d =>
        d.code.toLowerCase() === deptRaw.toLowerCase() ||
        d.name.toLowerCase().includes(deptRaw.toLowerCase())
      );
      if (matchedDept) {
        resolvedDept = matchedDept.name;
        resolvedDeptId = matchedDept.id;
      } else if (deptRaw) {
        resolvedDept = deptRaw;
      }

      // Resolve Batch
      let resolvedBatchId: string | undefined = undefined;
      const matchedBatch = batches.find(b => b.graduationYear === gradYear || b.name.toLowerCase().includes(batchRaw.toLowerCase()));
      if (matchedBatch) {
        resolvedBatchId = matchedBatch.id;
      }

      // Check Duplicates against DB / existing system
      if (errors.length === 0) {
        const dup = await this.adminUserService.checkDuplicates(email, rollNumber);
        if (dup.hasDuplicate) {
          errors.push({
            rowNumber: rowNum,
            field: dup.duplicateField || 'duplicate',
            message: dup.duplicateMessage || 'User with this email or roll number already exists in database.'
          });
        }
      }

      if (errors.length > 0) {
        invalidRows.push({ rowNumber: rowNum, data: r, errors });
      } else {
        const skills = skillsStr.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);
        validRows.push({
          fullName,
          email,
          rollNumber,
          department: resolvedDept,
          departmentId: resolvedDeptId,
          batchId: resolvedBatchId,
          course,
          batch: batchRaw || `Batch ${gradYear - 4}-${gradYear}`,
          graduationYear: gradYear,
          phone,
          cgpa: isNaN(cgpa) ? 7.5 : cgpa,
          skills: skills.length > 0 ? skills : ['Data Structures', 'Java'],
          preferredDomain,
          placementStatus: (['Not Placed', 'In Progress', 'Selected', 'Offer Accepted'].includes(placementStatus) ? placementStatus : 'Not Placed') as any
        });
      }
    }

    return {
      role: 'student',
      totalRows: rows.length,
      validRows,
      invalidRows,
      errorsCount: invalidRows.length,
      warnings
    };
  }

  // Validate and parse Alumni CSV
  async validateAlumniCsv(csvText: string): Promise<CsvParseResult<NewAlumniForm>> {
    const { rows } = this.parseRawCsv(csvText);
    const validRows: NewAlumniForm[] = [];
    const invalidRows: { rowNumber: number; data: any; errors: CsvValidationError[] }[] = [];
    const warnings: string[] = [];

    const depts = this.orgService.departments();
    const seenEmails = new Set<string>();
    const seenAlumniIds = new Set<string>();

    for (let idx = 0; idx < rows.length; idx++) {
      const rowNum = idx + 2;
      const r = rows[idx];
      const errors: CsvValidationError[] = [];

      const fullName = (r['fullname'] || r['name'] || r['alumniname'] || '').trim();
      const email = (r['email'] || r['emailaddress'] || '').trim();
      const alumniId = (r['alumniid'] || r['id'] || '').trim().toUpperCase();
      const gradYearStr = (r['graduationyear'] || r['gradyear'] || r['batch'] || '2023').trim();
      const deptRaw = (r['department'] || r['branch'] || 'CSE').trim();
      const company = (r['company'] || r['currentcompany'] || r['organization'] || '').trim();
      const designation = (r['designation'] || r['jobtitle'] || r['role'] || 'Software Engineer').trim();
      const expStr = (r['experienceyears'] || r['experience'] || r['exp'] || '2.0').trim();
      const skillsStr = (r['skills'] || r['technologies'] || 'System Design').trim();
      const phone = (r['phone'] || r['mobile'] || '').trim();
      const linkedinUrl = (r['linkedin'] || r['linkedinurl'] || '').trim();
      const contactPref = (r['contactpreference'] || 'Email & Chat').trim();

      // Validation 1: Full Name
      if (!fullName || fullName.length < 2) {
        errors.push({ rowNumber: rowNum, field: 'fullName', message: 'Full name is required (min 2 chars).' });
      }

      // Validation 2: Email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        errors.push({ rowNumber: rowNum, field: 'email', message: 'Valid email address is required.' });
      } else if (seenEmails.has(email.toLowerCase())) {
        errors.push({ rowNumber: rowNum, field: 'email', message: `Duplicate email "${email}" within CSV file.` });
      } else {
        seenEmails.add(email.toLowerCase());
      }

      // Validation 3: Optional Alumni ID uniqueness
      if (alumniId) {
        if (seenAlumniIds.has(alumniId)) {
          errors.push({ rowNumber: rowNum, field: 'alumniId', message: `Duplicate Alumni ID "${alumniId}" within CSV.` });
        } else {
          seenAlumniIds.add(alumniId);
        }
      }

      // Validation 4: Graduation Year
      const gradYear = parseInt(gradYearStr, 10);
      if (isNaN(gradYear) || gradYear < 1990 || gradYear > 2030) {
        errors.push({ rowNumber: rowNum, field: 'graduationYear', message: `Graduation year must be a valid year (got "${gradYearStr}").` });
      }

      // Resolve Department
      let resolvedDept = 'Computer Science & Engineering';
      let resolvedDeptId: string | undefined = undefined;
      const matchedDept = depts.find(d =>
        d.code.toLowerCase() === deptRaw.toLowerCase() ||
        d.name.toLowerCase().includes(deptRaw.toLowerCase())
      );
      if (matchedDept) {
        resolvedDept = matchedDept.name;
        resolvedDeptId = matchedDept.id;
      } else if (deptRaw) {
        resolvedDept = deptRaw;
      }

      // Check Duplicates against DB
      if (errors.length === 0) {
        const dup = await this.adminUserService.checkDuplicates(email, undefined, alumniId || undefined);
        if (dup.hasDuplicate) {
          errors.push({
            rowNumber: rowNum,
            field: dup.duplicateField || 'duplicate',
            message: dup.duplicateMessage || 'User already exists in database.'
          });
        }
      }

      if (errors.length > 0) {
        invalidRows.push({ rowNumber: rowNum, data: r, errors });
      } else {
        const skills = skillsStr.split(/[,;|]/).map(s => s.trim()).filter(s => s.length > 0);
        validRows.push({
          fullName,
          email,
          alumniId: alumniId || undefined,
          graduationYear: gradYear,
          department: resolvedDept,
          departmentId: resolvedDeptId,
          company: company || 'Tech Professional',
          designation: designation || 'Software Engineer',
          experienceYears: parseFloat(expStr) || 2.0,
          skills: skills.length > 0 ? skills : ['System Design', 'Cloud'],
          phone,
          linkedinUrl,
          contactPreference: contactPref,
          availableForMentoring: true
        });
      }
    }

    return {
      role: 'alumni',
      totalRows: rows.length,
      validRows,
      invalidRows,
      errorsCount: invalidRows.length,
      warnings
    };
  }

  // Execute bulk import with progress tracking
  async executeBulkStudents(
    students: NewStudentForm[],
    onProgress?: (current: number, total: number) => void
  ): Promise<{ successCount: number; failureCount: number; failedDetails: string[] }> {
    let successCount = 0;
    let failureCount = 0;
    const failedDetails: string[] = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      try {
        await this.adminUserService.createStudent(student);
        successCount++;
      } catch (err: any) {
        failureCount++;
        failedDetails.push(`${student.fullName} (${student.rollNumber}): ${err.message}`);
      }
      if (onProgress) {
        onProgress(i + 1, students.length);
      }
    }

    this.auditLog.logAction('BULK_IMPORT_STUDENTS', 'student', 'bulk', {
      total: students.length,
      successful: successCount,
      failed: failureCount
    });

    return { successCount, failureCount, failedDetails };
  }

  async executeBulkAlumni(
    alumni: NewAlumniForm[],
    onProgress?: (current: number, total: number) => void
  ): Promise<{ successCount: number; failureCount: number; failedDetails: string[] }> {
    let successCount = 0;
    let failureCount = 0;
    const failedDetails: string[] = [];

    for (let i = 0; i < alumni.length; i++) {
      const alum = alumni[i];
      try {
        await this.adminUserService.createAlumni(alum);
        successCount++;
      } catch (err: any) {
        failureCount++;
        failedDetails.push(`${alum.fullName} (${alum.email}): ${err.message}`);
      }
      if (onProgress) {
        onProgress(i + 1, alumni.length);
      }
    }

    this.auditLog.logAction('BULK_IMPORT_ALUMNI', 'alumni', 'bulk', {
      total: alumni.length,
      successful: successCount,
      failed: failureCount
    });

    return { successCount, failureCount, failedDetails };
  }

  // Generates downloadable CSV template
  generateSampleCsv(type: 'student' | 'alumni'): string {
    if (type === 'student') {
      return `fullName,email,rollNumber,department,course,batch,graduationYear,cgpa,phone,skills,preferredDomain,placementStatus\n"Aarav Gupta","aarav.gupta@careernexus.edu","23CS201","Computer Science & Engineering","B.Tech","Batch 2023-2027",2027,8.75,"+91 98765 11221","Java, C++, DSA, SQL","Software Development","In Progress"\n"Diya Roy","diya.roy@careernexus.edu","23IT202","Information Technology","B.Tech","Batch 2023-2027",2027,9.12,"+91 98765 11222","React, TypeScript, Node.js","Full Stack","Not Placed"`;
    } else {
      return `fullName,email,alumniId,graduationYear,department,company,designation,experienceYears,skills,phone,linkedin,contactPreference\n"Karan Mehra","karan.mehra@microsoft.com","ALUM-2022-045",2022,"Computer Science & Engineering","Microsoft","Senior Cloud Engineer",3.5,"Azure, C#, Kubernetes","+91 98111 22334","https://linkedin.com/in/karanmehra","Email & Chat"\n"Sneha Reddy","sneha.reddy@amazon.com","",2023,"Information Technology","Amazon","SDE 2",2.0,"AWS, Java, DynamoDB","+91 98111 22335","https://linkedin.com/in/snehareddy","Chat Only"`;
    }
  }
}
