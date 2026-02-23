
export enum ChatStep {
  WELCOME = 'WELCOME',
  BENEFITS = 'BENEFITS',
  QUALIFICATION_NICHE = 'QUALIFICATION_NICHE',
  QUALIFICATION_BUDGET = 'QUALIFICATION_BUDGET',
  QUALIFICATION_PLANS = 'QUALIFICATION_PLANS',
  CONTACT_COLLECTION = 'CONTACT_COLLECTION',
  COMPLETED = 'COMPLETED'
}

export interface Message {
  id: string;
  role: 'bot' | 'user';
  content: string;
  timestamp: Date;
  options?: string[];
}

export interface LeadData {
  niche?: string;
  budget?: string;
  plans?: string;
  name?: string;
  phone?: string;
}
