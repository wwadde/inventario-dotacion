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
  birthDate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ItemCategory = 'DOTACION' | 'REGALO';
export type StockMovementType = 'INBOUND' | 'OUTBOUND' | 'ADJUSTMENT';
export type DeliveryType = 'IMPLEMENTOS' | 'REGALOS';
export type RequirementStatusFilter = 'OPEN' | 'CLOSED' | 'ALL';

export interface ItemType {
  id: string;
  code: string;
  name: string;
  category: ItemCategory;
  description: string | null;
  unitCost: number;
  availableStock: number;
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
  requestedQuantity: number;
  notes: string | null;
  closed: boolean;
  closedAt: string | null;
  closedBy: string | null;
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
  deliveryType: DeliveryType;
  certificateNumber: string;
  deliveredAt: string;
  deliveredBy: string;
  signerName: string | null;
  notes: string | null;
  duplicateAcknowledged: boolean;
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
  totalRequirements: number;
  deliveredRequirements: number;
  pendingRequirements: number;
  deliveredRequirementsPercent: number;
  pendingRequirementsPercent: number;
  deliveredCostThisMonth: number;
  pendingEstimatedCost: number;
  birthdaysToday: number;
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
  birthDate: string | null;
  active: boolean;
}

export interface ItemTypePayload {
  code: string;
  name: string;
  category: ItemCategory;
  description: string | null;
  unitCost: number;
  availableStock: number;
  active: boolean;
}

export interface RequirementPayload {
  employeeId: string;
  itemTypeId: string;
  requestedQuantity: number;
  notes: string | null;
}

export interface DeliveryPayload {
  employeeId: string;
  deliveryType: DeliveryType;
  deliveredAt: string;
  deliveredBy: string;
  signerName: string | null;
  notes: string | null;
  signatureDataUrl: string | null;
  duplicateAcknowledged: boolean;
  items: Array<{
    itemTypeId: string;
    quantity: number;
  }>;
}

export interface StockMovement {
  id: string;
  itemTypeId: string;
  itemCode: string;
  itemName: string;
  movementType: StockMovementType;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  performedBy: string;
  performedAt: string;
}

export interface ItemStockInboundPayload {
  quantity: number;
  reason: string | null;
}
