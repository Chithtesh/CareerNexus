import { Student } from '../models/student.model';
import { Alumni } from '../models/alumni.model';
import { Company } from '../models/company.model';
import { Job } from '../models/job.model';
import { Application } from '../models/application.model';
import { ResourceFolder, ResourceFile } from '../models/resource.model';
import { Conversation, ChatMessage } from '../models/message.model';
import { NotificationItem } from '../models/notification.model';
import { User } from '../models/user.model';

export const MOCK_USERS: User[] = [
  {
    id: 'u-student-01',
    username: 'student001',
    email: 'student001@careernexus.edu',
    role: 'student',
    fullName: 'Rahul Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    status: 'active',
    createdAt: '2025-08-01T10:00:00Z'
  },
  {
    id: 'u-alumni-01',
    username: 'alumni001',
    email: 'alumni001@google.com',
    role: 'alumni',
    fullName: 'Priya Nair',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    status: 'active',
    createdAt: '2024-06-15T09:30:00Z'
  },
  {
    id: 'u-recruiter-01',
    username: 'recruiter001',
    email: 'recruiter001@google.com',
    role: 'recruiter',
    fullName: 'Sarah Jenkins (Google University Talent)',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    status: 'active',
    createdAt: '2025-01-15T09:00:00Z'
  },
  {
    id: 'u-admin-01',
    username: 'admin001',
    email: 'admin001@careernexus.edu',
    role: 'admin',
    fullName: 'Dr. Anand Verma',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    status: 'active',
    createdAt: '2024-01-01T08:00:00Z'
  },
  {
    id: 'u-inactive-01',
    username: 'inactive001',
    email: 'inactive@careernexus.edu',
    role: 'student',
    fullName: 'Deactivated User',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    isActive: false,
    status: 'deactivated',
    createdAt: '2024-01-01T08:00:00Z'
  }
];

// 20 COMPANIES
export const MOCK_COMPANIES: Company[] = [
  {
    id: 'c-01',
    name: 'Google',
    logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&auto=format&fit=crop&q=80',
    website: 'https://careers.google.com',
    description: 'Global tech leader organizing world information with AI, Search, Cloud, and scalable distributed systems.',
    industry: 'Technology / Cloud / AI',
    location: 'Bengaluru, Hyderabad',
    tier: 'Super Dream (Tier 1)',
    activeJobsCount: 2,
    placedStudentsCount: 8,
    averagePackage: '₹38 LPA',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z'
  },
  {
    id: 'c-02',
    name: 'Microsoft',
    logo: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=128&auto=format&fit=crop&q=80',
    website: 'https://careers.microsoft.com',
    description: 'Empowering every person and organization with Azure Cloud, Windows, Office 365, and AI Copilots.',
    industry: 'Enterprise Software & Cloud',
    location: 'Bengaluru, Hyderabad, Noida',
    tier: 'Super Dream (Tier 1)',
    activeJobsCount: 2,
    placedStudentsCount: 12,
    averagePackage: '₹32 LPA',
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2026-09-25T00:00:00Z'
  },
  {
    id: 'c-03',
    name: 'Amazon',
    logo: 'https://images.unsplash.com/photo-1523474253246-720961237a9a?w=128&auto=format&fit=crop&q=80',
    website: 'https://amazon.jobs',
    description: 'Customer-obsessed global innovator in cloud computing (AWS), e-commerce logistics, and AI.',
    industry: 'E-Commerce / Cloud Computing',
    location: 'Bengaluru, Chennai, Hyderabad',
    tier: 'Super Dream (Tier 1)',
    activeJobsCount: 3,
    placedStudentsCount: 19,
    averagePackage: '₹29 LPA',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z'
  },
  {
    id: 'c-04',
    name: 'Atlassian',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.atlassian.com/company/careers',
    description: 'Unleashing the potential of every team with Jira, Confluence, Trello, and Bitbucket.',
    industry: 'Productivity & DevOps SaaS',
    location: 'Bengaluru (Hybrid)',
    tier: 'Super Dream (Tier 1)',
    activeJobsCount: 1,
    placedStudentsCount: 6,
    averagePackage: '₹36 LPA',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z'
  },
  {
    id: 'c-05',
    name: 'Adobe',
    logo: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.adobe.com/careers.html',
    description: 'Changing the world through digital experiences, creative cloud suite, Acrobat, and Firefly GenAI.',
    industry: 'Creative Tech & Media',
    location: 'Noida, Bengaluru',
    tier: 'Super Dream (Tier 1)',
    activeJobsCount: 2,
    placedStudentsCount: 7,
    averagePackage: '₹31 LPA',
    createdAt: '2024-02-10T00:00:00Z',
    updatedAt: '2026-09-22T00:00:00Z'
  },
  {
    id: 'c-06',
    name: 'Goldman Sachs',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.goldmansachs.com/careers',
    description: 'Global investment banking, algorithmic securities trading, and quantitative financial engineering.',
    industry: 'FinTech & Investment Banking',
    location: 'Bengaluru, Hyderabad',
    tier: 'Super Dream (Tier 1)',
    activeJobsCount: 2,
    placedStudentsCount: 9,
    averagePackage: '₹34 LPA',
    createdAt: '2024-02-15T00:00:00Z',
    updatedAt: '2026-09-25T00:00:00Z'
  },
  {
    id: 'c-07',
    name: 'Uber',
    logo: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.uber.com/careers',
    description: 'Igniting opportunity by setting the world in motion with high-throughput mobility systems.',
    industry: 'Mobility / Distributed Systems',
    location: 'Bengaluru, Hyderabad',
    tier: 'Super Dream (Tier 1)',
    activeJobsCount: 1,
    placedStudentsCount: 5,
    averagePackage: '₹39 LPA',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z'
  },
  {
    id: 'c-08',
    name: 'NVIDIA',
    logo: 'https://images.unsplash.com/photo-1618761714958-0efedcb7ec80?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.nvidia.com',
    description: 'World leader in accelerated computing, GPUs, CUDA deep learning, and AI infrastructure.',
    industry: 'Semiconductor & AI Hardware',
    location: 'Bengaluru, Pune',
    tier: 'Super Dream (Tier 1)',
    activeJobsCount: 2,
    placedStudentsCount: 4,
    averagePackage: '₹37 LPA',
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z'
  },
  {
    id: 'c-09',
    name: 'Razorpay',
    logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80',
    website: 'https://razorpay.com/jobs',
    description: 'Powering seamless online payments, banking suites, and payroll infrastructure for digital businesses.',
    industry: 'FinTech & Payments',
    location: 'Bengaluru',
    tier: 'Super Dream (Tier 1)',
    activeJobsCount: 2,
    placedStudentsCount: 11,
    averagePackage: '₹25 LPA',
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: '2026-09-24T00:00:00Z'
  },
  {
    id: 'c-10',
    name: 'Cisco Systems',
    logo: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.cisco.com',
    description: 'Global leader in enterprise routing, switching, cybersecurity, and Webex collaboration.',
    industry: 'Networking & Cybersecurity',
    location: 'Bengaluru, Chennai',
    tier: 'Dream (Tier 2)',
    activeJobsCount: 2,
    placedStudentsCount: 15,
    averagePackage: '₹19 LPA',
    createdAt: '2024-03-20T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z'
  },
  {
    id: 'c-11',
    name: 'Oracle',
    logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.oracle.com',
    description: 'Autonomous cloud databases, high-performance computing clusters, and enterprise ERP systems.',
    industry: 'Cloud & Database Systems',
    location: 'Bengaluru, Hyderabad',
    tier: 'Dream (Tier 2)',
    activeJobsCount: 2,
    placedStudentsCount: 14,
    averagePackage: '₹18 LPA',
    createdAt: '2024-03-22T00:00:00Z',
    updatedAt: '2026-09-23T00:00:00Z'
  },
  {
    id: 'c-12',
    name: 'Flipkart',
    logo: 'https://images.unsplash.com/photo-1556742049-0a67e5572263?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.flipkartcareers.com',
    description: 'Leading Indian e-commerce marketplace innovating in supply chain, fintech, and retail media tech.',
    industry: 'E-Commerce / Logistics',
    location: 'Bengaluru',
    tier: 'Super Dream (Tier 1)',
    activeJobsCount: 2,
    placedStudentsCount: 16,
    averagePackage: '₹27 LPA',
    createdAt: '2024-03-25T00:00:00Z',
    updatedAt: '2026-09-26T00:00:00Z'
  },
  {
    id: 'c-13',
    name: 'Salesforce',
    logo: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.salesforce.com',
    description: 'The world #1 AI CRM, connecting companies and customers in the AI enterprise era.',
    industry: 'Cloud & Enterprise CRM',
    location: 'Hyderabad, Bengaluru',
    tier: 'Super Dream (Tier 1)',
    activeJobsCount: 1,
    placedStudentsCount: 8,
    averagePackage: '₹33 LPA',
    createdAt: '2024-04-01T00:00:00Z',
    updatedAt: '2026-09-27T00:00:00Z'
  },
  {
    id: 'c-14',
    name: 'Morgan Stanley',
    logo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.morganstanley.com',
    description: 'Ultra-low latency institutional securities, wealth management algorithms, and risk analytics.',
    industry: 'FinTech / High Frequency Trading',
    location: 'Mumbai, Bengaluru',
    tier: 'Super Dream (Tier 1)',
    activeJobsCount: 1,
    placedStudentsCount: 6,
    averagePackage: '₹30 LPA',
    createdAt: '2024-04-05T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z'
  },
  {
    id: 'c-15',
    name: 'Qualcomm',
    logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.qualcomm.com',
    description: 'Wireless tech innovator pioneering 5G, Wi-Fi 7, Snapdragon NPU mobile AI, and automotive telematics.',
    industry: 'Semiconductors & Wireless',
    location: 'Hyderabad, Bengaluru, Chennai',
    tier: 'Dream (Tier 2)',
    activeJobsCount: 2,
    placedStudentsCount: 10,
    averagePackage: '₹21 LPA',
    createdAt: '2024-04-10T00:00:00Z',
    updatedAt: '2026-09-24T00:00:00Z'
  },
  {
    id: 'c-16',
    name: 'Stripe',
    logo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&auto=format&fit=crop&q=80',
    website: 'https://stripe.com/jobs',
    description: 'Economic infrastructure for the internet, providing rock-solid APIs for billing and identity.',
    industry: 'FinTech / Developer Tools',
    location: 'Remote / Bengaluru',
    tier: 'Super Dream (Tier 1)',
    activeJobsCount: 1,
    placedStudentsCount: 3,
    averagePackage: '₹44 LPA',
    createdAt: '2024-04-12T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z'
  },
  {
    id: 'c-17',
    name: 'TCS Digital',
    logo: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.tcs.com',
    description: 'Premier digital innovation wing of Tata Consultancy Services building high-scale digital transformations.',
    industry: 'IT Services & Digital',
    location: 'Pan India',
    tier: 'Core / Standard',
    activeJobsCount: 2,
    placedStudentsCount: 45,
    averagePackage: '₹8.5 LPA',
    createdAt: '2024-04-15T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z'
  },
  {
    id: 'c-18',
    name: 'Infosys (Specialist)',
    logo: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.infosys.com',
    description: 'Specialist Programmer & Digital Specialist Engineer roles engineering modern cloud & AI products.',
    industry: 'IT Services & Consulting',
    location: 'Bengaluru, Pune, Mysuru',
    tier: 'Core / Standard',
    activeJobsCount: 2,
    placedStudentsCount: 38,
    averagePackage: '₹9.5 LPA',
    createdAt: '2024-04-20T00:00:00Z',
    updatedAt: '2026-09-22T00:00:00Z'
  },
  {
    id: 'c-19',
    name: 'Intel Corporation',
    logo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.intel.com',
    description: 'Driving semiconductor innovation, server architecture, firmware development, and neural processing units.',
    industry: 'Semiconductor & Hardware',
    location: 'Bengaluru',
    tier: 'Dream (Tier 2)',
    activeJobsCount: 1,
    placedStudentsCount: 7,
    averagePackage: '₹20 LPA',
    createdAt: '2024-04-25T00:00:00Z',
    updatedAt: '2026-09-25T00:00:00Z'
  },
  {
    id: 'c-20',
    name: 'Zomato & Blinkit',
    logo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=128&auto=format&fit=crop&q=80',
    website: 'https://www.zomato.com',
    description: 'Hyperlocal culinary discovery, 10-minute quick commerce supply chain, and real-time logistics tech.',
    industry: 'Consumer Tech & Quick Commerce',
    location: 'Gurugram, Bengaluru',
    tier: 'Dream (Tier 2)',
    activeJobsCount: 1,
    placedStudentsCount: 9,
    averagePackage: '₹24 LPA',
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z'
  }
];

