import { create } from 'zustand';
import { Form } from '../types';
import api from '../utils/api';

interface FormState {
  forms: Form[];
  currentForm: Form | null;
  loading: boolean;
  error: string | null;
  fetchForms: () => Promise<void>;
  fetchForm: (id: string) => Promise<void>;
  createForm: (formData: Partial<Form>) => Promise<Form>;
  updateForm: (id: string, formData: Partial<Form>) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
}

export const useFormStore = create<FormState>((set) => ({
  forms: [],
  currentForm: null,
  loading: false,
  error: null,

  fetchForms: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/forms');
      set({ forms: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchForm: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/forms/${id}`);
      set({ currentForm: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createForm: async (formData: Partial<Form>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/forms', formData);
      set((state) => ({
        forms: [response.data, ...state.forms],
        loading: false
      }));
      return response.data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateForm: async (id: string, formData: Partial<Form>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put(`/forms/${id}`, formData);
      set((state) => ({
        forms: state.forms.map(f => f._id === id ? response.data : f),
        currentForm: response.data,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteForm: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/forms/${id}`);
      set((state) => ({
        forms: state.forms.filter(f => f._id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));

