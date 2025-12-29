/**
 * O*NET Taxonomy - Static universal skills, knowledge, and abilities
 * 
 * This data rarely changes (O*NET updates ~yearly) so we keep it static.
 * Source: O*NET 30.1 Database (December 2024)
 * License: Creative Commons Attribution 4.0
 * 
 * Copyright (c) 2025 Thoughtful App Co. and Erikk Shupp. All rights reserved.
 */

// ============================================================================
// SKILLS (35 Total)
// ============================================================================

export interface OnetSkill {
  id: string;
  name: string;
  description: string;
  category: 'basic-content' | 'basic-process' | 'social' | 'complex-problem-solving' | 'technical' | 'systems' | 'resource-management';
}

export const ONET_SKILLS: OnetSkill[] = [
  // Basic Content Skills (6)
  { id: '2.A.1.a', name: 'Reading Comprehension', description: 'Understanding written sentences and paragraphs in work-related documents.', category: 'basic-content' },
  { id: '2.A.1.b', name: 'Active Listening', description: 'Giving full attention to what other people are saying, taking time to understand the points being made, asking questions as appropriate, and not interrupting at inappropriate times.', category: 'basic-content' },
  { id: '2.A.1.c', name: 'Writing', description: 'Communicating effectively in writing as appropriate for the needs of the audience.', category: 'basic-content' },
  { id: '2.A.1.d', name: 'Speaking', description: 'Talking to others to convey information effectively.', category: 'basic-content' },
  { id: '2.A.1.e', name: 'Mathematics', description: 'Using mathematics to solve problems.', category: 'basic-content' },
  { id: '2.A.1.f', name: 'Science', description: 'Using scientific rules and methods to solve problems.', category: 'basic-content' },
  
  // Basic Process Skills (4)
  { id: '2.A.2.a', name: 'Critical Thinking', description: 'Using logic and reasoning to identify the strengths and weaknesses of alternative solutions, conclusions, or approaches to problems.', category: 'basic-process' },
  { id: '2.A.2.b', name: 'Active Learning', description: 'Understanding the implications of new information for both current and future problem-solving and decision-making.', category: 'basic-process' },
  { id: '2.A.2.c', name: 'Learning Strategies', description: 'Selecting and using training/instructional methods and procedures appropriate for the situation when learning or teaching new things.', category: 'basic-process' },
  { id: '2.A.2.d', name: 'Monitoring', description: 'Monitoring/Assessing performance of yourself, other individuals, or organizations to make improvements or take corrective action.', category: 'basic-process' },
  
  // Social Skills (6)
  { id: '2.B.1.a', name: 'Social Perceptiveness', description: 'Being aware of others\' reactions and understanding why they react as they do.', category: 'social' },
  { id: '2.B.1.b', name: 'Coordination', description: 'Adjusting actions in relation to others\' actions.', category: 'social' },
  { id: '2.B.1.c', name: 'Persuasion', description: 'Persuading others to change their minds or behavior.', category: 'social' },
  { id: '2.B.1.d', name: 'Negotiation', description: 'Bringing others together and trying to reconcile differences.', category: 'social' },
  { id: '2.B.1.e', name: 'Instructing', description: 'Teaching others how to do something.', category: 'social' },
  { id: '2.B.1.f', name: 'Service Orientation', description: 'Actively looking for ways to help people.', category: 'social' },
  
  // Complex Problem Solving (1)
  { id: '2.B.2.i', name: 'Complex Problem Solving', description: 'Identifying complex problems and reviewing related information to develop and evaluate options and implement solutions.', category: 'complex-problem-solving' },
  
  // Technical Skills (11)
  { id: '2.B.3.a', name: 'Operations Analysis', description: 'Analyzing needs and product requirements to create a design.', category: 'technical' },
  { id: '2.B.3.b', name: 'Technology Design', description: 'Generating or adapting equipment and technology to serve user needs.', category: 'technical' },
  { id: '2.B.3.c', name: 'Equipment Selection', description: 'Determining the kind of tools and equipment needed to do a job.', category: 'technical' },
  { id: '2.B.3.d', name: 'Installation', description: 'Installing equipment, machines, wiring, or programs to meet specifications.', category: 'technical' },
  { id: '2.B.3.e', name: 'Programming', description: 'Writing computer programs for various purposes.', category: 'technical' },
  { id: '2.B.3.g', name: 'Operations Monitoring', description: 'Watching gauges, dials, or other indicators to make sure a machine is working properly.', category: 'technical' },
  { id: '2.B.3.h', name: 'Operation and Control', description: 'Controlling operations of equipment or systems.', category: 'technical' },
  { id: '2.B.3.j', name: 'Equipment Maintenance', description: 'Performing routine maintenance on equipment and determining when and what kind of maintenance is needed.', category: 'technical' },
  { id: '2.B.3.k', name: 'Troubleshooting', description: 'Determining causes of operating errors and deciding what to do about it.', category: 'technical' },
  { id: '2.B.3.l', name: 'Repairing', description: 'Repairing machines or systems using the needed tools.', category: 'technical' },
  { id: '2.B.3.m', name: 'Quality Control Analysis', description: 'Conducting tests and inspections of products, services, or processes to evaluate quality or performance.', category: 'technical' },
  
  // Systems Skills (3)
  { id: '2.B.4.e', name: 'Judgment and Decision Making', description: 'Considering the relative costs and benefits of potential actions to choose the most appropriate one.', category: 'systems' },
  { id: '2.B.4.g', name: 'Systems Analysis', description: 'Determining how a system should work and how changes in conditions, operations, and the environment will affect outcomes.', category: 'systems' },
  { id: '2.B.4.h', name: 'Systems Evaluation', description: 'Identifying measures or indicators of system performance and the actions needed to improve or correct performance, relative to the goals of the system.', category: 'systems' },
  
  // Resource Management Skills (4)
  { id: '2.B.5.a', name: 'Time Management', description: 'Managing one\'s own time and the time of others.', category: 'resource-management' },
  { id: '2.B.5.b', name: 'Management of Financial Resources', description: 'Determining how money will be spent to get the work done, and accounting for these expenditures.', category: 'resource-management' },
  { id: '2.B.5.c', name: 'Management of Material Resources', description: 'Obtaining and seeing to the appropriate use of equipment, facilities, and materials needed to do certain work.', category: 'resource-management' },
  { id: '2.B.5.d', name: 'Management of Personnel Resources', description: 'Motivating, developing, and directing people as they work, identifying the best people for the job.', category: 'resource-management' },
];

