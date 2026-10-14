-- ==============================================================================
-- PLACEMENTCONNECT SEED DATA
-- High-fidelity realistic dataset for Departments, Programs, Batches, Companies, 
-- Jobs, Folders, Students, and Alumni
-- ==============================================================================

-- 1. DEPARTMENTS (Configurable Academic Departments)
INSERT INTO public.departments (id, code, name, head_of_department, contact_email, is_active) VALUES
('d0000001-0000-0000-0000-000000000001', 'CSE', 'Computer Science & Engineering', 'Dr. Ramesh Kumar', 'hod.cse@placementconnect.edu', TRUE),
('d0000002-0000-0000-0000-000000000002', 'IT', 'Information Technology', 'Dr. Sunita Sharma', 'hod.it@placementconnect.edu', TRUE),
('d0000003-0000-0000-0000-000000000003', 'AI&DS', 'Artificial Intelligence & Data Science', 'Dr. Vikram Patel', 'hod.aids@placementconnect.edu', TRUE),
('d0000004-0000-0000-0000-000000000004', 'ECE', 'Electronics & Communication', 'Dr. Ananya Reddy', 'hod.ece@placementconnect.edu', TRUE),
('d0000005-0000-0000-0000-000000000005', 'EEE', 'Electrical & Electronics Engineering', 'Dr. Rajesh Nair', 'hod.eee@placementconnect.edu', TRUE),
('d0000006-0000-0000-0000-000000000006', 'MECH', 'Mechanical Engineering', 'Dr. Arvind Joshi', 'hod.mech@placementconnect.edu', TRUE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    head_of_department = EXCLUDED.head_of_department,
    contact_email = EXCLUDED.contact_email,
    is_active = EXCLUDED.is_active;

-- 2. PROGRAMS (Configurable Degree Programs)
INSERT INTO public.programs (id, department_id, code, name, degree_level, duration_years, is_active) VALUES
('p0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001', 'BTECH-CSE', 'Bachelor of Technology in Computer Science & Engineering', 'Undergraduate', 4, TRUE),
('p0000002-0000-0000-0000-000000000002', 'd0000002-0000-0000-0000-000000000002', 'BTECH-IT', 'Bachelor of Technology in Information Technology', 'Undergraduate', 4, TRUE),
('p0000003-0000-0000-0000-000000000003', 'd0000003-0000-0000-0000-000000000003', 'BTECH-AIDS', 'Bachelor of Technology in Artificial Intelligence & Data Science', 'Undergraduate', 4, TRUE),
('p0000004-0000-0000-0000-000000000004', 'd0000004-0000-0000-0000-000000000004', 'BTECH-ECE', 'Bachelor of Technology in Electronics & Communication', 'Undergraduate', 4, TRUE),
('p0000005-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000001', 'MTECH-CSE', 'Master of Technology in Computer Science', 'Postgraduate', 2, TRUE),
('p0000006-0000-0000-0000-000000000006', 'd0000001-0000-0000-0000-000000000001', 'MCA', 'Master of Computer Applications', 'Postgraduate', 2, TRUE)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    degree_level = EXCLUDED.degree_level,
    duration_years = EXCLUDED.duration_years,
    is_active = EXCLUDED.is_active;

-- 3. BATCHES (Configurable Batches & Graduation Years)
INSERT INTO public.batches (id, name, graduation_year, start_year, is_active) VALUES
('b0000001-0000-0000-0000-000000000001', 'Batch 2023-2027', 2027, 2023, TRUE),
('b0000002-0000-0000-0000-000000000002', 'Batch 2024-2028', 2028, 2024, TRUE),
('b0000003-0000-0000-0000-000000000003', 'Batch 2022-2026', 2026, 2022, TRUE),
('b0000004-0000-0000-0000-000000000004', 'Batch 2021-2025', 2025, 2021, TRUE),
('b0000005-0000-0000-0000-000000000005', 'Batch 2020-2024 (Alumni)', 2024, 2020, TRUE),
('b0000006-0000-0000-0000-000000000006', 'Batch 2019-2023 (Alumni)', 2023, 2019, TRUE)
ON CONFLICT (name) DO UPDATE SET
    graduation_year = EXCLUDED.graduation_year,
    start_year = EXCLUDED.start_year,
    is_active = EXCLUDED.is_active;

-- 4. COMPANIES (20 Tech, Product & Core Leaders)
INSERT INTO public.companies (id, name, logo, website, description, industry, location, tier) VALUES
('c0000001-0000-0000-0000-000000000001', 'Google', 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=128&auto=format&fit=crop&q=60', 'https://careers.google.com', 'Global technology leader in search, cloud computing, AI, and software innovation.', 'Technology / AI / Cloud', 'Bengaluru, Hyderabad', 'Super Dream (Tier 1)'),
('c0000002-0000-0000-0000-000000000002', 'Microsoft', 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=128&auto=format&fit=crop&q=60', 'https://careers.microsoft.com', 'Empowering every person and every organization on the planet to achieve more through world-class software.', 'Technology / Cloud / OS', 'Bengaluru, Hyderabad, Noida', 'Super Dream (Tier 1)'),
('c0000003-0000-0000-0000-000000000003', 'Amazon', 'https://images.unsplash.com/photo-1523474253246-720961237a9a?w=128&auto=format&fit=crop&q=60', 'https://amazon.jobs', 'E-commerce, cloud computing with AWS, digital streaming, and artificial intelligence.', 'E-Commerce / Cloud', 'Bengaluru, Chennai, Hyderabad', 'Super Dream (Tier 1)'),
('c0000004-0000-0000-0000-000000000004', 'Atlassian', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&auto=format&fit=crop&q=60', 'https://www.atlassian.com/company/careers', 'Collaboration and productivity software suite including Jira, Confluence, and Bitbucket.', 'Enterprise SaaS', 'Bengaluru (Hybrid)', 'Super Dream (Tier 1)'),
('c0000005-0000-0000-0000-000000000005', 'Adobe', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=128&auto=format&fit=crop&q=60', 'https://www.adobe.com/careers.html', 'Pioneer in creative tools, digital media, PDF platforms, and marketing solutions.', 'Software & Design', 'Noida, Bengaluru', 'Super Dream (Tier 1)'),
('c0000006-0000-0000-0000-000000000006', 'Cisco Systems', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=128&auto=format&fit=crop&q=60', 'https://www.cisco.com/c/en/us/about/careers.html', 'Worldwide leader in networking, cybersecurity, hardware routing, and cloud infrastructure.', 'Networking & Security', 'Bengaluru, Chennai', 'Dream (Tier 2)'),
('c0000007-0000-0000-0000-000000000007', 'Oracle', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=128&auto=format&fit=crop&q=60', 'https://www.oracle.com/careers', 'Integrated cloud applications, autonomous database management systems, and hardware.', 'Cloud & Databases', 'Bengaluru, Hyderabad', 'Dream (Tier 2)'),
('c0000008-0000-0000-0000-000000000008', 'NVIDIA', 'https://images.unsplash.com/photo-1618761714958-0efedcb7ec80?w=128&auto=format&fit=crop&q=60', 'https://www.nvidia.com/en-us/about-nvidia/careers', 'Pioneering GPU-accelerated computing, neural networks, CUDA, and autonomous machines.', 'Semiconductor / AI Hardware', 'Bengaluru, Pune', 'Super Dream (Tier 1)'),
('c0000009-0000-0000-0000-000000000009', 'Goldman Sachs', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&auto=format&fit=crop&q=60', 'https://www.goldmansachs.com/careers', 'Leading global investment banking, securities, quantitative trading, and investment management.', 'FinTech & Investment Banking', 'Bengaluru, Hyderabad', 'Super Dream (Tier 1)'),
('c0000010-0000-0000-0000-000000000010', 'Uber', 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=128&auto=format&fit=crop&q=60', 'https://www.uber.com/careers', 'High-throughput distributed systems power mobility, freight, and grocery logistics worldwide.', 'Mobility / Distributed Systems', 'Bengaluru, Hyderabad', 'Super Dream (Tier 1)'),
('c0000011-0000-0000-0000-000000000011', 'Razorpay', 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=60', 'https://razorpay.com/jobs', 'India’s leading full-stack financial solutions and digital payments architecture unicorn.', 'FinTech', 'Bengaluru', 'Super Dream (Tier 1)'),
('c0000012-0000-0000-0000-000000000012', 'Flipkart', 'https://images.unsplash.com/photo-1556742049-0a67e5572263?w=128&auto=format&fit=crop&q=60', 'https://www.flipkartcareers.com', 'Transforming commerce in India through cutting-edge customer apps, supply-chain tech, and AI.', 'E-Commerce / Supply Chain', 'Bengaluru', 'Super Dream (Tier 1)'),
('c0000013-0000-0000-0000-000000000013', 'Salesforce', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=128&auto=format&fit=crop&q=60', 'https://www.salesforce.com/company/careers', 'World #1 CRM platform, enterprise workflow automation, and MuleSoft integration pipelines.', 'Enterprise Cloud CRM', 'Hyderabad, Bengaluru', 'Super Dream (Tier 1)'),
('c0000014-0000-0000-0000-000000000014', 'Morgan Stanley', 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=128&auto=format&fit=crop&q=60', 'https://www.morganstanley.com/careers', 'Ultra-low latency algorithmic trading desks, risk analytics, and global financial engineering.', 'FinTech / High Frequency Trading', 'Mumbai, Bengaluru', 'Super Dream (Tier 1)'),
('c0000015-0000-0000-0000-000000000015', 'Qualcomm', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=128&auto=format&fit=crop&q=60', 'https://www.qualcomm.com/company/careers', 'Foundational technologies for 5G, Wi-Fi 7, Snapdragon compute platforms, and automotive IoT.', 'Wireless & Semiconductor', 'Hyderabad, Bengaluru, Chennai', 'Dream (Tier 2)'),
('c0000016-0000-0000-0000-000000000016', 'TCS Digital', 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=128&auto=format&fit=crop&q=60', 'https://www.tcs.com/careers', 'Strategic digital transformation, generative AI accelerators, and cloud modernization at scale.', 'IT Services & Digital Solutions', 'Pan India', 'Core / Standard'),
('c0000017-0000-0000-0000-000000000017', 'Infosys (Specialist)', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=128&auto=format&fit=crop&q=60', 'https://www.infosys.com/careers', 'Digital specialist programmer and systems engineer programs powering global fortune 500s.', 'IT & Consulting', 'Bengaluru, Pune, Mysuru', 'Core / Standard'),
('c0000018-0000-0000-0000-000000000018', 'Intel Corporation', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=128&auto=format&fit=crop&q=60', 'https://www.intel.com/jobs', 'Silicon design, semiconductor fabs, server processors, and edge computing architectures.', 'Semiconductor & Embedded', 'Bengaluru', 'Dream (Tier 2)'),
('c0000019-0000-0000-0000-000000000019', 'Stripe', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=128&auto=format&fit=crop&q=60', 'https://stripe.com/jobs', 'Financial infrastructure for the internet, handling billions in global transactions seamlessly.', 'FinTech / API Infrastructure', 'Remote / Bengaluru', 'Super Dream (Tier 1)'),
('c0000020-0000-0000-0000-000000000020', 'Zomato & Blinkit', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=128&auto=format&fit=crop&q=60', 'https://www.zomato.com/careers', 'Hyperlocal food discovery, high-velocity quick commerce, and dynamic routing engineering.', 'Consumer Tech / Logistics', 'Gurugram, Bengaluru', 'Dream (Tier 2)')
ON CONFLICT (name) DO NOTHING;

-- 5. JOBS (30 Diverse Job Openings across Domains, Packages, and Deadlines)
INSERT INTO public.jobs (id, company_id, title, description, domain, location, employment_type, salary, eligibility, minimum_cgpa, required_skills, application_deadline, status, vacancies) VALUES
('j0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'Software Development Engineer - Intern + FTE', 'Join Google Core Systems team to build planetary-scale distributed infrastructure, search ranking algorithms, and cloud APIs.', 'Software Development', 'Bengaluru, India', 'Full Time + 6M Internship', '₹32 - ₹42 LPA', 'B.Tech CSE/IT/ECE with min 7.5 CGPA and strong algorithmic reasoning.', 7.50, ARRAY['C++', 'Java', 'Data Structures', 'Algorithms', 'Distributed Systems'], NOW() + INTERVAL '14 days', 'Active', 8),
('j0000002-0000-0000-0000-000000000002', 'c0000002-0000-0000-0000-000000000002', 'Cloud Solution Architect - Azure Engineering', 'Work on Microsoft Azure compute, storage, and networking platforms. Design scalable microservices architectures and optimize real-time streaming engines.', 'Cloud Computing', 'Hyderabad, India', 'Full Time', '₹28 - ₹34 LPA', 'B.Tech CSE/IT/AI&DS with min 7.0 CGPA.', 7.00, ARRAY['C#', '.NET Core', 'Azure', 'Kubernetes', 'Docker', 'System Design'], NOW() + INTERVAL '20 days', 'Active', 6),
('j0000003-0000-0000-0000-000000000003', 'c0000003-0000-0000-0000-000000000003', 'SDE 1 - Fulfillment & Supply Chain Tech', 'Build high-volume order processing pipelines, automated inventory prediction models, and low-latency DynamoDB microservices for Amazon global stores.', 'Full Stack', 'Bengaluru, India', 'Full Time', '₹26 - ₹32 LPA', 'B.Tech / Dual Degree All Engineering with 7.0+ CGPA.', 7.00, ARRAY['Java', 'Spring Boot', 'AWS', 'DynamoDB', 'Microservices'], NOW() + INTERVAL '10 days', 'Active', 12),
('j0000004-0000-0000-0000-000000000004', 'c0000004-0000-0000-0000-000000000004', 'Frontend Platform Engineer', 'Craft delightful, ultra-fast collaborative editing experiences for Jira and Confluence using React, TypeScript, GraphQL, and modern web performance optimizations.', 'Frontend Development', 'Bengaluru (Hybrid)', 'Full Time', '₹30 - ₹38 LPA', 'B.Tech in CSE/IT/ECE with 7.5+ CGPA and strong web fundamentals.', 7.50, ARRAY['TypeScript', 'React', 'GraphQL', 'Next.js', 'Web Performance'], NOW() + INTERVAL '25 days', 'Active', 4),
('j0000005-0000-0000-0000-000000000005', 'c0000005-0000-0000-0000-000000000005', 'Computer Vision & AI/ML Engineer', 'Work on Adobe Firefly generative AI models, Photoshop web rendering algorithms, and neural filters using PyTorch, WebGPU, and modern deep learning pipelines.', 'AI / Machine Learning', 'Noida / Bengaluru', 'Full Time', '₹25 - ₹35 LPA', 'B.Tech/M.Tech with strong linear algebra and deep learning background.', 7.50, ARRAY['Python', 'PyTorch', 'Computer Vision', 'Deep Learning', 'C++'], NOW() + INTERVAL '18 days', 'Active', 5),
('j0000006-0000-0000-0000-000000000006', 'c0000009-0000-0000-0000-000000000009', 'Quantitative Technology Analyst', 'Engineer real-time financial execution engines, risk calculation graphs, and low-latency algorithmic trading infrastructure in Goldman Sachs Global Markets.', 'FinTech', 'Bengaluru, India', 'Full Time', '₹28 - ₹36 LPA', 'B.Tech All Engineering with 8.0+ CGPA and strong mathematics.', 8.00, ARRAY['Java', 'C++', 'Python', 'SQL', 'Algorithms', 'Financial Math'], NOW() + INTERVAL '12 days', 'Active', 5),
('j0000007-0000-0000-0000-000000000007', 'c0000010-0000-0000-0000-000000000010', 'Backend Engineer - Uber Freight & Mobility', 'Develop mission-critical microservices handling millions of concurrent geospatial queries, surge calculations, and dispatch algorithms with Go and Kafka.', 'Backend Development', 'Bengaluru, India', 'Full Time', '₹34 - ₹44 LPA', 'B.Tech CSE/IT with 7.5+ CGPA.', 7.50, ARRAY['Go', 'Kafka', 'PostgreSQL', 'Redis', 'Microservices', 'gRPC'], NOW() + INTERVAL '8 days', 'Active', 6),
('j0000008-0000-0000-0000-000000000008', 'c0000011-0000-0000-0000-000000000011', 'Payment Gateway Platform Engineer', 'Architect robust payment reconciliation pipelines, idempotency shields, and instant refund systems processing over 100M API calls daily.', 'FinTech', 'Bengaluru, India', 'Full Time', '₹22 - ₹28 LPA', 'B.Tech in Any discipline with 6.8+ CGPA.', 6.80, ARRAY['Node.js', 'Go', 'PostgreSQL', 'Redis', 'System Architecture'], NOW() + INTERVAL '15 days', 'Active', 7),
('j0000009-0000-0000-0000-000000000009', 'c0000006-0000-0000-0000-000000000006', 'Network Security & Cloud Engineer', 'Develop enterprise firewalls, SD-WAN controllers, and automated zero-trust security orchestration tools for worldwide corporate networks.', 'Cybersecurity', 'Bengaluru, India', 'Full Time', '₹16 - ₹22 LPA', 'B.Tech CSE/ECE/IT with 7.0+ CGPA.', 7.00, ARRAY['Python', 'C', 'Networking Protocols', 'TCP/IP', 'Linux Kernel', 'Wireshark'], NOW() + INTERVAL '30 days', 'Active', 10),
('j0000010-0000-0000-0000-000000000010', 'c0000008-0000-0000-0000-000000000008', 'CUDA Deep Learning Software Engineer', 'Optimize AI acceleration runtimes, TensorRT kernels, and LLM inference libraries directly on NVIDIA Blackwell and Hopper GPU architectures.', 'AI / Machine Learning', 'Bengaluru / Pune', 'Full Time', '₹30 - ₹45 LPA', 'B.Tech/M.Tech with 8.0+ CGPA, GPU programming interest.', 8.00, ARRAY['CUDA', 'C++', 'Parallel Programming', 'PyTorch', 'GPU Architecture'], NOW() + INTERVAL '22 days', 'Active', 4),
('j0000011-0000-0000-0000-000000000011', 'c0000019-0000-0000-0000-000000000019', 'Full Stack Engineer - Global Billing', 'Create high-reliability payment forms, merchant dashboard workflows, and automated invoice engines with React, Ruby/Java, and robust SQL pipelines.', 'Full Stack', 'Remote / Bengaluru', 'Full Time', '₹35 - ₹48 LPA', 'B.Tech CSE/IT with 7.5+ CGPA and top-tier problem solving.', 7.50, ARRAY['TypeScript', 'React', 'Ruby', 'Java', 'PostgreSQL', 'API Design'], NOW() + INTERVAL '19 days', 'Active', 3),
('j0000012-0000-0000-0000-000000000012', 'c0000016-0000-0000-0000-000000000016', 'Digital Software Engineer - Cloud & AI', 'Work on enterprise cloud transformation, generative AI chatbots, and full stack microservices for international banking and healthcare clients.', 'Software Development', 'Pan India', 'Full Time', '₹7.5 - ₹9 LPA', 'B.Tech all branches with 6.5+ CGPA and zero active backlogs.', 6.50, ARRAY['Java', 'Python', 'SQL', 'HTML/CSS/JS', 'Cloud Basics'], NOW() + INTERVAL '45 days', 'Active', 40)
ON CONFLICT (id) DO NOTHING;

-- 6. RESOURCE FOLDERS (Hierarchical Drive Structure)
INSERT INTO public.folders (id, name, category, is_global) VALUES
('f0000001-0000-0000-0000-000000000001', 'Data Structures & Algorithms (DSA)', 'DSA', TRUE),
('f0000002-0000-0000-0000-000000000002', 'Quantitative & Logical Aptitude', 'Aptitude', TRUE),
('f0000003-0000-0000-0000-000000000003', 'Database Management Systems & SQL', 'DBMS', TRUE),
('f0000004-0000-0000-0000-000000000004', 'Operating Systems (OS)', 'Operating Systems', TRUE),
('f0000005-0000-0000-0000-000000000005', 'Computer Networks (CN)', 'Computer Networks', TRUE),
('f0000006-0000-0000-0000-000000000006', 'System Design (HLD & LLD)', 'System Design', TRUE),
('f0000007-0000-0000-0000-000000000007', 'Java & Spring Boot Mastery', 'Java', TRUE),
('f0000008-0000-0000-0000-000000000008', 'Python & Machine Learning Prep', 'AI/ML', TRUE),
('f0000009-0000-0000-0000-000000000009', 'Full Stack & Web Development', 'Web Development', TRUE),
('f0000010-0000-0000-0000-000000000010', 'Cloud Computing & DevOps (AWS / Docker)', 'Cloud & DevOps', TRUE),
('f0000011-0000-0000-0000-000000000011', 'HR & Behavioral Interview Prep', 'HR & Soft Skills', TRUE),
('f0000012-0000-0000-0000-000000000012', 'Top Tech Company Specific Kits', 'Company Prep', TRUE),
('f0000013-0000-0000-0000-000000000013', 'Resume Templates & Action Verbs Guide', 'Resume Prep', TRUE)
ON CONFLICT (id) DO NOTHING;