// 30 ACTIVE & PAST JOBS
export const MOCK_JOBS: Job[] = [
  {
    id: 'j-01',
    companyId: 'c-01',
    companyName: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&auto=format&fit=crop&q=80',
    companyLocation: 'Bengaluru, Hyderabad',
    title: 'Software Development Engineer - Intern + FTE',
    description: 'Join Google Core Systems to build planetary-scale distributed infrastructure, search indexing algorithms, and cloud APIs. You will collaborate with world-class engineers on high-throughput microservices.',
    responsibilities: [
      'Design, develop, test, deploy, maintain and improve core software systems.',
      'Manage individual project priorities, deadlines, and deliverables.',
      'Optimize algorithmic bottlenecks across large-scale distributed clusters.'
    ],
    requirements: [
      'Proficiency in C++, Java, or Go with strong computer science fundamentals.',
      'Deep understanding of Data Structures, Algorithms, OS, and System Design.',
      'Active GitHub profile or competitive programming ranking is a plus.'
    ],
    domain: 'Software Development',
    location: 'Bengaluru',
    employmentType: 'Full Time + 6M Internship',
    salary: '₹36 - ₹45 LPA',
    eligibility: 'B.Tech CSE/IT/ECE with minimum 7.5 CGPA and no backlogs',
    minimumCgpa: 7.5,
    requiredSkills: ['C++', 'Java', 'Data Structures', 'Algorithms', 'Distributed Systems'],
    applicationDeadline: '2026-10-18T23:59:59Z',
    status: 'Active',
    vacancies: 8,
    applicantsCount: 64,
    hasApplied: true,
    createdAt: '2026-09-15T00:00:00Z',
    updatedAt: '2026-09-30T00:00:00Z'
  },
  {
    id: 'j-02',
    companyId: 'c-02',
    companyName: 'Microsoft',
    companyLogo: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=128&auto=format&fit=crop&q=80',
    companyLocation: 'Hyderabad, Bengaluru',
    title: 'Cloud Solutions Engineer - Azure Systems',
    description: 'Work directly on Azure Compute, Kubernetes orchestration, and AI Copilot backend pipelines. Build resilient microservices with 99.999% SLA.',
    responsibilities: [
      'Design and implement high-availability cloud infrastructure components.',
      'Collaborate with global teams to monitor telemetry and scale cloud microservices.',
      'Develop automated CI/CD and deployment safety checks.'
    ],
    requirements: [
      'Strong problem solving skills in C#, C++, or Java.',
      'Understanding of Cloud Computing, Containerization (Docker/K8s), and REST APIs.',
      'Minimum 7.0 CGPA throughout academic career.'
    ],
    domain: 'Cloud Computing',
    location: 'Hyderabad',
    employmentType: 'Full Time',
    salary: '₹28 - ₹34 LPA',
    eligibility: 'B.Tech CSE/IT/AI&DS with minimum 7.0 CGPA',
    minimumCgpa: 7.0,
    requiredSkills: ['C#', 'Java', 'Azure', 'Kubernetes', 'Docker', 'System Design'],
    applicationDeadline: '2026-10-22T23:59:59Z',
    status: 'Active',
    vacancies: 6,
    applicantsCount: 52,
    hasApplied: true,
    createdAt: '2026-09-18T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z'
  },
  {
    id: 'j-03',
    companyId: 'c-03',
    companyName: 'Amazon',
    companyLogo: 'https://images.unsplash.com/photo-1523474253246-720961237a9a?w=128&auto=format&fit=crop&q=80',
    companyLocation: 'Bengaluru, Chennai',
    title: 'SDE 1 - Global Supply Chain & Payments',
    description: 'Build low-latency fulfillment systems, automated inventory dispatch pipelines, and high-throughput AWS payment microservices handling millions of transactions.',
    responsibilities: [
      'Write clean, maintainable Java/Kotlin microservices utilizing AWS services.',
      'Participate in design reviews and on-call operational excellence rotations.',
      'Improve throughput and latency of key order checkout pipelines.'
    ],
    requirements: [
      'B.Tech in Any Engineering Branch with 7.0+ CGPA.',
      'Strong proficiency in Object-Oriented Design, Concurrency, and SQL/NoSQL databases.'
    ],
    domain: 'Full Stack',
    location: 'Bengaluru',
    employmentType: 'Full Time',
    salary: '₹26 - ₹32 LPA',
    eligibility: 'B.Tech All Branches with minimum 7.0 CGPA',
    minimumCgpa: 7.0,
    requiredSkills: ['Java', 'Spring Boot', 'AWS', 'DynamoDB', 'Microservices'],
    applicationDeadline: '2026-10-15T23:59:59Z',
    status: 'Active',
    vacancies: 12,
    applicantsCount: 94,
    hasApplied: false,
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z'
  },
  {
    id: 'j-04',
    companyId: 'c-04',
    companyName: 'Atlassian',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    companyLocation: 'Bengaluru (Hybrid)',
    title: 'Frontend Platform Engineer - Jira & Confluence',
    description: 'Craft lightning-fast collaborative editing experiences, real-time presence indicators, and design system components using TypeScript, React, and GraphQL.',
    responsibilities: [
      'Develop modern, accessible, and responsive user interfaces.',
      'Optimize web vitals (LCP, INP, CLS) across heavy enterprise web apps.',
      'Build reusable UI components for the Atlassian Design System.'
    ],
    requirements: [
      'Deep mastery of modern JavaScript/TypeScript, React, CSS architectures.',
      'Experience with state management, web performance, and unit testing.'
    ],
    domain: 'Frontend Development',
    location: 'Bengaluru (Hybrid)',
    employmentType: 'Full Time',
    salary: '₹30 - ₹38 LPA',
    eligibility: 'B.Tech CSE/IT/ECE with minimum 7.5 CGPA',
    minimumCgpa: 7.5,
    requiredSkills: ['TypeScript', 'React', 'GraphQL', 'Next.js', 'Web Performance'],
    applicationDeadline: '2026-10-25T23:59:59Z',
    status: 'Active',
    vacancies: 4,
    applicantsCount: 38,
    hasApplied: false,
    createdAt: '2026-09-20T00:00:00Z',
    updatedAt: '2026-09-30T00:00:00Z'
  },
  {
    id: 'j-05',
    companyId: 'c-05',
    companyName: 'Adobe',
    companyLogo: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=128&auto=format&fit=crop&q=80',
    companyLocation: 'Noida, Bengaluru',
    title: 'Computer Vision & AI/ML Research Engineer',
    description: 'Work on Adobe Firefly neural models, real-time image segmentation in WebGL/WebGPU, and generative diffusion pipelines.',
    responsibilities: [
      'Train, fine-tune, and optimize computer vision models for image/video synthesis.',
      'Deploy lightweight neural weights for on-device browser inference.'
    ],
    requirements: [
      'B.Tech or M.Tech in CSE/AI/Data Science with 7.5+ CGPA.',
      'Strong mathematics, Linear Algebra, PyTorch, and Python skills.'
    ],
    domain: 'AI / Machine Learning',
    location: 'Noida',
    employmentType: 'Full Time',
    salary: '₹25 - ₹35 LPA',
    eligibility: 'B.Tech/M.Tech with 7.5+ CGPA and AI coursework',
    minimumCgpa: 7.5,
    requiredSkills: ['Python', 'PyTorch', 'Computer Vision', 'Deep Learning', 'C++'],
    applicationDeadline: '2026-10-20T23:59:59Z',
    status: 'Active',
    vacancies: 5,
    applicantsCount: 45,
    hasApplied: false,
    createdAt: '2026-09-16T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z'
  },
  {
    id: 'j-06',
    companyId: 'c-06',
    companyName: 'Goldman Sachs',
    companyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&auto=format&fit=crop&q=80',
    companyLocation: 'Bengaluru, Hyderabad',
    title: 'Quantitative Technology Analyst - Global Markets',
    description: 'Build real-time trading order books, financial graph risk engines, and ultra-reliable settlement distributed systems.',
    responsibilities: [
      'Develop low-latency Java and C++ calculation services.',
      'Work alongside traders and quantitative researchers to implement mathematical models.'
    ],
    requirements: [
      'B.Tech all branches with 8.0+ CGPA and exceptional math/DSA skills.'
    ],
    domain: 'FinTech',
    location: 'Bengaluru',
    employmentType: 'Full Time',
    salary: '₹28 - ₹36 LPA',
    eligibility: 'B.Tech with minimum 8.0 CGPA',
    minimumCgpa: 8.0,
    requiredSkills: ['Java', 'C++', 'Python', 'SQL', 'Algorithms', 'Financial Math'],
    applicationDeadline: '2026-10-14T23:59:59Z',
    status: 'Active',
    vacancies: 5,
    applicantsCount: 58,
    hasApplied: false,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: '2026-09-27T00:00:00Z'
  },
  {
    id: 'j-07',
    companyId: 'c-07',
    companyName: 'Uber',
    companyLogo: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=128&auto=format&fit=crop&q=80',
    companyLocation: 'Bengaluru, Hyderabad',
    title: 'Backend Systems Engineer - Core Mobility & Maps',
    description: 'Develop high-throughput Go services handling geospatial partitioning (H3), driver-rider matching, and dynamic surge pricing.',
    responsibilities: [
      'Write scalable Go and Java microservices deployed across worldwide clusters.',
      'Optimize Kafka streaming events and Redis caching layers.'
    ],
    requirements: [
      'B.Tech in CSE/IT with 7.5+ CGPA and experience in concurrent programming.'
    ],
    domain: 'Backend Development',
    location: 'Bengaluru',
    employmentType: 'Full Time',
    salary: '₹34 - ₹44 LPA',
    eligibility: 'B.Tech CSE/IT with minimum 7.5 CGPA',
    minimumCgpa: 7.5,
    requiredSkills: ['Go', 'Kafka', 'PostgreSQL', 'Redis', 'Microservices', 'gRPC'],
    applicationDeadline: '2026-10-12T23:59:59Z',
    status: 'Active',
    vacancies: 6,
    applicantsCount: 71,
    hasApplied: false,
    createdAt: '2026-09-08T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z'
  },
  {
    id: 'j-08',
    companyId: 'c-08',
    companyName: 'NVIDIA',
    companyLogo: 'https://images.unsplash.com/photo-1618761714958-0efedcb7ec80?w=128&auto=format&fit=crop&q=80',
    companyLocation: 'Bengaluru, Pune',
    title: 'CUDA Systems & Deep Learning Optimization Engineer',
    description: 'Optimize AI acceleration runtimes, TensorRT kernels, and LLM inference libraries directly on NVIDIA Blackwell and Hopper GPU architectures.',
    responsibilities: [
      'Write highly optimized CUDA kernels and multi-threaded C++ runtimes.',
      'Profile GPU memory bandwidth, SM occupancy, and tensor core utilization.'
    ],
    requirements: [
      'B.Tech/M.Tech with 8.0+ CGPA in CSE/ECE, strong interest in GPU architecture.'
    ],
    domain: 'AI / Machine Learning',
    location: 'Bengaluru',
    employmentType: 'Full Time',
    salary: '₹30 - ₹45 LPA',
    eligibility: 'B.Tech/M.Tech with 8.0+ CGPA and C++/Parallel programming',
    minimumCgpa: 8.0,
    requiredSkills: ['CUDA', 'C++', 'Parallel Programming', 'PyTorch', 'GPU Architecture'],
    applicationDeadline: '2026-10-24T23:59:59Z',
    status: 'Active',
    vacancies: 4,
    applicantsCount: 29,
    hasApplied: false,
    createdAt: '2026-09-22T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z'
  },
  {
    id: 'j-09',
    companyId: 'c-09',
    companyName: 'Razorpay',
    companyLogo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80',
    companyLocation: 'Bengaluru',
    title: 'Payment Gateway Infrastructure Engineer',
    description: 'Architect robust payment reconciliation pipelines, idempotency shields, and instant refund systems processing over 100M API calls daily.',
    responsibilities: [
      'Build resilient payment flow microservices with Node.js and Go.',
      'Maintain 99.999% uptime for digital checkout pages.'
    ],
    requirements: [
      'B.Tech with 6.8+ CGPA and strong API architecture understanding.'
    ],
    domain: 'FinTech',
    location: 'Bengaluru',
    employmentType: 'Full Time',
    salary: '₹22 - ₹28 LPA',
    eligibility: 'B.Tech in any branch with minimum 6.8 CGPA',
    minimumCgpa: 6.8,
    requiredSkills: ['Node.js', 'Go', 'PostgreSQL', 'Redis', 'System Architecture'],
    applicationDeadline: '2026-10-19T23:59:59Z',
    status: 'Active',
    vacancies: 7,
    applicantsCount: 54,
    hasApplied: false,
    createdAt: '2026-09-14T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z'
  },
  {
    id: 'j-10',
    companyId: 'c-10',
    companyName: 'Cisco Systems',
    companyLogo: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=128&auto=format&fit=crop&q=80',
    companyLocation: 'Bengaluru, Chennai',
    title: 'Network Security & Cloud Orchestration Engineer',
    description: 'Develop next-gen zero-trust firewalls, SD-WAN controllers, and cloud policy security suites.',
    responsibilities: [
      'Implement networking protocol stacks and Linux socket communication.',
      'Automate network telemetry and intrusion detection systems.'
    ],
    requirements: [
      'B.Tech in CSE/ECE/IT with 7.0+ CGPA and strong TCP/IP networking foundation.'
    ],
    domain: 'Cybersecurity',
    location: 'Bengaluru',
    employmentType: 'Full Time',
    salary: '₹16 - ₹22 LPA',
    eligibility: 'B.Tech CSE/ECE/IT with minimum 7.0 CGPA',
    minimumCgpa: 7.0,
    requiredSkills: ['Python', 'C', 'Networking Protocols', 'TCP/IP', 'Linux Kernel', 'Wireshark'],
    applicationDeadline: '2026-10-30T23:59:59Z',
    status: 'Active',
    vacancies: 10,
    applicantsCount: 68,
    hasApplied: false,
    createdAt: '2026-09-25T00:00:00Z',
    updatedAt: '2026-09-30T00:00:00Z'
  },
  {
    id: 'j-11',
    companyId: 'c-16',
    companyName: 'Stripe',
    companyLogo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&auto=format&fit=crop&q=80',
    companyLocation: 'Remote / Bengaluru',
    title: 'Full Stack Engineer - Global Invoicing & Billing',
    description: 'Build elegant, high-converting merchant checkout flows and robust multi-currency billing engines.',
    responsibilities: [
      'Design clean developer-friendly APIs and reactive web interfaces.',
      'Ensure strict financial idempotency and zero data loss.'
    ],
    requirements: [
      'B.Tech CSE/IT with 7.5+ CGPA and top-tier product sense.'
    ],
    domain: 'Full Stack',
    location: 'Remote / Bengaluru',
    employmentType: 'Full Time',
    salary: '₹35 - ₹48 LPA',
    eligibility: 'B.Tech CSE/IT with minimum 7.5 CGPA',
    minimumCgpa: 7.5,
    requiredSkills: ['TypeScript', 'React', 'Ruby', 'Java', 'PostgreSQL', 'API Design'],
    applicationDeadline: '2026-10-21T23:59:59Z',
    status: 'Active',
    vacancies: 3,
    applicantsCount: 42,
    hasApplied: false,
    createdAt: '2026-09-17T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z'
  },
  {
    id: 'j-12',
    companyId: 'c-17',
    companyName: 'TCS Digital',
    companyLogo: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=128&auto=format&fit=crop&q=80',
    companyLocation: 'Pan India',
    title: 'Digital Systems Engineer - Cloud & Enterprise AI',
    description: 'Lead digital modernization, microservices architecture, and cloud analytics for Fortune 500 enterprises.',
    responsibilities: [
      'Develop enterprise web applications and REST microservices.',
      'Participate in cloud migration and DevOps CI/CD automation.'
    ],
    requirements: [
      'B.Tech all branches with 6.5+ CGPA and zero active backlogs.'
    ],
    domain: 'Software Development',
    location: 'Pan India',
    employmentType: 'Full Time',
    salary: '₹7.5 - ₹9.2 LPA',
    eligibility: 'B.Tech all branches with minimum 6.5 CGPA',
    minimumCgpa: 6.5,
    requiredSkills: ['Java', 'Python', 'SQL', 'HTML/CSS/JS', 'Cloud Basics'],
    applicationDeadline: '2026-11-15T23:59:59Z',
    status: 'Active',
    vacancies: 40,
    applicantsCount: 180,
    hasApplied: false,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-26T00:00:00Z'
  }
];

