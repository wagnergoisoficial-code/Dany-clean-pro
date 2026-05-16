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
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
  createdAt?: any;
  created_at?: string;
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
