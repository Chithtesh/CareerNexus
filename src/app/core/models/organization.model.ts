export interface Department {
  id: string;
  code: string;
  name: string;
  headOfDepartment?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  establishedYear?: number;
  buildingLocation?: string;
  building?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Program {
  id: string;
  departmentId?: string;
  departmentCode?: string;
  departmentName?: string;
  code: string;
  name: string;
  degreeLevel: 'Undergraduate' | 'Postgraduate' | 'Doctorate' | 'Diploma' | string;
  durationYears: number;
  totalCredits?: number;
  description?: string;
  eligibility?: string;
  admissionInfo?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyllabusUnit {
  id: string;
  unitNumber: number;
  unitTitle: string;
  title?: string;
  description?: string;
  topics: string[];
  hours?: number;
  learningObjectives?: string[];
}

export type CourseType = 'Core' | 'Professional Elective' | 'Open Elective' | 'Laboratory' | 'Project / Seminar' | 'Elective' | 'Lab' | 'Project' | string;

export interface Subject {
  id: string;
  programId: string;
  code: string;
  name: string;
  year?: number; // 1, 2, 3, 4
  semester: number; // 1 to 8
  credits: number;
  courseType: CourseType;
  description?: string;
  prerequisites?: string[];
  learningObjectives?: string[];
  units?: SyllabusUnit[];
  syllabusUnits?: SyllabusUnit[];
  referenceBooks?: string[];
  labDetails?: string;
  skillsDeveloped?: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Batch {
  id: string;
  name: string;
  graduationYear: number;
  startYear: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentStudentYearDistribution {
  year1: number;
  year2: number;
  year3: number;
  year4: number;
  total: number;
  totalStudents?: number;
  firstYear: { count: number; percentage: number };
  secondYear: { count: number; percentage: number };
  thirdYear: { count: number; percentage: number };
  fourthYear: { count: number; percentage: number };
}

export interface DepartmentPlacementMetrics {
  totalStudents: number;
  eligibleStudents: number;
  appliedStudents: number;
  shortlistedStudents: number;
  interviewedStudents: number;
  selectedStudents: number;
  placedStudents: number;
  placementRate: number; // Percentage
  applicationsPerStudent: number;
  avgSkillMatch: number; // Percentage
  avgPackage: string;
  highestPackage: string;
  averagePackageLpa?: number;
  highestPackageLpa?: number;
}

export interface DepartmentCompanyRecruiterRelation {
  companyId: string;
  companyName: string;
  companyLogo: string;
  industry: string;
  activeJobsCount: number;
  applicationsCount: number;
  applicantCount?: number;
  shortlistedCount: number;
  interviewCount: number;
  selectedCount: number;
  placedCount: number;
  company?: {
    id: string;
    name: string;
    industry?: string;
    location?: string;
    logoUrl?: string;
  };
  connectedRecruiters?: {
    name: string;
    designation: string;
    email: string;
    phone?: string;
  }[];
  recruiters: {
    name: string;
    designation: string;
    email: string;
    jobsManaged: string[];
  }[];
  jobs: {
    id: string;
    title: string;
    salary: string;
    salaryMinLpa?: number;
    salaryMaxLpa?: number;
    applicationsCount: number;
    shortlistedCount: number;
    domain: string;
  }[];
}