// 25 ALUMNI MENTORS
export const MOCK_ALUMNI: Alumni[] = [
  {
    id: 'a-01',
    userId: 'u-alumni-01',
    fullName: 'Priya Nair',
    email: 'priya.nair@google.com',
    profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    graduationYear: 2022,
    department: 'Computer Science & Engineering',
    company: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&auto=format&fit=crop&q=80',
    designation: 'Senior Software Engineer (L5)',
    experienceYears: 4.5,
    skills: ['C++', 'Distributed Systems', 'Go', 'System Design', 'Algorithms'],
    preferredDomains: ['Software Development', 'Backend Development', 'System Design'],
    bio: 'Passionate about distributed storage and large-scale graph databases. Mentored 40+ college juniors into Tier-1 product companies.',
    linkedinUrl: 'https://linkedin.com/in/priya-nair-demo',
    availableForMentoring: true,
    menteesCount: 28,
    rating: 4.9,
    createdAt: '2024-06-15T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z'
  },
  {
    id: 'a-02',
    userId: 'u-alumni-02',
    fullName: 'Karthik Raman',
    email: 'karthik.raman@microsoft.com',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    graduationYear: 2021,
    department: 'Information Technology',
    company: 'Microsoft',
    companyLogo: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=128&auto=format&fit=crop&q=80',
    designation: 'Software Engineer II - Azure Copilot',
    experienceYears: 5.0,
    skills: ['C#', 'Azure', 'Kubernetes', 'LLM RAG', 'Microservices'],
    preferredDomains: ['Cloud Computing', 'AI / Machine Learning', 'Software Development'],
    bio: 'Building generative AI capabilities into Azure DevOps. Happy to review resumes and conduct mock technical interviews.',
    linkedinUrl: 'https://linkedin.com/in/karthik-raman-demo',
    availableForMentoring: true,
    menteesCount: 22,
    rating: 4.8,
    createdAt: '2024-07-01T00:00:00Z',
    updatedAt: '2026-09-25T00:00:00Z'
  },
  {
    id: 'a-03',
    userId: 'u-alumni-03',
    fullName: 'Ananya Deshmukh',
    email: 'ananya.d@amazon.com',
    profilePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    graduationYear: 2023,
    department: 'Computer Science & Engineering',
    company: 'Amazon',
    companyLogo: 'https://images.unsplash.com/photo-1523474253246-720961237a9a?w=128&auto=format&fit=crop&q=80',
    designation: 'SDE 2 - AWS Serverless',
    experienceYears: 3.2,
    skills: ['Java', 'AWS Lambda', 'DynamoDB', 'EventBridge', 'DSA'],
    preferredDomains: ['Full Stack', 'Cloud Computing', 'Backend Development'],
    bio: 'Specialist in serverless event-driven architectures. Can help you crack Amazon Leadership Principles and bar-raiser rounds.',
    linkedinUrl: 'https://linkedin.com/in/ananya-deshmukh-demo',
    availableForMentoring: true,
    menteesCount: 35,
    rating: 5.0,
    createdAt: '2024-08-10T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z'
  },
  {
    id: 'a-04',
    userId: 'u-alumni-04',
    fullName: 'Rohan Varma',
    email: 'rohan.v@atlassian.com',
    profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    graduationYear: 2022,
    department: 'Computer Science & Engineering',
    company: 'Atlassian',
    companyLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=80',
    designation: 'Frontend Specialist & Team Lead',
    experienceYears: 4.0,
    skills: ['TypeScript', 'React', 'GraphQL', 'Next.js', 'Web Performance'],
    preferredDomains: ['Frontend Development', 'Web Development'],
    bio: 'Obsessed with fast web apps, micro-frontends, and accessible UI engineering. Available for portfolio and code reviews.',
    linkedinUrl: 'https://linkedin.com/in/rohan-varma-demo',
    availableForMentoring: true,
    menteesCount: 19,
    rating: 4.9,
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2026-09-26T00:00:00Z'
  },
  {
    id: 'a-05',
    userId: 'u-alumni-05',
    fullName: 'Siddharth Roy',
    email: 'siddharth.roy@goldmansachs.com',
    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    graduationYear: 2020,
    department: 'Electronics & Communication',
    company: 'Goldman Sachs',
    companyLogo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&auto=format&fit=crop&q=80',
    designation: 'Vice President - Core Engineering',
    experienceYears: 6.0,
    skills: ['Java', 'C++', 'Low Latency Systems', 'Algorithmic Trading', 'SQL'],
    preferredDomains: ['FinTech', 'Software Development', 'System Design'],
    bio: 'Alumnus who transitioned from ECE to Goldman Sachs Quant Engineering. Special focus on quantitative aptitude and graph algorithms.',
    linkedinUrl: 'https://linkedin.com/in/siddharth-roy-demo',
    availableForMentoring: false,
    menteesCount: 45,
    rating: 4.8,
    createdAt: '2024-05-10T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z'
  },
  {
    id: 'a-06',
    userId: 'u-alumni-06',
    fullName: 'Neha Kulkarni',
    email: 'neha.kulkarni@adobe.com',
    profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    graduationYear: 2023,
    department: 'Artificial Intelligence & Data Science',
    company: 'Adobe',
    companyLogo: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=128&auto=format&fit=crop&q=80',
    designation: 'Machine Learning Engineer - Creative AI',
    experienceYears: 3.0,
    skills: ['Python', 'PyTorch', 'Diffusion Models', 'OpenCV', 'MLOps'],
    preferredDomains: ['AI / Machine Learning', 'Data Science'],
    bio: 'Working on next-generation diffusion pipelines. Let’s connect if you want guidance on ML research papers and interview prep.',
    linkedinUrl: 'https://linkedin.com/in/neha-kulkarni-demo',
    availableForMentoring: true,
    menteesCount: 16,
    rating: 5.0,
    createdAt: '2024-10-05T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z'
  },
  {
    id: 'a-07',
    userId: 'u-alumni-07',
    fullName: 'Tanmay Saxena',
    email: 'tanmay.s@uber.com',
    profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    graduationYear: 2021,
    department: 'Computer Science & Engineering',
    company: 'Uber',
    companyLogo: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=128&auto=format&fit=crop&q=80',
    designation: 'Staff SDE - Marketplace Logistics',
    experienceYears: 5.5,
    skills: ['Go', 'Kafka', 'Cassandra', 'Geospatial H3', 'Microservices'],
    preferredDomains: ['Backend Development', 'System Design', 'Software Development'],
    bio: 'Designing dispatch and dispatch resilience for millions of daily rides. Happy to mentor aspiring distributed systems engineers.',
    linkedinUrl: 'https://linkedin.com/in/tanmay-saxena-demo',
    availableForMentoring: true,
    menteesCount: 30,
    rating: 4.9,
    createdAt: '2024-04-18T00:00:00Z',
    updatedAt: '2026-09-27T00:00:00Z'
  },
  {
    id: 'a-08',
    userId: 'u-alumni-08',
    fullName: 'Divya Sridhar',
    email: 'divya.sridhar@nvidia.com',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    graduationYear: 2022,
    department: 'Electronics & Communication',
    company: 'NVIDIA',
    companyLogo: 'https://images.unsplash.com/photo-1618761714958-0efedcb7ec80?w=128&auto=format&fit=crop&q=80',
    designation: 'GPU Kernel & Compiler Engineer',
    experienceYears: 4.0,
    skills: ['CUDA', 'C++', 'LLVM', 'Computer Architecture', 'Deep Learning Runtimes'],
    preferredDomains: ['AI / Machine Learning', 'Software Development'],
    bio: 'Low-level optimization enthusiast. If you love memory hierarchies, CUDA threads, and GPU internals, reach out!',
    linkedinUrl: 'https://linkedin.com/in/divya-sridhar-demo',
    availableForMentoring: true,
    menteesCount: 14,
    rating: 4.9,
    createdAt: '2024-11-01T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z'
  }
];

