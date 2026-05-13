export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  zip_code: string;
  service_type: string;
  bedrooms: number;
  bathrooms: number;
  preferred_date: string;
  message: string;
  status: 'new' | 'contacted' | 'estimate_sent' | 'booked' | 'completed' | 'lost';
  created_at: string;
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
