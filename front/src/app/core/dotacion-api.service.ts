import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import {
  AuthSession,
  ComplianceRow,
  ComplianceStatus,
  DashboardSummary,
  Delivery,
  DeliveryPayload,
  Employee,
  EmployeePayload,
  ItemType,
  ItemTypePayload,
  Requirement,
  RequirementPayload,
} from './dotacion.models';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DotacionApiService {
  private static readonly STORAGE_TOKEN_KEY = 'dotacion-auth-token';
  private static readonly STORAGE_USER_KEY = 'dotacion-auth-user';

  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';
  private authToken = localStorage.getItem(DotacionApiService.STORAGE_TOKEN_KEY);
  private authUser = localStorage.getItem(DotacionApiService.STORAGE_USER_KEY);

  login(username: string, password: string) {
    const token = btoa(`${username}:${password}`);
    const headers = new HttpHeaders({ Authorization: `Basic ${token}` });

    return this.http.post<AuthSession>(`${this.baseUrl}/auth/login`, {}, { headers }).pipe(
      tap(() => {
        this.authToken = token;
        this.authUser = username;
        localStorage.setItem(DotacionApiService.STORAGE_TOKEN_KEY, token);
        localStorage.setItem(DotacionApiService.STORAGE_USER_KEY, username);
      }),
    );
  }

  getSession() {
    return this.http.get<AuthSession>(`${this.baseUrl}/auth/me`, this.withAuth());
  }

  hasStoredSession(): boolean {
    return !!this.authToken;
  }

  getStoredUsername(): string | null {
    return this.authUser;
  }

  logout(): void {
    this.authToken = null;
    this.authUser = null;
    localStorage.removeItem(DotacionApiService.STORAGE_TOKEN_KEY);
    localStorage.removeItem(DotacionApiService.STORAGE_USER_KEY);
  }

  listEmployees(activeOnly = true) {
    const params = new HttpParams().set('activeOnly', String(activeOnly));
    return this.http.get<Employee[]>(`${this.baseUrl}/employees`, this.withAuth(params));
  }

  createEmployee(payload: EmployeePayload) {
    return this.http.post<Employee>(`${this.baseUrl}/employees`, payload, this.withAuth());
  }

  updateEmployee(employeeId: string, payload: EmployeePayload) {
    return this.http.put<Employee>(`${this.baseUrl}/employees/${employeeId}`, payload, this.withAuth());
  }

  deactivateEmployee(employeeId: string) {
    return this.http.delete<void>(`${this.baseUrl}/employees/${employeeId}`, this.withAuth());
  }

  listItems(activeOnly = true) {
    const params = new HttpParams().set('activeOnly', String(activeOnly));
    return this.http.get<ItemType[]>(`${this.baseUrl}/items`, this.withAuth(params));
  }

  createItem(payload: ItemTypePayload) {
    return this.http.post<ItemType>(`${this.baseUrl}/items`, payload, this.withAuth());
  }

  updateItem(itemId: string, payload: ItemTypePayload) {
    return this.http.put<ItemType>(`${this.baseUrl}/items/${itemId}`, payload, this.withAuth());
  }

  deactivateItem(itemId: string) {
    return this.http.delete<void>(`${this.baseUrl}/items/${itemId}`, this.withAuth());
  }

  listRequirements(employeeId?: string) {
    const params = employeeId ? new HttpParams().set('employeeId', employeeId) : undefined;
    return this.http.get<Requirement[]>(`${this.baseUrl}/requirements`, this.withAuth(params));
  }

  createRequirement(payload: RequirementPayload) {
    return this.http.post<Requirement>(`${this.baseUrl}/requirements`, payload, this.withAuth());
  }

  deleteRequirement(requirementId: string) {
    return this.http.delete<void>(`${this.baseUrl}/requirements/${requirementId}`, this.withAuth());
  }

  listDeliveries(employeeId?: string) {
    const params = employeeId ? new HttpParams().set('employeeId', employeeId) : undefined;
    return this.http.get<Delivery[]>(`${this.baseUrl}/deliveries`, this.withAuth(params));
  }

  createDelivery(payload: DeliveryPayload) {
    return this.http.post<Delivery>(`${this.baseUrl}/deliveries`, payload, this.withAuth());
  }

  downloadCertificate(deliveryId: string) {
    return this.http.get(`${this.baseUrl}/deliveries/${deliveryId}/certificate`, {
      ...this.withAuth(),
      responseType: 'blob',
    });
  }

  certificateStreamUrl(deliveryId: string): string {
    return `${this.baseUrl}/deliveries/${deliveryId}/certificate/stream`;
  }

  latestCertificateStreamUrlByDocument(documentNumber: string): string {
    return `${this.baseUrl}/deliveries/by-document/${encodeURIComponent(documentNumber)}/latest/certificate/stream`;
  }

  getCompliance(status: ComplianceStatus = 'ALL') {
    const params = new HttpParams().set('status', status);
    return this.http.get<ComplianceRow[]>(`${this.baseUrl}/reports/compliance`, this.withAuth(params));
  }

  exportComplianceExcel() {
    return this.http.get(`${this.baseUrl}/reports/compliance/export`, {
      ...this.withAuth(),
      responseType: 'blob',
    });
  }

  complianceExportStreamUrl(): string {
    return `${this.baseUrl}/reports/compliance/export/stream`;
  }

  getDashboardSummary() {
    return this.http.get<DashboardSummary>(`${this.baseUrl}/dashboard/summary`, this.withAuth());
  }

  private withAuth(params?: HttpParams) {
    const headers = this.authToken
      ? new HttpHeaders({ Authorization: `Basic ${this.authToken}` })
      : undefined;

    return {
      headers,
      params,
    };
  }
}