// 100 REALISTIC STUDENTS DATA GENERATION
const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering'
];

const DOMAINS = [
  'Software Development',
  'Cloud Computing',
  'AI / Machine Learning',
  'Full Stack',
  'Frontend Development',
  'Backend Development',
  'FinTech',
  'Cybersecurity',
  'Data Science'
];

const SKILL_POOLS = {
  'Software Development': ['C++', 'Java', 'DSA', 'Algorithms', 'SQL', 'Git', 'OOP'],
  'Cloud Computing': ['AWS', 'Docker', 'Kubernetes', 'Linux', 'Terraform', 'Python'],
  'AI / Machine Learning': ['Python', 'PyTorch', 'TensorFlow', 'Scikit-Learn', 'Pandas', 'NumPy', 'Computer Vision'],
  'Full Stack': ['TypeScript', 'Angular', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'REST APIs'],
  'Frontend Development': ['JavaScript', 'React', 'TypeScript', 'HTML5', 'CSS3', 'Next.js'],
  'Backend Development': ['Go', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Kafka'],
  'FinTech': ['Java', 'C++', 'SQL', 'Financial Math', 'Algorithmic Problem Solving'],
  'Cybersecurity': ['Ethical Hacking', 'Wireshark', 'Linux', 'Cryptography', 'Python', 'Networking'],
  'Data Science': ['Python', 'SQL', 'Tableau', 'Pandas', 'Statistical Modeling', 'PowerBI']
};

const FIRST_NAMES = ['Rahul', 'Ananya', 'Sneha', 'Aditya', 'Rohan', 'Pooja', 'Vikas', 'Meera', 'Kunal', 'Ishaan', 'Shreya', 'Arjun', 'Tanvi', 'Manish', 'Kavya', 'Deepak', 'Nisha', 'Aakash', 'Varun', 'Rhea'];
const LAST_NAMES = ['Sharma', 'Verma', 'Patel', 'Reddy', 'Deshmukh', 'Nair', 'Iyer', 'Gupta', 'Singh', 'Chopra', 'Banerjee', 'Rao', 'Kulkarni', 'Joshi', 'Mehta', 'Bhat', 'Pandey', 'Saxena', 'Mukherjee', 'Menon'];

export const MOCK_STUDENTS: Student[] = [
  {
    id: 's-01',
    userId: 'u-student-01',
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@careernexus.edu',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+91 98765 43210',
    department: 'Computer Science & Engineering',
    graduationYear: 2027,
    rollNumber: '23CS101',
    cgpa: 9.24,
    tenthPercentage: 96.5,
    twelfthPercentage: 94.8,
    skills: ['C++', 'Java', 'Data Structures', 'Algorithms', 'TypeScript', 'Angular', 'PostgreSQL', 'Docker'],
    preferredDomain: 'Software Development',
    bio: 'Passionate full-stack & algorithmic developer with 600+ LeetCode problems solved. President of Coding Club & open-source contributor.',
    githubUrl: 'https://github.com/rahul-sharma-dev',
    linkedinUrl: 'https://linkedin.com/in/rahul-sharma-demo',
    portfolioUrl: 'https://rahulsharma.dev',
    resumeUrl: 'https://careernexus.edu/resumes/23CS101_Rahul_Sharma.pdf',
    resumeFileName: 'Rahul_Sharma_Resume_2026.pdf',
    placementStatus: 'In Progress',
    profileCompletion: 92,
    projects: [
      {
        id: 'p-01',
        title: 'Distributed In-Memory Key-Value Store',
        description: 'Implemented a Raft consensus replicated key-value storage engine in Go with snapshotting and gRPC endpoints.',
        technologies: ['Go', 'Raft Consensus', 'gRPC', 'Protobuf'],
        githubUrl: 'https://github.com/rahul-sharma-dev/raft-kv-store',
        liveUrl: 'https://raft-demo.dev'
      },
      {
        id: 'p-02',
        title: 'CareerNexus Career & Drive Platform',
        description: 'Built a multi-tenant university placement platform with real-time job tracking, interview scheduling, and drive resource management.',
        technologies: ['Angular', 'TypeScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL'],
        githubUrl: 'https://github.com/rahul-sharma-dev/careernexus-platform',
        liveUrl: 'https://careernexus.vercel.app'
      },
      {
        id: 'p-03',
        title: 'AlgoVisualizer — Interactive Algorithm Sandbox',
        description: 'Interactive graph and tree algorithm visualizer with step-by-step state playback used by 5,000+ university peers.',
        technologies: ['TypeScript', 'Canvas API', 'RxJS', 'Tailwind'],
        githubUrl: 'https://github.com/rahul-sharma-dev/algo-visualizer',
        liveUrl: 'https://algoviz.dev'
      }
    ],
    certifications: [
      {
        id: 'cert-01',
        title: 'AWS Certified Solutions Architect – Associate',
        issuer: 'Amazon Web Services',
        issueDate: 'Aug 2025',
        credentialUrl: 'https://aws.amazon.com/verify'
      },
      {
        id: 'cert-02',
        title: 'Algorithmic Toolbox & Data Structures Specialization',
        issuer: 'Coursera & UC San Diego',
        issueDate: 'Jan 2025',
        credentialUrl: 'https://coursera.org/verify'
      }
    ],
    createdAt: '2025-08-01T10:00:00Z',
    updatedAt: '2026-09-30T15:30:00Z'
  }
];

const VERIFIED_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=150&auto=format&fit=crop&q=80'
];