// ============================================================================
// KNOWLEDGE AREAS (33 Total)
// ============================================================================

export interface OnetKnowledge {
  id: string;
  name: string;
  description: string;
  domain: 'business' | 'manufacturing' | 'engineering' | 'math-science' | 'health' | 'education' | 'arts' | 'law' | 'communications' | 'transportation';
}

export const ONET_KNOWLEDGE: OnetKnowledge[] = [
  // Business and Management (6)
  { id: '2.C.1.a', name: 'Administration and Management', description: 'Knowledge of business and management principles involved in strategic planning, resource allocation, human resources modeling, leadership technique, production methods, and coordination of people and resources.', domain: 'business' },
  { id: '2.C.1.b', name: 'Administrative', description: 'Knowledge of administrative and office procedures and systems such as word processing, managing files and records, stenography and transcription, designing forms, and workplace terminology.', domain: 'business' },
  { id: '2.C.1.c', name: 'Economics and Accounting', description: 'Knowledge of economic and accounting principles and practices, the financial markets, banking, and the analysis and reporting of financial data.', domain: 'business' },
  { id: '2.C.1.d', name: 'Sales and Marketing', description: 'Knowledge of principles and methods for showing, promoting, and selling products or services.', domain: 'business' },
  { id: '2.C.1.e', name: 'Customer and Personal Service', description: 'Knowledge of principles and processes for providing customer and personal services.', domain: 'business' },
  { id: '2.C.1.f', name: 'Personnel and Human Resources', description: 'Knowledge of principles and procedures for personnel recruitment, selection, training, compensation and benefits, labor relations and negotiation, and personnel information systems.', domain: 'business' },
  
  // Manufacturing and Production (2)
  { id: '2.C.2.a', name: 'Production and Processing', description: 'Knowledge of raw materials, production processes, quality control, costs, and other techniques for maximizing the effective manufacture and distribution of goods.', domain: 'manufacturing' },
  { id: '2.C.2.b', name: 'Food Production', description: 'Knowledge of techniques and equipment for planting, growing, and harvesting food products (both plant and animal) for consumption, including storage/handling techniques.', domain: 'manufacturing' },
  
  // Engineering and Technology (5)
  { id: '2.C.3.a', name: 'Computers and Electronics', description: 'Knowledge of circuit boards, processors, chips, electronic equipment, and computer hardware and software, including applications and programming.', domain: 'engineering' },
  { id: '2.C.3.b', name: 'Engineering and Technology', description: 'Knowledge of the practical application of engineering science and technology.', domain: 'engineering' },
  { id: '2.C.3.c', name: 'Design', description: 'Knowledge of design techniques, tools, and principles involved in production of precision technical plans, blueprints, drawings, and models.', domain: 'engineering' },
  { id: '2.C.3.d', name: 'Building and Construction', description: 'Knowledge of materials, methods, and the tools involved in the construction or repair of houses, buildings, or other structures such as highways and roads.', domain: 'engineering' },
  { id: '2.C.3.e', name: 'Mechanical', description: 'Knowledge of machines and tools, including their designs, uses, repair, and maintenance.', domain: 'engineering' },
  
  // Mathematics and Science (7)
  { id: '2.C.4.a', name: 'Mathematics', description: 'Knowledge of arithmetic, algebra, geometry, calculus, statistics, and their applications.', domain: 'math-science' },
  { id: '2.C.4.b', name: 'Physics', description: 'Knowledge and prediction of physical principles, laws, their interrelationships, and applications.', domain: 'math-science' },
  { id: '2.C.4.c', name: 'Chemistry', description: 'Knowledge of the chemical composition, structure, and properties of substances and of the chemical processes and transformations that they undergo.', domain: 'math-science' },
  { id: '2.C.4.d', name: 'Biology', description: 'Knowledge of plant and animal organisms, their tissues, cells, functions, interdependencies, and interactions with each other and the environment.', domain: 'math-science' },
  { id: '2.C.4.e', name: 'Psychology', description: 'Knowledge of human behavior and performance; individual differences in ability, personality, and interests; learning and motivation; psychological research methods.', domain: 'math-science' },
  { id: '2.C.4.f', name: 'Sociology and Anthropology', description: 'Knowledge of group behavior and dynamics, societal trends and influences, human migrations, ethnicity, cultures, and their history and origins.', domain: 'math-science' },
  { id: '2.C.4.g', name: 'Geography', description: 'Knowledge of principles and methods for describing the features of land, sea, and air masses, including their physical characteristics, locations, interrelationships, and distribution of plant, animal, and human life.', domain: 'math-science' },
  
  // Health Services (2)
  { id: '2.C.5.a', name: 'Medicine and Dentistry', description: 'Knowledge of the information and techniques needed to diagnose and treat human injuries, diseases, and deformities.', domain: 'health' },
  { id: '2.C.5.b', name: 'Therapy and Counseling', description: 'Knowledge of principles, methods, and procedures for diagnosis, treatment, and rehabilitation of physical and mental dysfunctions, and for career counseling and guidance.', domain: 'health' },
  
  // Education and Training (1)
  { id: '2.C.6', name: 'Education and Training', description: 'Knowledge of principles and methods for curriculum and training design, teaching and instruction for individuals and groups, and the measurement of training effects.', domain: 'education' },
  
  // Arts and Humanities (5)
  { id: '2.C.7.a', name: 'English Language', description: 'Knowledge of the structure and content of the English language including the meaning and spelling of words, and rules of composition and grammar.', domain: 'arts' },
  { id: '2.C.7.b', name: 'Foreign Language', description: 'Knowledge of the structure and content of a foreign (non-English) language including the meaning and spelling of words, rules of composition and grammar, and pronunciation.', domain: 'arts' },
  { id: '2.C.7.c', name: 'Fine Arts', description: 'Knowledge of the theory and techniques required to compose, produce, and perform works of music, dance, visual arts, drama, and sculpture.', domain: 'arts' },
  { id: '2.C.7.d', name: 'History and Archeology', description: 'Knowledge of historical events and their causes, indicators, and effects on civilizations and cultures.', domain: 'arts' },
  { id: '2.C.7.e', name: 'Philosophy and Theology', description: 'Knowledge of different philosophical systems and religions.', domain: 'arts' },
  
  // Law and Public Safety (2)
  { id: '2.C.8.a', name: 'Public Safety and Security', description: 'Knowledge of relevant equipment, policies, procedures, and strategies to promote effective local, state, or national security operations for the protection of people, data, property, and institutions.', domain: 'law' },
  { id: '2.C.8.b', name: 'Law and Government', description: 'Knowledge of laws, legal codes, court procedures, precedents, government regulations, executive orders, agency rules, and the democratic political process.', domain: 'law' },
  
  // Communications (2)
  { id: '2.C.9.a', name: 'Telecommunications', description: 'Knowledge of transmission, broadcasting, switching, control, and operation of telecommunications systems.', domain: 'communications' },
  { id: '2.C.9.b', name: 'Communications and Media', description: 'Knowledge of media production, communication, and dissemination techniques and methods.', domain: 'communications' },
  
  // Transportation (1)
  { id: '2.C.10', name: 'Transportation', description: 'Knowledge of principles and methods for moving people or goods by air, rail, sea, or road, including the relative costs and benefits.', domain: 'transportation' },
];

// ============================================================================
// HELPER: Build lookup maps for fast matching
// ============================================================================

export const SKILL_NAMES = ONET_SKILLS.map(s => s.name.toLowerCase());
export const KNOWLEDGE_NAMES = ONET_KNOWLEDGE.map(k => k.name.toLowerCase());

export function findMatchingSkill(text: string): OnetSkill | null {
  const lower = text.toLowerCase();
  return ONET_SKILLS.find(s => 
    lower.includes(s.name.toLowerCase()) || 
    s.name.toLowerCase().includes(lower)
  ) || null;
}

export function findMatchingKnowledge(text: string): OnetKnowledge | null {
  const lower = text.toLowerCase();
  return ONET_KNOWLEDGE.find(k => 
    lower.includes(k.name.toLowerCase()) || 
    k.name.toLowerCase().includes(lower)
  ) || null;
}
