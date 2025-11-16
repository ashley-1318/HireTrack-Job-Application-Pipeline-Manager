// Sample data for the application (UI only - no backend)

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
  requirements: string[];
  skills: string[];
  postedDate: string;
  status: 'open' | 'closed';
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  jobTitle: string;
  stage: string;
  appliedDate: string;
  resumeUrl?: string;
  coverNote: string;
  ats?: {
    evaluatedAt: Date;
    totalScore: number;
    decision: string;
    breakdown: {
      skill_match: number;
      experience_match: number;
      education_match: number;
      keyword_match: number;
    };
    explanation: string;
  };
  atsScore?: number;
  strengths?: string[];
  gaps?: string[];
  recommendedStage?: string;
  resumeText?: string;
  history?: Array<{ from: string; to: string; time: Date }>;
}

export interface Pipeline {
  id: string;
  name: string;
  stages: PipelineStage[];
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
}

export const sampleJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description: 'We are looking for an experienced Frontend Developer to join our dynamic team. You will be responsible for building and maintaining high-quality web applications using modern technologies.',
    requirements: [
      '5+ years of experience in frontend development',
      'Expert knowledge of React, TypeScript, and modern CSS',
      'Experience with state management (Redux, Zustand)',
      'Strong understanding of responsive design and accessibility',
      'Excellent communication and collaboration skills'
    ],
    skills: ['React', 'TypeScript', 'TailwindCSS', 'Redux', 'Next.js'],
    postedDate: '2024-01-15',
    status: 'open'
  },
  {
    id: '2',
    title: 'Product Designer',
    department: 'Design',
    location: 'San Francisco, CA',
    type: 'Full-time',
    description: 'Join our design team to create beautiful, user-centric products. You will work closely with product managers and engineers to deliver exceptional user experiences.',
    requirements: [
      '3+ years of product design experience',
      'Proficiency in Figma and design systems',
      'Strong portfolio showcasing UX/UI work',
      'Experience with user research and testing',
      'Ability to collaborate with cross-functional teams'
    ],
    skills: ['Figma', 'UI/UX Design', 'Prototyping', 'User Research', 'Design Systems'],
    postedDate: '2024-01-18',
    status: 'open'
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'New York, NY',
    type: 'Full-time',
    description: 'We need a skilled DevOps Engineer to help us scale our infrastructure and improve our deployment processes.',
    requirements: [
      '4+ years of DevOps experience',
      'Strong knowledge of AWS, Docker, and Kubernetes',
      'Experience with CI/CD pipelines',
      'Scripting skills (Python, Bash)',
      'Understanding of security best practices'
    ],
    skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'],
    postedDate: '2024-01-20',
    status: 'open'
  },
  {
    id: '4',
    title: 'Marketing Manager',
    department: 'Marketing',
    location: 'Remote',
    type: 'Full-time',
    description: 'Lead our marketing efforts to drive brand awareness and customer acquisition. You will develop and execute marketing strategies across multiple channels.',
    requirements: [
      '5+ years of marketing experience',
      'Proven track record in digital marketing',
      'Experience with SEO, SEM, and content marketing',
      'Strong analytical and project management skills',
      'Excellent written and verbal communication'
    ],
    skills: ['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics', 'Project Management'],
    postedDate: '2024-01-22',
    status: 'open'
  }
];

export const sampleCandidates: Candidate[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    jobId: '1',
    jobTitle: 'Senior Frontend Developer',
    stage: 'Interview',
    appliedDate: '2024-01-20',
    coverNote: 'I am excited about this opportunity to work with your team. With over 6 years of experience in React and TypeScript, I believe I would be a great fit for this role.'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1 (555) 234-5678',
    jobId: '1',
    jobTitle: 'Senior Frontend Developer',
    stage: 'Applied',
    appliedDate: '2024-01-22',
    coverNote: 'Passionate frontend developer with a strong background in building scalable web applications. Looking forward to contributing to your projects.'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    phone: '+1 (555) 345-6789',
    jobId: '2',
    jobTitle: 'Product Designer',
    stage: 'Offer',
    appliedDate: '2024-01-18',
    coverNote: 'Award-winning designer with a passion for creating intuitive user experiences. My portfolio demonstrates my ability to solve complex design challenges.'
  },
  {
    id: '4',
    name: 'David Park',
    email: 'david.park@email.com',
    phone: '+1 (555) 456-7890',
    jobId: '3',
    jobTitle: 'DevOps Engineer',
    stage: 'Technical Assessment',
    appliedDate: '2024-01-21',
    coverNote: 'DevOps engineer specializing in AWS and Kubernetes. I have successfully managed infrastructure for high-traffic applications.'
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    email: 'lisa.anderson@email.com',
    phone: '+1 (555) 567-8901',
    jobId: '2',
    jobTitle: 'Product Designer',
    stage: 'Interview',
    appliedDate: '2024-01-23',
    coverNote: 'Creative designer with 4 years of experience in product design. I love collaborating with teams to build products that users love.'
  },
  {
    id: '6',
    name: 'James Wilson',
    email: 'james.wilson@email.com',
    phone: '+1 (555) 678-9012',
    jobId: '4',
    jobTitle: 'Marketing Manager',
    stage: 'Applied',
    appliedDate: '2024-01-24',
    coverNote: 'Results-driven marketing professional with expertise in digital marketing and brand strategy. Excited to drive growth for your company.'
  }
];

export const defaultPipeline: Pipeline = {
  id: '1',
  name: 'Standard Hiring Pipeline',
  stages: [
    { id: '1', name: 'Applied', order: 1, color: 'bg-blue-100 text-blue-800' },
    { id: '2', name: 'Screening', order: 2, color: 'bg-purple-100 text-purple-800' },
    { id: '3', name: 'Interview', order: 3, color: 'bg-yellow-100 text-yellow-800' },
    { id: '4', name: 'Technical Assessment', order: 4, color: 'bg-orange-100 text-orange-800' },
    { id: '5', name: 'Offer', order: 5, color: 'bg-green-100 text-green-800' },
    { id: '6', name: 'Hired', order: 6, color: 'bg-emerald-100 text-emerald-800' },
    { id: '7', name: 'Rejected', order: 7, color: 'bg-red-100 text-red-800' }
  ]
};

export const dashboardStats = {
  totalJobs: 12,
  totalCandidates: 47,
  activePipelines: 3,
  recentActivity: [
    { id: '1', message: 'New application from Sarah Johnson for Senior Frontend Developer', time: '2 hours ago' },
    { id: '2', message: 'Interview scheduled with Emily Rodriguez', time: '5 hours ago' },
    { id: '3', message: 'Offer sent to David Park', time: '1 day ago' },
    { id: '4', message: 'New job posted: Marketing Manager', time: '2 days ago' }
  ]
};