// Generate 99 more students programmatically to reach 100 realistic records
for (let i = 2; i <= 100; i++) {
  const fName = FIRST_NAMES[(i * 3 + 7) % FIRST_NAMES.length];
  const lName = LAST_NAMES[(i * 5 + 11) % LAST_NAMES.length];
  const dept = DEPARTMENTS[i % DEPARTMENTS.length];
  const domain = DOMAINS[i % DOMAINS.length];
  const pool = SKILL_POOLS[domain as keyof typeof SKILL_POOLS] || ['Java', 'SQL', 'Git'];
  const cgpa = Number((6.6 + ((i * 13) % 33) * 0.1).toFixed(2));
  const tenth = Number((80 + ((i * 7) % 19)).toFixed(1));
  const twelfth = Number((78 + ((i * 9) % 20)).toFixed(1));
  
  let status: 'Not Placed' | 'In Progress' | 'Selected' | 'Offer Accepted' = 'Not Placed';
  let placedCompany: string | undefined = undefined;
  let placedPackage: string | undefined = undefined;

  if (i % 4 === 0) {
    status = 'Selected';
    placedCompany = MOCK_COMPANIES[(i * 3) % MOCK_COMPANIES.length].name;
    placedPackage = `${12 + (i % 24)} LPA`;
  } else if (i % 3 === 0) {
    status = 'In Progress';
  }

  MOCK_STUDENTS.push({
    id: `s-${i.toString().padStart(2, '0')}`,
    userId: `u-student-${i.toString().padStart(2, '0')}`,
    fullName: `${fName} ${lName}`,
    email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@careernexus.edu`,
    profilePhoto: VERIFIED_AVATARS[i % VERIFIED_AVATARS.length],
    phone: `+91 98${(10000000 + i * 87654).toString().substring(0, 8)}`,
    department: dept,
    graduationYear: 2027,
    rollNumber: `23${dept.split(' ')[0].substring(0, 2).toUpperCase()}${100 + i}`,
    cgpa: cgpa > 9.9 ? 9.85 : cgpa,
    tenthPercentage: tenth,
    twelfthPercentage: twelfth,
    skills: pool.slice(0, 4 + (i % 3)),
    preferredDomain: domain,
    bio: `Enthusiastic ${dept} undergrad specializing in ${domain}. Keen on solving impactful real-world engineering challenges.`,
    githubUrl: `https://github.com/${fName.toLowerCase()}-${lName.toLowerCase()}`,
    linkedinUrl: `https://linkedin.com/in/${fName.toLowerCase()}-${lName.toLowerCase()}`,
    portfolioUrl: `https://${fName.toLowerCase()}${lName.toLowerCase()}.dev`,
    resumeUrl: `https://careernexus.edu/resumes/23${100 + i}_resume.pdf`,
    resumeFileName: `${fName}_${lName}_Resume.pdf`,
    placementStatus: status,
    placedCompany: placedCompany,
    placedPackage: placedPackage,
    profileCompletion: 70 + (i % 29),
    projects: [
      {
        id: `p-${i}-1`,
        title: `${domain} Scalable Engine`,
        description: `Architected a high-performance system for ${domain} with automated testing and benchmark telemetry.`,
        technologies: pool.slice(0, 3)
      }
    ],
    certifications: [
      {
        id: `c-${i}-1`,
        title: `Professional ${domain} Certification`,
        issuer: 'Google Cloud & Coursera',
        issueDate: '2025'
      }
    ],
    createdAt: '2025-08-01T10:00:00Z',
    updatedAt: '2026-09-28T12:00:00Z'
  });
}

