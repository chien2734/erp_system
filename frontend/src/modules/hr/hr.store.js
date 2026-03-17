import { defineStore } from 'pinia';
import HrService from './hr.service';

export const useHrStore = defineStore('hr', {
  state: () => ({
    employees: [],
    loading: false
  }),
  actions: {
    async fetchEmployees() {
      this.loading = true;
      try {
        this.employees = await HrService.getEmployees();
      } finally {
        this.loading = false;
      }
    }
  }
});