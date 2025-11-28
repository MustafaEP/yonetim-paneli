export interface ActivityLogUser {
  id: number;
  name: string;
  email: string;
}

export interface ActivityLogItem {
  id: number;
  userId?: number | null;
  user?: ActivityLogUser | null;
  action: string;
  entity?: string | null;
  entityId?: number | null;
  details?: string | null;
  createdAt: string;
}

export interface ActivityLogResponse {
  page: number;
  limit: number;
  total: number;
  logs: ActivityLogItem[];
}