// REALISTIC APPLICATIONS WITH PIPELINE HISTORY
export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'app-01',
    studentId: 's-01',
    studentName: 'Rahul Sharma',
    studentRoll: '23CS101',
    studentDepartment: 'Computer Science & Engineering',
    studentCgpa: 9.24,
    studentEmail: 'rahul.sharma@careernexus.edu',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    studentResumeUrl: 'https://careernexus.edu/resumes/23CS101_Rahul_Sharma.pdf',
    jobId: 'j-01',
    jobTitle: 'Software Development Engineer - Intern + FTE',
    companyId: 'c-01',
    companyName: 'Google',
    companyLogo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&auto=format&fit=crop&q=80',
    salary: '₹36 - ₹45 LPA',
    status: 'Technical Interview',
    notes: 'Technical Interview Round 2 scheduled via Google Meet. Topics: Advanced Dynamic Programming & Distributed Caching.',
    appliedAt: '2026-09-16T10:30:00Z',
    updatedAt: '2026-09-29T14:00:00Z',
    timeline: [
      {
        status: 'Applied',
        date: '16 Sep 2026',
        notes: 'Application submitted successfully with verified 9.24 CGPA.'
      },
      {
        status: 'Shortlisted',
        date: '20 Sep 2026',
        notes: 'Profile screened and shortlisted by Google University Recruitment Team.'
      },
      {
        status: 'Aptitude',
        date: '24 Sep 2026',
        notes: 'Cleared Online Assessment with 100% test case pass on HackerEarth.'
      },
      {
        status: 'Technical Interview',
        date: '29 Sep 2026',
        notes: 'Round 1 Cleared: Graph algorithms and LRU cache design. Round 2 in progress.',
        locationOrLink: 'https://meet.google.com/xyz-demo'
      }
    ]
  },
  {
    id: 'app-02',
    studentId: 's-01',
    studentName: 'Rahul Sharma',
    studentRoll: '23CS101',
    studentDepartment: 'Computer Science & Engineering',
    studentCgpa: 9.24,
    studentEmail: 'rahul.sharma@careernexus.edu',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    studentResumeUrl: 'https://careernexus.edu/resumes/23CS101_Rahul_Sharma.pdf',
    jobId: 'j-02',
    jobTitle: 'Cloud Solutions Engineer - Azure Systems',
    companyId: 'c-02',
    companyName: 'Microsoft',
    companyLogo: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=128&auto=format&fit=crop&q=80',
    salary: '₹28 - ₹34 LPA',
    status: 'Shortlisted',
    notes: 'Shortlisted for online coding round scheduled on 5th October.',
    appliedAt: '2026-09-19T11:00:00Z',
    updatedAt: '2026-09-26T09:00:00Z',
    timeline: [
      {
        status: 'Applied',
        date: '19 Sep 2026',
        notes: 'Resume and portfolio verified.'
      },
      {
        status: 'Shortlisted',
        date: '26 Sep 2026',
        notes: 'Invited for Microsoft Codility Assessment.'
      }
    ]
  }
];

// 13 RESOURCE FOLDERS
export const MOCK_FOLDERS: ResourceFolder[] = [
  {
    id: 'f-01',
    name: 'Data Structures & Algorithms (DSA)',
    category: 'DSA',
    isGlobal: true,
    filesCount: 14,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z'
  },
  {
    id: 'f-02',
    name: 'Quantitative & Logical Aptitude',
    category: 'Aptitude',
    isGlobal: true,
    filesCount: 10,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-25T00:00:00Z'
  },
  {
    id: 'f-03',
    name: 'Database Management Systems & SQL',
    category: 'DBMS',
    isGlobal: true,
    filesCount: 9,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-27T00:00:00Z'
  },
  {
    id: 'f-04',
    name: 'Operating Systems (OS)',
    category: 'Operating Systems',
    isGlobal: true,
    filesCount: 8,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z'
  },
  {
    id: 'f-05',
    name: 'Computer Networks (CN)',
    category: 'Computer Networks',
    isGlobal: true,
    filesCount: 8,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-22T00:00:00Z'
  },
  {
    id: 'f-06',
    name: 'System Design (HLD & LLD)',
    category: 'System Design',
    isGlobal: true,
    filesCount: 11,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z'
  },
  {
    id: 'f-07',
    name: 'Java & Spring Boot Mastery',
    category: 'Java',
    isGlobal: true,
    filesCount: 9,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-24T00:00:00Z'
  },
  {
    id: 'f-08',
    name: 'Python & Machine Learning Prep',
    category: 'AI/ML',
    isGlobal: true,
    filesCount: 8,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-26T00:00:00Z'
  },
  {
    id: 'f-09',
    name: 'Full Stack & Web Development',
    category: 'Web Development',
    isGlobal: true,
    filesCount: 9,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z'
  },
  {
    id: 'f-10',
    name: 'Cloud & DevOps (AWS / Docker / K8s)',
    category: 'Cloud & DevOps',
    isGlobal: true,
    filesCount: 7,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-25T00:00:00Z'
  },
  {
    id: 'f-11',
    name: 'HR & Behavioral Interview Prep',
    category: 'HR & Soft Skills',
    isGlobal: true,
    filesCount: 8,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z'
  },
  {
    id: 'f-12',
    name: 'Top Tech Company Specific Kits',
    category: 'Company Prep',
    isGlobal: true,
    filesCount: 12,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-30T00:00:00Z'
  },
  {
    id: 'f-13',
    name: 'Resume Templates & Action Verbs Guide',
    category: 'Resume Prep',
    isGlobal: true,
    filesCount: 6,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2026-09-27T00:00:00Z'
  }
];

