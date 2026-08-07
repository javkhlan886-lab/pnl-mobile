import { apiFetch } from "./api";

export interface Employee {
  _id: string;
  name: string;
  position: string;
  type: "engineer" | "staff";
  baseSalary: number;
  ndRate: number;
  ndshtRate: number;
  status: "active" | "leave" | "inactive";
  startDate: string;
}

export type EmployeeInput = Omit<Employee, "_id">;

export const getEmployees = () => apiFetch<Employee[]>("/employees");
export const createEmployee = (data: EmployeeInput) => apiFetch<Employee>("/employees", { method: "POST", body: JSON.stringify(data) });
export const updateEmployee = (id: string, data: Partial<EmployeeInput>) => apiFetch<Employee>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteEmployee = (id: string) => apiFetch<void>(`/employees/${id}`, { method: "DELETE" });
