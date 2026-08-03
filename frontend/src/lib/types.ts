// Shared API types mirroring the FastAPI Pydantic schemas.

export type RoleName =
  | "super_admin"
  | "student_researcher"
  | "researcher"
  | "guest";

export type Visibility = "private" | "public_metadata" | "restricted" | "public";

export type DatasetStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "deleted";

export interface Role {
  id: number;
  name: RoleName;
  description?: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  affiliation?: string;
  bio?: string;
  avatar_url?: string;
  status: string;
  is_email_verified: boolean;
  role: Role;
  created_at: string;
  last_login_at?: string;
}

export interface UserPublic {
  id: number;
  username: string;
  full_name?: string;
  affiliation?: string;
  avatar_url?: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface Named {
  id: number;
  name: string;
  slug?: string;
}

export interface License {
  id: number;
  code: string;
  name: string;
  url?: string;
}

export interface DatasetFile {
  id: number;
  filename: string;
  content_type?: string;
  size_bytes: number;
  checksum_sha256?: string;
  virus_scan_status: string;
  created_at: string;
}

export interface DatasetVersion {
  id: number;
  version: string;
  changelog?: string;
  is_current: boolean;
  total_size_bytes: number;
  created_at: string;
  files: DatasetFile[];
}

export interface DatasetListItem {
  id: number;
  slug: string;
  title: string;
  authors?: string;
  affiliation?: string;
  visibility: Visibility;
  status: DatasetStatus;
  download_count: number;
  view_count: number;
  like_count: number;
  file_count: number;
  total_size_bytes: number;
  preview_image_url?: string;
  created_at: string;
  updated_at: string;
  owner: UserPublic;
  research_area?: Named;
  license?: License;
  tags: Tag[];
}

export interface DatasetDetail extends DatasetListItem {
  description?: string;
  contact_email?: string;
  keywords?: string;
  funding_agency?: string;
  doi?: string;
  publication_link?: string;
  citation_text?: string;
  readme?: string;
  documentation?: string;
  rejection_reason?: string;
  department?: Named;
  category?: Named;
  approved_at?: string;
  versions: DatasetVersion[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface AccessRequest {
  id: number;
  dataset_id: number;
  requester: UserPublic;
  purpose?: string;
  institution?: string;
  research_area?: string;
  message?: string;
  status: string;
  access_level?: string;
  grant_duration?: string;
  decision_note?: string;
  expires_at?: string;
  created_at: string;
  decided_at?: string;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  body?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminOverview {
  cards: {
    datasets: number;
    users: number;
    downloads: number;
    storage_bytes: number;
    pending_requests: number;
    pending_datasets: number;
  };
  monthly_uploads: { label: string; value: number }[];
  top_datasets: { name: string; value: number }[];
  research_areas: { name: string; value: number }[];
  storage_by_area: { name: string; value: number }[];
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