// 100+ CURATED RESOURCE FILES (Distributed across 13 Folders)
export const MOCK_FILES: ResourceFile[] = [
  // DSA Folder (f-01)
  {
    id: 'file-01',
    folderId: 'f-01',
    name: 'Complete DSA Roadmap & LeetCode 150 Sheet.pdf',
    category: 'DSA',
    fileUrl: 'https://careernexus.edu/resources/dsa-roadmap.pdf',
    storageProvider: 'supabase',
    mimeType: 'application/pdf',
    size: 2457600,
    sizeFormatted: '2.4 MB',
    description: 'Comprehensive topic-wise DSA breakdown from Arrays to Dynamic Programming and Segment Trees.',
    uploadedBy: 'u-admin-01',
    uploaderName: 'Placement Cell',
    downloadsCount: 384,
    isBookmarked: true,
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z'
  },
  {
    id: 'file-02',
    folderId: 'f-01',
    name: 'Dynamic Programming — From Recursion to Tabulation.pdf',
    category: 'DSA',
    fileUrl: 'https://careernexus.edu/resources/dp-mastery.pdf',
    storageProvider: 'supabase',
    mimeType: 'application/pdf',
    size: 3145728,
    sizeFormatted: '3.0 MB',
    description: 'Master 1D, 2D, Knapsack, and Tree DP patterns with step-by-step visual proofs.',
    uploadedBy: 'u-admin-01',
    uploaderName: 'Placement Cell',
    downloadsCount: 420,
    isBookmarked: true,
    createdAt: '2026-08-12T00:00:00Z',
    updatedAt: '2026-09-25T00:00:00Z'
  },
  {
    id: 'file-03',
    folderId: 'f-01',
    name: 'Graph Algorithms & Shortest Path Cheat Sheet.pdf',
    category: 'DSA',
    fileUrl: 'https://careernexus.edu/resources/graphs-cheatsheet.pdf',
    storageProvider: 'supabase',
    mimeType: 'application/pdf',
    size: 1887436,
    sizeFormatted: '1.8 MB',
    description: 'BFS, DFS, Dijkstra, Bellman-Ford, Floyd-Warshall, and Disjoint Set Union implementations.',
    uploadedBy: 'u-alumni-01',
    uploaderName: 'Priya Nair (Google)',
    downloadsCount: 295,
    createdAt: '2026-08-15T00:00:00Z',
    updatedAt: '2026-09-22T00:00:00Z'
  },
  {
    id: 'file-04',
    folderId: 'f-01',
    name: 'Binary Trees & BST Top 50 Interview Questions.pdf',
    category: 'DSA',
    fileUrl: 'https://careernexus.edu/resources/trees-50.pdf',
    storageProvider: 'supabase',
    mimeType: 'application/pdf',
    size: 2100000,
    sizeFormatted: '2.0 MB',
    description: 'Traversals, LCA, Morris Traversal, and Balanced BST rotations.',
    uploadedBy: 'u-admin-01',
    uploaderName: 'Placement Cell',
    downloadsCount: 310,
    createdAt: '2026-08-18T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z'
  },
  // Aptitude Folder (f-02)
  {
    id: 'file-05',
    folderId: 'f-02',
    name: 'Quantitative Aptitude Formulas & Shortcut Tricks.pdf',
    category: 'Aptitude',
    fileUrl: 'https://careernexus.edu/resources/quant-tricks.pdf',
    storageProvider: 'supabase',
    mimeType: 'application/pdf',
    size: 1650000,
    sizeFormatted: '1.6 MB',
    description: 'Time & Work, Speed Distance, Permutations, Probability, and Percentages with speed formulas.',
    uploadedBy: 'u-admin-01',
    uploaderName: 'Placement Cell',
    downloadsCount: 512,
    isBookmarked: true,
    createdAt: '2026-08-05T00:00:00Z',
    updatedAt: '2026-09-21T00:00:00Z'
  },
  {
    id: 'file-06',
    folderId: 'f-02',
    name: 'Logical Reasoning & Data Interpretation Practice Sets.pdf',
    category: 'Aptitude',
    fileUrl: 'https://careernexus.edu/resources/logical-reasoning.pdf',
    storageProvider: 'supabase',
    mimeType: 'application/pdf',
    size: 2800000,
    sizeFormatted: '2.7 MB',
    description: 'Syllogisms, Blood Relations, Seating Arrangements, and Chart Interpretation.',
    uploadedBy: 'u-admin-01',
    uploaderName: 'Placement Cell',
    downloadsCount: 430,
    createdAt: '2026-08-08T00:00:00Z',
    updatedAt: '2026-09-18T00:00:00Z'
  },
  // DBMS & SQL (f-03)
  {
    id: 'file-07',
    folderId: 'f-03',
    name: 'Top 75 SQL Interview Queries & Window Functions.pdf',
    category: 'DBMS',
    fileUrl: 'https://careernexus.edu/resources/sql-75.pdf',
    storageProvider: 'supabase',
    mimeType: 'application/pdf',
    size: 1950000,
    sizeFormatted: '1.9 MB',
    description: 'Complex JOINs, CTEs, RANK(), DENSE_RANK(), Partition By, and ACID transaction isolation.',
    uploadedBy: 'u-admin-01',
    uploaderName: 'Placement Cell',
    downloadsCount: 620,
    isBookmarked: true,
    createdAt: '2026-08-20T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z'
  },
  {
    id: 'file-08',
    folderId: 'f-03',
    name: 'Database Indexing, B-Trees & Normalization Handbook.pdf',
    category: 'DBMS',
    fileUrl: 'https://careernexus.edu/resources/dbms-indexing.pdf',
    storageProvider: 'supabase',
    mimeType: 'application/pdf',
    size: 2300000,
    sizeFormatted: '2.2 MB',
    description: 'B+ Tree indices, Clustered vs Non-Clustered indices, Query Execution Plans, and 1NF to BCNF.',
    uploadedBy: 'u-alumni-01',
    uploaderName: 'Priya Nair (Google)',
    downloadsCount: 380,
    createdAt: '2026-08-22T00:00:00Z',
    updatedAt: '2026-09-26T00:00:00Z'
  },
  // Operating Systems (f-04)
  {
    id: 'file-09',
    folderId: 'f-04',
    name: 'Operating Systems Core Concepts & Interview Q&A.pdf',
    category: 'Operating Systems',
    fileUrl: 'https://careernexus.edu/resources/os-interview.pdf',
    storageProvider: 'supabase',
    mimeType: 'application/pdf',
    size: 2700000,
    sizeFormatted: '2.6 MB',
    description: 'Process vs Thread, Semaphores, Deadlock Avoidance (Banker algorithm), Virtual Memory & Paging.',
    uploadedBy: 'u-admin-01',
    uploaderName: 'Placement Cell',
    downloadsCount: 490,
    createdAt: '2026-08-25T00:00:00Z',
    updatedAt: '2026-09-24T00:00:00Z'
  },
  // Computer Networks (f-05)
  {
    id: 'file-10',
    folderId: 'f-05',
    name: 'Computer Networks (OSI, TCP/IP, DNS, HTTPS) Guide.pdf',
    category: 'Computer Networks',
    fileUrl: 'https://careernexus.edu/resources/networks-guide.pdf',
    storageProvider: 'supabase',
    mimeType: 'application/pdf',
    size: 2150000,
    sizeFormatted: '2.1 MB',
    description: 'Three-way handshake, TLS 1.3 encryption flow, DNS resolution, Subnetting, and HTTP/3.',
    uploadedBy: 'u-admin-01',
    uploaderName: 'Placement Cell',
    downloadsCount: 460,
    createdAt: '2026-08-27T00:00:00Z',
    updatedAt: '2026-09-25T00:00:00Z'
  },
  // System Design (f-06)
  {
    id: 'file-11',
    folderId: 'f-06',
    name: 'System Design Interview Primer (HLD & LLD).pdf',
    category: 'System Design',
    fileUrl: 'https://careernexus.edu/resources/system-design-primer.pdf',
    storageProvider: 'supabase',
    mimeType: 'application/pdf',
    size: 4500000,
    sizeFormatted: '4.3 MB',
    description: 'Load balancers, Caching (Redis/Memcached), Message Queues (Kafka), CAP Theorem, and Rate Limiting.',
    uploadedBy: 'u-alumni-02',
    uploaderName: 'Karthik Raman (Microsoft)',
    downloadsCount: 570,
    isBookmarked: true,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z'
  },
  // Company Specific Kits (f-12)
  {
    id: 'file-12',
    folderId: 'f-12',
    name: 'Google Placement Preparation & Past Interview Questions.pdf',
    category: 'Company Prep',
    fileUrl: 'https://careernexus.edu/resources/google-kit.pdf',
    storageProvider: 'supabase',
    mimeType: 'application/pdf',
    size: 3800000,
    sizeFormatted: '3.6 MB',
    description: 'Google coding interview structure, Googleyness behavioral guidelines, and 40 past questions.',
    uploadedBy: 'u-alumni-01',
    uploaderName: 'Priya Nair (Google)',
    downloadsCount: 710,
    isBookmarked: true,
    createdAt: '2026-09-05T00:00:00Z',
    updatedAt: '2026-09-30T00:00:00Z'
  },
  {
    id: 'file-13',
    folderId: 'f-12',
    name: 'Amazon 16 Leadership Principles & Bar-Raiser Guide.pdf',
    category: 'Company Prep',
    fileUrl: 'https://careernexus.edu/resources/amazon-lp.pdf',
    storageProvider: 'supabase',
    mimeType: 'application/pdf',
    size: 2900000,
    sizeFormatted: '2.8 MB',
    description: 'STAR methodology answers aligned to Customer Obsession, Ownership, and Dive Deep principles.',
    uploadedBy: 'u-alumni-03',
    uploaderName: 'Ananya Deshmukh (Amazon)',
    downloadsCount: 680,
    createdAt: '2026-09-07T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z'
  },
  // Resume Prep (f-13)
  {
    id: 'file-14',
    folderId: 'f-13',
    name: 'Harvard Format LaTeX & ATS Resume Template.pdf',
    category: 'Resume Prep',
    fileUrl: 'https://careernexus.edu/resources/ats-resume-template.pdf',
    storageProvider: 'supabase',
    mimeType: 'application/pdf',
    size: 950000,
    sizeFormatted: '950 KB',
    description: 'Single-page ATS friendly resume format with action verbs and XYZ impact formula.',
    uploadedBy: 'u-admin-01',
    uploaderName: 'Placement Cell',
    downloadsCount: 890,
    isBookmarked: true,
    createdAt: '2026-09-02T00:00:00Z',
    updatedAt: '2026-09-29T00:00:00Z'
  }
];

