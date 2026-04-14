export interface Employee {
  id: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  area: string | null;
  position: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ItemCategory = 'UNIFORME' | 'BOTAS' | 'EPP' | 'OTRO';

export interface ItemType {
  id: string;
  code: string;
  name: string;
  category: ItemCategory;
  description: string | null;
  defaultPeriodicityMonths: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Requirement {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDocument: string;
  itemTypeId: string;
  itemCode: string;
  itemName: string;
  periodicityMonths: number;
  effectiveFrom: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryItem {
  id: string;
  itemTypeId: string;
  itemCode: string;
  itemName: string;
  category: ItemCategory;
  quantity: number;
}

export interface Delivery {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDocument: string;
  certificateNumber: string;
  deliveredAt: string;
  deliveredBy: string;
  signerName: string | null;
  notes: string | null;
  signaturePresent: boolean;
  items: DeliveryItem[];
  createdAt: string;
  updatedAt: string;
}

export type ComplianceStatus = 'PENDING' | 'UP_TO_DATE' | 'ALL';

export interface ComplianceRow {
  employeeId: string;
  employeeDocument: string;
  employeeName: string;
  area: string | null;
  totalRequirements: number;
  pendingRequirements: number;
  upToDateRequirements: number;
  nextDueDate: string | null;
  pendingItems: string;
  status: Exclude<ComplianceStatus, 'ALL'>;
}

export interface DashboardSummary {
  totalActiveEmployees: number;
  pendingEmployees: number;
  upToDateEmployees: number;
  deliveriesThisMonth: number;
}

export interface AuthSession {
  username: string;
  authenticated: boolean;
  roles: string[];
}

export interface EmployeePayload {
  documentNumber: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  area: string | null;
  position: string | null;
  active: boolean;
}

export interface ItemTypePayload {
  code: string;
  name: string;
  category: ItemCategory;
  description: string | null;
  defaultPeriodicityMonths: number;
  active: boolean;
}

export interface RequirementPayload {
  employeeId: string;
  itemTypeId: string;
  periodicityMonths: number;
  effectiveFrom: string;
  notes: string | null;
}

export interface DeliveryPayload {
  employeeId: string;
  deliveredAt: string;
  deliveredBy: string;
  signerName: string | null;
  notes: string | null;
  signatureDataUrl: string | null;
  items: Array<{
    itemTypeId: string;
    quantity: number;
  }>;
}
