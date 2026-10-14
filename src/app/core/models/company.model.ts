export interface Company {
  id: string;
  name: string;
  logo: string;
  website: string;
  description: string;
  industry: string;
  location: string;
  tier: 'Super Dream (Tier 1)' | 'Dream (Tier 2)' | 'Core / Standard';
  activeJobsCount?: number;
  placedStudentsCount?: number;
  averagePackage?: string;
  createdAt: string;
  updatedAt: string;
}