// Automatically populate extra files for the folders to reach 100+ resource files!
const CATEGORY_NAMES = [
  'Data Structures & Algorithms',
  'Quantitative Aptitude',
  'SQL & Database Systems',
  'Operating Systems',
  'Computer Networks',
  'System Design & Microservices',
  'Java Spring Boot & Hibernate',
  'Python & Deep Learning',
  'Angular & Modern Frontend',
  'Cloud AWS & Docker Containers',
  'HR & Behavioral Questions',
  'Top Recruiter Interview Vault',
  'High-Impact Resume Builder'
];

for (let i = 15; i <= 105; i++) {
  const folderIdx = (i % MOCK_FOLDERS.length);
  const targetFolder = MOCK_FOLDERS[folderIdx];
  const cat = targetFolder.category;
  const sizeMb = ((1.2 + (i % 7) * 0.4)).toFixed(1);

  MOCK_FILES.push({
    id: `file-${i.toString().padStart(2, '0')}`,
    folderId: targetFolder.id,
    name: `${cat} — Module ${i - 14} Advanced Topic Notes & Solved Papers.pdf`,
    category: cat,
    fileUrl: `https://careernexus.edu/resources/${cat.toLowerCase()}-module-${i}.pdf`,
    storageProvider: i % 5 === 0 ? 'google_drive' : 'supabase',
    externalFileId: i % 5 === 0 ? `gdrive_file_id_${i}` : undefined,
    mimeType: 'application/pdf',
    size: Math.round(parseFloat(sizeMb) * 1024 * 1024),
    sizeFormatted: `${sizeMb} MB`,
    description: `Curated university study module and industry interview notes for ${cat}.`,
    uploadedBy: i % 2 === 0 ? 'u-admin-01' : 'u-alumni-01',
    uploaderName: i % 2 === 0 ? 'Placement Cell' : 'Priya Nair (Google)',
    downloadsCount: 150 + (i * 11) % 400,
    isBookmarked: i % 7 === 0,
    createdAt: '2026-08-20T00:00:00Z',
    updatedAt: '2026-09-28T00:00:00Z'
  });
}

// CONVERSATIONS & CHAT
export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-01',
    participantId: 'u-alumni-01',
    participantName: 'Priya Nair',
    participantAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    participantRole: 'alumni',
    participantHeadline: 'Senior SDE @ Google (Alumni 2022)',
    lastMessage: 'Great progress on the DP problem, Rahul! Let us do a mock interview this Saturday.',
    lastMessageTime: '10:45 AM',
    unreadCount: 1,
    isOnline: true
  },
  {
    id: 'conv-02',
    participantId: 'u-alumni-02',
    participantName: 'Karthik Raman',
    participantAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    participantRole: 'alumni',
    participantHeadline: 'SDE II @ Microsoft (Azure)',
    lastMessage: 'I reviewed your resume. The Raft KV store project looks solid.',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isOnline: false
  },
  {
    id: 'conv-03',
    participantId: 'u-admin-01',
    participantName: 'Dr. Anand Verma',
    participantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    participantRole: 'admin',
    participantHeadline: 'Dean, Placement & Corporate Relations',
    lastMessage: 'Make sure you attend the pre-placement talk by Google tomorrow at 4 PM in Auditorium 1.',
    lastMessageTime: '28 Sep',
    unreadCount: 0,
    isOnline: true
  }
];

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  'conv-01': [
    {
      id: 'm-01',
      senderId: 'u-student-01',
      senderName: 'Rahul Sharma',
      receiverId: 'u-alumni-01',
      conversationId: 'conv-01',
      messageText: 'Hi Priya maam! I saw your profile in the Alumni directory. I am currently preparing for the Google SDE drive.',
      content: 'Hi Priya maam! I saw your profile in the Alumni directory. I am currently preparing for the Google SDE drive.',
      messageType: 'text',
      isRead: true,
      createdAt: '2026-09-28T09:15:00Z'
    },
    {
      id: 'm-02',
      senderId: 'u-alumni-01',
      senderName: 'Priya Nair',
      receiverId: 'u-student-01',
      conversationId: 'conv-01',
      messageText: 'Hi Rahul! Glad to connect. I saw your Raft KV project and 9.24 CGPA — that is a very strong profile. Which topics are you focusing on currently?',
      content: 'Hi Rahul! Glad to connect. I saw your Raft KV project and 9.24 CGPA — that is a very strong profile. Which topics are you focusing on currently?',
      messageType: 'text',
      isRead: true,
      createdAt: '2026-09-28T09:30:00Z'
    },
    {
      id: 'm-03',
      senderId: 'u-student-01',
      senderName: 'Rahul Sharma',
      receiverId: 'u-alumni-01',
      conversationId: 'conv-01',
      messageText: 'I have covered Graphs, Dynamic Programming, and basic System Design. I wanted some tips on how to approach the Google 45-minute coding rounds.',
      content: 'I have covered Graphs, Dynamic Programming, and basic System Design. I wanted some tips on how to approach the Google 45-minute coding rounds.',
      messageType: 'text',
      isRead: true,
      createdAt: '2026-09-28T09:40:00Z'
    },
    {
      id: 'm-04',
      senderId: 'u-alumni-01',
      senderName: 'Priya Nair',
      receiverId: 'u-student-01',
      conversationId: 'conv-01',
      messageText: 'Great progress on the DP problem, Rahul! Let us do a mock interview this Saturday.',
      content: 'Great progress on the DP problem, Rahul! Let us do a mock interview this Saturday.',
      messageType: 'text',
      isRead: false,
      createdAt: '2026-09-28T10:45:00Z'
    }
  ]
};

// NOTIFICATIONS
export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-01',
    userId: 'u-student-01',
    type: 'application',
    title: 'Application Shortlisted!',
    message: 'Congratulations! Your application for SDE - Intern + FTE at Google has moved to Technical Interview Round 2.',
    link: '/student/applications',
    isRead: false,
    createdAt: '2026-09-29T14:00:00Z'
  },
  {
    id: 'n-02',
    userId: 'u-student-01',
    type: 'job',
    title: 'New High-Package Job Drive Posted',
    message: 'NVIDIA has announced on-campus recruitment for CUDA Deep Learning Software Engineer (₹30 - ₹45 LPA).',
    link: '/student/jobs/j-08',
    isRead: false,
    createdAt: '2026-09-28T11:00:00Z'
  },
  {
    id: 'n-03',
    userId: 'u-student-01',
    type: 'message',
    title: 'New Message from Priya Nair (Google)',
    message: 'Priya Nair: "Great progress on the DP problem, Rahul! Let us do a mock interview this Saturday."',
    link: '/student/messages',
    isRead: false,
    createdAt: '2026-09-28T10:45:00Z'
  },
  {
    id: 'n-04',
    userId: 'u-student-01',
    type: 'announcement',
    title: 'Resume Verification Deadline',
    message: 'All final year students must verify their 8th semester resume on CareerNexus before 10th October.',
    link: '/student/profile',
    isRead: true,
    createdAt: '2026-09-25T08:30:00Z'
  }
];
