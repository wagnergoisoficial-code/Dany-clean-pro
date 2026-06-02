export interface Lead {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  city: string;
  zip_code?: string;
  service_type: string;
  bedrooms: number | string;
  bathrooms: number | string;
  preferred_date?: string;
  message?: string;
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled' | 'inquiring' | 'awaiting_photos' | 'estimate_requested' | 'estimate_scheduled' | 'followup_needed' | 'quote_sent' | 'booked' | 'closed';
  createdAt?: any;
  created_at?: string;

  // Custom AI Receptionist/CRM fields
  customer_name?: string;
  customer_phone?: string;
  customer_message?: string;
  service_requested?: string;
  property_type?: string;
  address?: string;
  preferred_time?: string;
  estimate_option?: string;
  estimated_price?: string;
  ai_reply?: string;
  lead_status?: string;
  conversation_summary?: string;
  sms_history?: string;
  updated_at?: string;
  
  // Shadow Mode Fields
  lead_score?: number | null;
  intent_category?: string | null;
  revenue_estimate?: number | null;
  ai_summary?: string | null;

  // Sales Tracker Fields (Fase 4)
  call_made?: number | null;
  client_answered?: number | null;
  quote_sent?: number | null;
  service_scheduled?: number | null;
  sale_closed?: number | null;
  closed_value?: number | null;
  commercial_notes?: string | null;

  // Commercial Command Center - Fase 5
  projected_frequency?: string | null;
  projected_ltv?: number | null;
  objection_category?: string | null;
  objection_notes?: string | null;

  // Marketing Attribution - Módulo 1
  attribution_channel?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;

  // Sales Velocity - Módulo 2
  first_contacted_at?: string | null;

  // Customer Lifecycle - Módulo 3
  lifecycle_status?: 'lead' | 'active' | 'recurring' | 'paused' | 'lost' | null;
  last_service_date?: string | null;

  // Customer Recovery - Módulo 4
  recovery_history?: string | null; // JSON String of RecoveryAttempt[]

  // Revenue Recovery - Módulo 5
  quote_sent_at?: string | null;
  quote_recovery_history?: string | null; // JSON String of QuoteRecoveryAttempt[]
}

export interface QuoteRecoveryAttempt {
  id: string;
  date: string;
  channel: 'sms' | 'call' | 'email';
  status: 'pending' | 'success' | 'refused' | 'no_response';
  notes: string;
  agentName?: string;
}

export interface RecoveryAttempt {
  id: string;
  date: string;
  channel: 'sms' | 'call' | 'email';
  status: 'pending' | 'success' | 'refused' | 'no_response';
  notes: string;
  agentName?: string;
}

export interface Review {
  id: number;
  author: string;
  rating: number;
  comment: string;
  date: string;
  is_published: boolean;
}

export interface GalleryItem {
  id: number;
  url: string;
  title: string;
  category: string;
  created_at: string;
}

export interface ServiceArea {
  id: number;
  city: string;
  zip_codes: string;
}

export interface AuthState {
  token: string | null;
  user: {
    id: number;
    username: string;
  } | null;
}

export interface Customer {
  id: string;
  leadId?: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  zip_code?: string;
  notes?: string;
  totalBookings?: number;
  lastServiceDate?: any;
  status: 'active' | 'inactive';
  createdAt: any;
  updatedAt: any;
}

export interface TimelineEvent {
  id: string;
  type: 'customer_created' | 'customer_updated' | 'notes_updated' | 'status_changed' | 'converted_from_lead' | 'system';
  title: string;
  description: string;
  customerId: string;
  relatedLeadId?: string;
  metadata?: Record<string, any>;
  createdAt: any;
  createdBy?: string;
}
