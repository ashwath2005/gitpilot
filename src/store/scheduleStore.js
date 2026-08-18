import { create } from 'zustand';
import { databaseService } from '../services/database/databaseService';

export const useScheduleStore = create((set, get) => ({
  schedules: [],
  isLoading: false,

  fetchSchedules: async () => {
    set({ isLoading: true });
    const schedules = await databaseService.getSchedules();
    set({ schedules, isLoading: false });
  },

  saveSchedule: async (schedule) => {
    const schedules = get().schedules;
    const index = schedules.findIndex((s) => s.id === schedule.id);
    let updated;
    if (index !== -1) {
      updated = [...schedules];
      updated[index] = schedule;
    } else {
      updated = [...schedules, { ...schedule, id: `sched_${Date.now()}` }];
    }
    await databaseService.saveSchedules(updated);
    set({ schedules: updated });
  },

  deleteSchedule: async (id) => {
    const schedules = get().schedules.filter((s) => s.id !== id);
    await databaseService.saveSchedules(schedules);
    set({ schedules });
  },
}));
