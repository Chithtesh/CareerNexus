export interface Job {
  id: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  companyLocation: string;
  title: string;
  description: string;
  responsibilities?: string[];
  requirements?: string[];
  domain: string; // 'Software Development', 'Cloud Computing', 'AI / Machine Learning', 'Frontend Development', 'Backend Development', 'Full Stack', 'FinTech', 'Cybersecurity', 'Data Science'
  location: string;
  employmentType: 'Full Time' | 'Full Time + 6M Internship' | 'Internship' | 'Contract';
  salary: string; // e.g. '₹32 - ₹42 LPA'
  eligibility: string;
  minimumCgpa: number;
  requiredSkills: string[];
  applicationDeadline: string; // ISO string
  status: 'Active' | 'Closed' | 'Upcoming';
  vacancies: number;
  applicantsCount: number;
  hasApplied?: boolean;
  createdAt: string;
  updatedAt: string;
}
