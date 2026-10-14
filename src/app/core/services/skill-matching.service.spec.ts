import { TestBed } from '@angular/core/testing';
import { SkillMatchingService, normalizeSkill, isSkillMatched } from './skill-matching.service';
import { Student } from '../models/student.model';
import { Job } from '../models/job.model';

describe('SkillMatchingService — Phase 1 Company ↔ Student Skill Matching', () => {
  let service: SkillMatchingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SkillMatchingService]
    });
    service = TestBed.inject(SkillMatchingService);
  });

  it('1. should normalize case and alias variations correctly without false positives', () => {
    expect(normalizeSkill('JavaScript')).toBe('javascript');
    expect(normalizeSkill('JS')).toBe('javascript');
    expect(normalizeSkill('Node.js')).toBe('node.js');
    expect(normalizeSkill('Node')).toBe('node.js');
    expect(normalizeSkill('React.js')).toBe('react');
    expect(normalizeSkill('PostgreSQL')).toBe('postgresql');
    expect(normalizeSkill('Postgres')).toBe('postgresql');
    expect(normalizeSkill('Spring Boot')).toBe('spring boot');
    expect(normalizeSkill('REST API')).toBe('rest api');
    expect(normalizeSkill('REST')).toBe('rest api');
    
    // Ensure Java does not falsely match JavaScript
    expect(normalizeSkill('Java')).not.toBe(normalizeSkill('JavaScript'));
    // Ensure C does not falsely match C++
    expect(normalizeSkill('C')).not.toBe(normalizeSkill('C++'));
  });

  it('2. should calculate 100% when student has all required skills', () => {
    const student: Partial<Student> = {
      id: 'std-1',
      skills: ['Java', 'SQL', 'Git', 'Spring Boot', 'REST API']
    };
    const job: Partial<Job> = {
      id: 'job-1',
      companyId: 'comp-1',
      companyName: 'ABC Technologies',
      title: 'Software Developer',
      requiredSkills: ['Java', 'SQL', 'Git', 'Spring Boot', 'REST API']
    };

    const match = service.calculateJobSkillMatch(student as Student, job as Job);
    expect(match.matchPercentage).toBe(100);
    expect(match.matchedSkills.length).toBe(5);
    expect(match.missingSkills.length).toBe(0);
  });

  it('3. should calculate exactly 80% when 4 out of 5 skills match (user example)', () => {
    const student: Partial<Student> = {
      id: 'std-1',
      skills: ['Java', 'SQL', 'Git', 'REST API']
    };
    const job: Partial<Job> = {
      id: 'job-1',
      companyId: 'comp-1',
      companyName: 'ABC Technologies',
      title: 'Software Developer',
      requiredSkills: ['Java', 'SQL', 'Git', 'Spring Boot', 'REST API']
    };

    const match = service.calculateJobSkillMatch(student as Student, job as Job);
    expect(match.matchPercentage).toBe(80);
    expect(match.matchedSkills).toEqual(['Java', 'SQL', 'Git', 'REST API']);
    expect(match.missingSkills).toEqual(['Spring Boot']);
  });

  it('4. should calculate 0% when student has none of the required skills', () => {
    const student: Partial<Student> = {
      id: 'std-1',
      skills: ['PHP', 'Laravel']
    };
    const job: Partial<Job> = {
      id: 'job-1',
      companyId: 'comp-1',
      companyName: 'CloudCorp',
      title: 'Golang Engineer',
      requiredSkills: ['Go', 'Kubernetes', 'gRPC']
    };

    const match = service.calculateJobSkillMatch(student as Student, job as Job);
    expect(match.matchPercentage).toBe(0);
    expect(match.matchedSkills.length).toBe(0);
    expect(match.missingSkills.length).toBe(3);
  });

  it('5. should handle job with no required skills without dividing by zero', () => {
    const student: Partial<Student> = {
      id: 'std-1',
      skills: ['Java', 'Python']
    };
    const job: Partial<Job> = {
      id: 'job-1',
      companyId: 'comp-1',
      companyName: 'General Hire',
      title: 'Graduate Trainee',
      requiredSkills: []
    };

    const match = service.calculateJobSkillMatch(student as Student, job as Job);
    expect(match.hasJobRequirements).toBe(false);
    expect(match.matchPercentage).toBeNull();
    expect(match.statusMessage).toBe('Skill analysis unavailable — this job has no defined skill requirements.');
  });

  it('6. should handle student with no skills without displaying misleading percentages', () => {
    const student: Partial<Student> = {
      id: 'std-1',
      skills: []
    };
    const job: Partial<Job> = {
      id: 'job-1',
      companyId: 'comp-1',
      companyName: 'Google',
      title: 'Software Engineer',
      requiredSkills: ['Java', 'DSA']
    };

    const match = service.calculateJobSkillMatch(student as Student, job as Job);
    expect(match.hasStudentSkills).toBe(false);
    expect(match.matchPercentage).toBeNull();
    expect(match.statusMessage).toBe('Skill analysis unavailable — student skills have not been added.');
  });

  it('7. should not inflate percentage if duplicate skills are passed in job requirements', () => {
    const student: Partial<Student> = {
      id: 'std-1',
      skills: ['Java', 'SQL']
    };
    const job: Partial<Job> = {
      id: 'job-1',
      companyId: 'comp-1',
      companyName: 'Tech Co',
      title: 'Backend Engineer',
      requiredSkills: ['Java', 'java', 'SQL', 'Docker'] // 'Java' is repeated
    };

    const match = service.calculateJobSkillMatch(student as Student, job as Job);
    // Unique skills: Java, SQL, Docker (3 total). Matched: Java, SQL (2). Percentage = round(2/3 * 100) = 67%
    expect(match.requiredSkills.length).toBe(3);
    expect(match.matchPercentage).toBe(67);
  });
});
