import api from '../api';
import type {
    IApiResponse,
    IEmployee,
    IEmployeePayload,
    IEmployeesListResponse,
} from '@/types';

export interface IListEmployeesQuery {
    branchId?: string;
    search?: string;
    status?: 'Active' | 'Resigned' | 'Terminated' | 'OnLeave';
    limit?: number;
    offset?: number;
}

export interface ITerminateEmployeePayload {
    /** ISO date `YYYY-MM-DD` — payroll cut-off. */
    terminationDate: string;
    /** Free-text reason (BE requires `MinLength(3)`). */
    reason: string;
}

export const hrEmployeesService = {
    listEmployees: async (
        query: IListEmployeesQuery = {},
    ): Promise<IEmployeesListResponse> => {
        const response = await api.get<IApiResponse<IEmployeesListResponse>>(
            '/hr/employees',
            { params: query },
        );
        return response.data.data;
    },

    getEmployee: async (id: string): Promise<IEmployee> => {
        const response = await api.get<IApiResponse<IEmployee>>(
            `/hr/employees/${id}`,
        );
        return response.data.data;
    },

    createEmployee: async (payload: IEmployeePayload): Promise<IEmployee> => {
        const response = await api.post<IApiResponse<IEmployee>>(
            '/hr/employees',
            payload,
        );
        return response.data.data;
    },

    updateEmployee: async (
        id: string,
        payload: Partial<IEmployeePayload>,
    ): Promise<IEmployee> => {
        const response = await api.patch<IApiResponse<IEmployee>>(
            `/hr/employees/${id}`,
            payload,
        );
        return response.data.data;
    },

    terminateEmployee: async (
        id: string,
        payload: ITerminateEmployeePayload,
    ): Promise<IEmployee> => {
        const response = await api.patch<IApiResponse<IEmployee>>(
            `/hr/employees/${id}/terminate`,
            payload,
        );
        return response.data.data;
    },

    uploadEmployeePhoto: async (
        id: string,
        file: File,
    ): Promise<IEmployee> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post<IApiResponse<IEmployee>>(
            `/hr/employees/${id}/photo`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return response.data.data;
    },
};
