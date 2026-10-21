// src/SchedulePlottingPage.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import appLogo from './logo2.png';
import {
  fetchScheduleFromCloud,
  saveScheduleToCloud,
  STORAGE_ROSTER_KEY,
  STORAGE_WEEKS_KEY,
  STORAGE_SCHEDULE_META_KEY,
} from './supabaseSchedule';

// Standard Master Roster from user spreadsheet
export const MASTER_SHIFT_GROUPS = [
  {
    id: 'night',
    name: 'Night Shift',
    hours: '9:00 PM – 6:00 AM',
    inTime: '9:00 PM',
    outTime: '6:00 AM',
    colorClass: 'shift-group-night',
    accentColor: '#a855f7',
    badgeText: '9PM – 6AM',
    icon: 'bi-moon-stars-fill',
    members: [
      {
        id: 'member_hanz',
        name: 'HANZ',
        shifts: {
          mon: { type: 'day-off' },
          tue: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          wed: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          thu: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          fri: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          sat: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          sun: { type: 'day-off' },
        },
      },
      {
        id: 'member_adi',
        name: 'ADI',
        shifts: {
          mon: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          tue: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          wed: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          thu: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          fri: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          sat: { type: 'day-off' },
          sun: { type: 'day-off' },
        },
      },
      {
        id: 'member_yas',
        name: 'YAS',
        shifts: {
          mon: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          tue: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          wed: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          thu: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          fri: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          sat: { type: 'day-off' },
          sun: { type: 'day-off' },
        },
      },
      {
        id: 'member_ronie',
        name: 'RONIE',
        shifts: {
          mon: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          tue: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          wed: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          thu: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          fri: { type: 'day-off' },
          sat: { type: 'day-off' },
          sun: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
        },
      },
      {
        id: 'member_zel',
        name: 'ZEL',
        shifts: {
          mon: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          tue: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          wed: { type: 'day-off' },
          thu: { type: 'day-off' },
          fri: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          sat: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          sun: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
        },
      },
      {
        id: 'member_gab',
        name: 'GAB',
        shifts: {
          mon: { type: 'day-off' },
          tue: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          wed: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          thu: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          fri: { type: 'day-off' },
          sat: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          sun: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
        },
      },
    ],
  },
  {
    id: 'morning',
    name: 'Morning Shift',
    hours: '5:00 AM – 2:00 PM',
    inTime: '5:00 AM',
    outTime: '2:00 PM',
    colorClass: 'shift-group-morning',
    accentColor: '#f97316',
    badgeText: '5AM – 2PM',
    icon: 'bi-sun-fill',
    members: [
      {
        id: 'member_charles',
        name: 'CHARLES',
        shifts: {
          mon: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          tue: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          wed: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          thu: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          fri: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          sat: { type: 'day-off' },
          sun: { type: 'day-off' },
        },
      },
      {
        id: 'member_sean',
        name: 'SEAN',
        shifts: {
          mon: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          tue: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          wed: { type: 'day-off' },
          thu: { type: 'day-off' },
          fri: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          sat: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          sun: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
        },
      },
      {
        id: 'member_nics',
        name: 'NICS',
        shifts: {
          mon: { type: 'day-off' },
          tue: { type: 'day-off' },
          wed: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          thu: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          fri: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          sat: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          sun: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
        },
      },
    ],
  },
  {
    id: 'afternoon',
    name: 'Afternoon Shift',
    hours: '2:00 PM – 11:00 PM',
    inTime: '2:00 PM',
    outTime: '11:00 PM',
    colorClass: 'shift-group-afternoon',
    accentColor: '#0284c7',
    badgeText: '2PM – 11PM',
    icon: 'bi-sunset-fill',
    members: [
      {
        id: 'member_ej',
        name: 'EJ',
        shifts: {
          mon: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          tue: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          wed: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          thu: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          fri: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          sat: { type: 'day-off' },
          sun: { type: 'day-off' },
        },
      },
      {
        id: 'member_jr',
        name: 'JR',
        shifts: {
          mon: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          tue: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          wed: { type: 'day-off' },
          thu: { type: 'day-off' },
          fri: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          sat: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          sun: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
        },
      },
      {
        id: 'member_mat',
        name: 'MAT',
        shifts: {
          mon: { type: 'day-off' },
          tue: { type: 'day-off' },
          wed: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          thu: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          fri: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          sat: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          sun: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
        },
      },
    ],
  },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function toDateISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function generateWeekDays(mondayDate) {
  const days = [];
  const dayNames = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const dayIds = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(mondayDate);
    cur.setDate(mondayDate.getDate() + i);
    const dayNum = cur.getDate();
    const monthIndex = cur.getMonth();
    const monthShort = cur.toLocaleString('en-US', { month: 'short' });
    const fullDate = `${cur.toLocaleString('en-US', { month: 'long' })} ${dayNum}, ${cur.getFullYear()}`;
    const isNov2Holiday = (cur.getFullYear() === 2026 && monthIndex === 10 && dayNum === 2);

    days.push({
      id: dayIds[i],
      dayNum,
      dayName: dayNames[i],
      monthName: monthShort,
      monthIndex,
      year: cur.getFullYear(),
      fullDate,
      isHoliday: isNov2Holiday,
      isoDate: toDateISO(cur),
    });
  }
  return days;
}

function buildWeeksForPeriod(groups, startMonthIndex, endMonthIndex, year) {
  const periodWeeks = {};

  for (let monthIndex = startMonthIndex; monthIndex <= endMonthIndex; monthIndex += 1) {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const diffToMonday = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
    const curMonday = new Date(year, monthIndex, 1 + diffToMonday);
    curMonday.setHours(0, 0, 0, 0);

    while (curMonday <= lastDay) {
      const weekKey = toDateISO(curMonday);
      const weekShifts = {};

      groups.forEach((group) => {
        (group.members || []).forEach((member) => {
          weekShifts[member.id] = {};
          ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach((dayId) => {
            const fallback = dayId === 'sat' || dayId === 'sun'
              ? { type: 'day-off' }
              : { type: 'shift', in: group.inTime, out: group.outTime };
            weekShifts[member.id][dayId] = {
              ...(member.shifts?.[dayId] || fallback),
            };
          });
        });
      });

      periodWeeks[weekKey] = weekShifts;
      curMonday.setDate(curMonday.getDate() + 7);
    }
  }

  return periodWeeks;
}

function getShiftColorClass(shift, fallbackClass) {
  if (!shift || shift.type !== 'shift') return fallbackClass;

  const shiftText = `${shift.in || ''} ${shift.out || ''} ${shift.label || ''}`.toLowerCase();
  if (shiftText.includes('9:00 pm') || shiftText.includes('night')) return 'shift-group-night';
  if (shiftText.includes('5:00 am') || shiftText.includes('morning')) return 'shift-group-morning';
  if (shiftText.includes('2:00 pm') || shiftText.includes('afternoon')) return 'shift-group-afternoon';
  return fallbackClass;
}

export default function SchedulePlottingPage({ onBackToDashboard, currentUserName = '' }) {
  // Month & Year state: default to October 2026 (matching user's uploaded spreadsheet)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(9); // October
  const [selectedYear, setSelectedYear] = useState(2026);
  const [viewMode, setViewMode] = useState('month'); // 'month' (whole month stacked) | 'week' (single week)

  // Single week focus selector
  const [selectedMonday, setSelectedMonday] = useState(() => {
    return new Date(2026, 9, 5, 0, 0, 0); // Oct 5, 2026
  });

  // Base roster groups
  const [rosterGroups, setRosterGroups] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ROSTER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return MASTER_SHIFT_GROUPS;
  });

  // Multi-week custom schedules store: { [weekISO]: { [memberId]: { mon: shift, tue: shift, ... } } }
  const [weeksStore, setWeeksStore] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_WEEKS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {};
  });

  // Cloud Sync state
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [cloudMeta, setCloudMeta] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SCHEDULE_META_KEY);
      return saved ? JSON.parse(saved) : { updatedAt: null, updatedBy: null };
    } catch {
      return { updatedAt: null, updatedBy: null };
    }
  });

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('all');
  const [highlightedDay, setHighlightedDay] = useState(null);
  const [myAgentName, setMyAgentName] = useState(() => {
    return (currentUserName || localStorage.getItem('user_name_creditcard') || '').trim();
  });
  const [toastMsg, setToastMsg] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Drag and Drop state (ONLY name moves)
  const [draggedMember, setDraggedMember] = useState(null); // { id, name, sourceGroupId, weekKey }
  const [dragOverMemberId, setDragOverMemberId] = useState(null);
  const [dragOverGroupId, setDragOverGroupId] = useState(null);

  // Quick Shift Popover / Modal state
  const [activeCellPopover, setActiveCellPopover] = useState(null);
  // { memberId, memberName, dayId, dayName, currentShift, groupHours, defaultIn, defaultOut, groupId, weekKey }
  const [popoverInTime, setPopoverInTime] = useState('');
  const [popoverOutTime, setPopoverOutTime] = useState('');
  const [syncSameDayShifts, setSyncSameDayShifts] = useState(false);

  // Rename Agent state
  const [renamingMember, setRenamingMember] = useState(null); // { id, currentName }
  const [renameInput, setRenameInput] = useState('');

  // Add Member Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentGroupId, setNewAgentGroupId] = useState('night');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Synchronize popover inputs whenever active cell changes
  useEffect(() => {
    if (activeCellPopover) {
      const s = activeCellPopover.currentShift || {};
      setPopoverInTime(s.in || activeCellPopover.defaultIn || '9:00 PM');
      setPopoverOutTime(s.out || activeCellPopover.defaultOut || '6:00 AM');
      setSyncSameDayShifts(false);
    }
  }, [activeCellPopover]);

  // Load from Supabase cloud on initial mount
  useEffect(() => {
    let isMounted = true;
    async function initCloudSchedule() {
      setIsLoadingCloud(true);
      try {
        const res = await fetchScheduleFromCloud();
        if (isMounted && res.success) {
          if (res.rosterGroups && Array.isArray(res.rosterGroups) && res.rosterGroups.length > 0) {
            setRosterGroups(res.rosterGroups);
          }
          if (res.weeksStore && typeof res.weeksStore === 'object') {
            setWeeksStore(res.weeksStore);
          }
          if (res.meta) {
            setCloudMeta(res.meta);
          }
        }
      } catch (e) {
        console.error('Error initializing schedule from cloud:', e);
      } finally {
        if (isMounted) setIsLoadingCloud(false);
      }
    }

    initCloudSchedule();

    const handleSyncEvent = (e) => {
      if (e.detail) {
        setCloudMeta(e.detail);
      }
    };
    window.addEventListener('team_schedule_synced', handleSyncEvent);
    return () => {
      isMounted = false;
      window.removeEventListener('team_schedule_synced', handleSyncEvent);
    };
  }, []);

  // Populate the pictured October–December period on first use, without
  // overwriting any schedule already loaded from local storage or the cloud.
  useEffect(() => {
    if (isLoadingCloud || rosterGroups.length === 0) return;

    const hasOctoberToDecemberSchedule = Object.keys(weeksStore).some((weekKey) => {
      return weekKey >= '2026-09-28' && weekKey <= '2026-12-28';
    });
    if (hasOctoberToDecemberSchedule) return;

    const plottedWeeks = buildWeeksForPeriod(rosterGroups, 9, 11, 2026);
    setWeeksStore((prev) => {
      const updated = { ...plottedWeeks, ...prev };
      try {
        localStorage.setItem(STORAGE_WEEKS_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to cache default plotted schedule:', e);
      }
      return updated;
    });
    setHasUnsavedChanges(true);
    triggerToast('✅ October–December 2026 schedule is now plotted. Save Schedule to publish it.');
  }, [isLoadingCloud, rosterGroups, weeksStore]);

  // Generate all consecutive weeks of the selected month (stacked spreadsheet view)
  const monthWeeks = useMemo(() => {
    const weeks = [];
    const firstDay = new Date(selectedYear, selectedMonthIndex, 1);
    const lastDay = new Date(selectedYear, selectedMonthIndex + 1, 0);

    const firstDayOfWeek = firstDay.getDay();
    const diffToMonday = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
    const startMonday = new Date(selectedYear, selectedMonthIndex, 1 + diffToMonday);
    startMonday.setHours(0, 0, 0, 0);

    let curMonday = new Date(startMonday);
    while (curMonday <= lastDay) {
      const days = generateWeekDays(curMonday);
      const weekKey = toDateISO(curMonday);
      weeks.push({
        monday: new Date(curMonday),
        weekKey,
        days,
      });
      curMonday.setDate(curMonday.getDate() + 7);
    }
    return weeks;
  }, [selectedYear, selectedMonthIndex]);

  // Current days for single week mode
  const currentWeekDays = useMemo(() => {
    return generateWeekDays(selectedMonday);
  }, [selectedMonday]);

  const currentWeekKey = useMemo(() => {
    return toDateISO(selectedMonday);
  }, [selectedMonday]);

  // Get active shift for an agent on a specific day in a specific week
  const getMemberShift = (member, dayId, targetWeekKey = currentWeekKey) => {
    const weekData = weeksStore[targetWeekKey];
    if (weekData && weekData[member.id] && weekData[member.id][dayId]) {
      return weekData[member.id][dayId];
    }
    if (member.shifts && member.shifts[dayId]) {
      return member.shifts[dayId];
    }
    if (dayId === 'sat' || dayId === 'sun') {
      return { type: 'day-off' };
    }
    const group = rosterGroups.find((g) => (g.members || []).some((m) => m.id === member.id));
    return { type: 'shift', in: group?.inTime || '9:00 PM', out: group?.outTime || '6:00 AM' };
  };

  const getMemberName = (member, targetWeekKey = currentWeekKey) => {
    return weeksStore[targetWeekKey]?.__names?.[member.id] || member.name;
  };

  /**
   * Update one agent's shift for one day in one week.
   * Same-day group synchronization is opt-in from the custom time form.
   */
  const updateMemberShiftConsistent = ({
    memberId,
    dayId,
    newShift,
    targetWeekKey = currentWeekKey,
    syncGroupOnSameDay = true,
    applyToAllDays = false,
  }) => {
    setWeeksStore((prev) => {
      const weekData = { ...(prev[targetWeekKey] || {}) };

      if (applyToAllDays) {
        const memberShifts = { ...(weekData[memberId] || {}) };
        ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach((d) => {
          memberShifts[d] = { ...newShift };
        });
        weekData[memberId] = memberShifts;
      } else {
        const memberShifts = { ...(weekData[memberId] || {}) };
        memberShifts[dayId] = { ...newShift };
        weekData[memberId] = memberShifts;

        // Keep clock-in and clock-out consistent on the same day for other working agents
        if (syncGroupOnSameDay && newShift.type === 'shift') {
          const group = rosterGroups.find((g) => (g.members || []).some((m) => m.id === memberId));
          if (group) {
            (group.members || []).forEach((m) => {
              const currentMShift = getMemberShift(m, dayId, targetWeekKey);
              if (currentMShift.type === 'shift' || m.id === memberId) {
                const existingShifts = { ...(weekData[m.id] || {}) };
                existingShifts[dayId] = {
                  ...currentMShift,
                  type: 'shift',
                  in: newShift.in,
                  out: newShift.out,
                };
                weekData[m.id] = existingShifts;
              }
            });
          }
        }
      }

      const updatedWeeks = { ...prev, [targetWeekKey]: weekData };
      try {
        localStorage.setItem(STORAGE_WEEKS_KEY, JSON.stringify(updatedWeeks));
      } catch {}

      return updatedWeeks;
    });

    setHasUnsavedChanges(true);

    const dayName = dayId.toUpperCase();
    if (newShift.type === 'shift' && syncGroupOnSameDay) {
      triggerToast(`🕒 ${dayName} shift times synchronized (${newShift.in} – ${newShift.out}) for this date!`);
    } else {
      triggerToast(`✅ Updated shift for ${dayName}! (Remember to click "Save Schedule" to publish)`);
    }

    setActiveCellPopover(null);
  };

  // Quick 1-click preset select
  const handleQuickShiftSelect = (type, customIn, customOut, label) => {
    if (!activeCellPopover) return;
    const { memberId, dayId, defaultIn, defaultOut, weekKey } = activeCellPopover;

    const inTime = customIn || popoverInTime || defaultIn || '9:00 PM';
    const outTime = customOut || popoverOutTime || defaultOut || '6:00 AM';

    let newShift = {};
    if (type === 'shift') {
      newShift = { type: 'shift', in: inTime, out: outTime, label: label || `${inTime} - ${outTime}` };
    } else if (type === 'day-off') {
      newShift = { type: 'day-off', label: 'DAY-OFF' };
    } else if (type === 'holiday') {
      newShift = { type: 'holiday', label: label || 'HOLIDAY' };
    } else if (type === 'ot-rd') {
      newShift = { type: 'ot-rd', label: label || 'OT/RD' };
    } else {
      newShift = { type: 'shift', in: inTime, out: outTime };
    }

    updateMemberShiftConsistent({
      memberId,
      dayId,
      newShift,
      targetWeekKey: weekKey || currentWeekKey,
      syncGroupOnSameDay: syncSameDayShifts,
    });
  };

  // Apply custom in/out times from form inside palette
  const handleApplyCustomTimesForm = (e) => {
    if (e) e.preventDefault();
    if (!activeCellPopover) return;
    const { memberId, dayId, defaultIn, defaultOut, weekKey } = activeCellPopover;

    const inTime = (popoverInTime || defaultIn || '9:00 PM').trim();
    const outTime = (popoverOutTime || defaultOut || '6:00 AM').trim();

    updateMemberShiftConsistent({
      memberId,
      dayId,
      newShift: { type: 'shift', in: inTime, out: outTime },
      targetWeekKey: weekKey || currentWeekKey,
      syncGroupOnSameDay: syncSameDayShifts,
    });
  };

  /* ============================================================
     DRAG AND DROP HANDLERS - ONLY EMPLOYEE NAMES MOVE
     ============================================================ */

  // Drop an employee name on another employee slot (swap names only, keep all schedule details intact)
  const handleDropOnMember = (targetMemberId, targetGroupId) => {
    if (!draggedMember || draggedMember.id === targetMemberId) {
      setDraggedMember(null);
      setDragOverMemberId(null);
      setDragOverGroupId(null);
      return;
    }

    const sourceMember = rosterGroups
      .flatMap((group) => group.members || [])
      .find((member) => member.id === draggedMember.id);
    const targetMember = rosterGroups
      .flatMap((group) => group.members || [])
      .find((member) => member.id === targetMemberId);
    if (!sourceMember || !targetMember) return;

    const targetWeekKey = draggedMember.weekKey || currentWeekKey;
    const weekData = { ...(weeksStore[targetWeekKey] || {}) };
    const names = { ...(weekData.__names || {}) };
    const sourceName = names[sourceMember.id] || sourceMember.name;
    const targetName = names[targetMember.id] || targetMember.name;
    names[sourceMember.id] = targetName;
    names[targetMember.id] = sourceName;
    weekData.__names = names;

    setWeeksStore((prevWeeks) => {
      const updatedWeeks = { ...prevWeeks, [targetWeekKey]: weekData };
      try {
        localStorage.setItem(STORAGE_WEEKS_KEY, JSON.stringify(updatedWeeks));
      } catch (e) {
        console.error('Failed to cache week-specific name swap:', e);
      }
      return updatedWeeks;
    });

    setHasUnsavedChanges(true);

    triggerToast(`🔄 Swapped name "${draggedMember.name}" with "${targetName}"! (Schedule details stayed in place)`);

    setDraggedMember(null);
    setDragOverMemberId(null);
    setDragOverGroupId(null);
  };

  // Drop employee into a Shift Group Header (swaps with the first slot in that shift group)
  const handleDropOnGroupHeader = (targetGroupId) => {
    if (!draggedMember || draggedMember.sourceGroupId === targetGroupId) {
      setDraggedMember(null);
      setDragOverMemberId(null);
      setDragOverGroupId(null);
      return;
    }

    const targetGroup = rosterGroups.find((g) => g.id === targetGroupId);
    if (!targetGroup) return;

    if (targetGroup.members && targetGroup.members.length > 0) {
      handleDropOnMember(targetGroup.members[0].id, targetGroupId);
    } else {
      setDraggedMember(null);
      setDragOverMemberId(null);
      setDragOverGroupId(null);
    }
  };

  // Rename agent
  const handleSaveRename = (e) => {
    if (e) e.preventDefault();
    if (!renamingMember) return;
    const clean = renameInput.trim().toUpperCase();
    if (!clean) {
      triggerToast('⚠️ Name cannot be empty.');
      return;
    }

    setRosterGroups((prevGroups) => {
      const updated = prevGroups.map((group) => {
        return {
          ...group,
          members: (group.members || []).map((m) => {
            if (m.id === renamingMember.id) {
              return { ...m, name: clean };
            }
            return m;
          }),
        };
      });

      try {
        localStorage.setItem(STORAGE_ROSTER_KEY, JSON.stringify(updated));
      } catch {}

      return updated;
    });

    setHasUnsavedChanges(true);
    triggerToast(`✏️ Renamed agent to "${clean}"! (Click "Save Schedule" to publish to team)`);
    setRenamingMember(null);
  };

  // Add agent
  const handleAddAgent = (e) => {
    if (e) e.preventDefault();
    const clean = newAgentName.trim().toUpperCase();
    if (!clean) {
      triggerToast('⚠️ Please enter an agent name.');
      return;
    }

    const newId = `member_${Date.now()}`;
    const targetGroup = rosterGroups.find((g) => g.id === newAgentGroupId);
    const inTime = targetGroup?.inTime || '9:00 PM';
    const outTime = targetGroup?.outTime || '6:00 AM';

    const defaultShifts = {
      mon: { type: 'shift', in: inTime, out: outTime },
      tue: { type: 'shift', in: inTime, out: outTime },
      wed: { type: 'shift', in: inTime, out: outTime },
      thu: { type: 'shift', in: inTime, out: outTime },
      fri: { type: 'shift', in: inTime, out: outTime },
      sat: { type: 'day-off' },
      sun: { type: 'day-off' },
    };

    setRosterGroups((prev) => {
      const updated = prev.map((g) => {
        if (g.id !== newAgentGroupId) return g;
        return {
          ...g,
          members: [...(g.members || []), { id: newId, name: clean, shifts: defaultShifts }],
        };
      });
      try {
        localStorage.setItem(STORAGE_ROSTER_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setHasUnsavedChanges(true);
    triggerToast(`✅ Added ${clean} to ${targetGroup?.name}!`);
    setNewAgentName('');
    setIsAddModalOpen(false);
  };

  // Remove agent
  const handleRemoveAgent = (groupId, memberId, memberName) => {
    if (window.confirm(`Are you sure you want to remove ${memberName} from the schedule?`)) {
      setRosterGroups((prev) => {
        const updated = prev.map((g) => {
          if (g.id !== groupId) return g;
          return {
            ...g,
            members: (g.members || []).filter((m) => m.id !== memberId),
          };
        });
        try {
          localStorage.setItem(STORAGE_ROSTER_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
      setHasUnsavedChanges(true);
      triggerToast(`🗑️ Removed ${memberName}.`);
    }
  };

  // Duplicate one week's pattern into another
  const handleCopyWeekToTarget = (sourceWeekKey, targetWeekKey) => {
    if (!sourceWeekKey || !targetWeekKey) return;

    const sourceWeekShifts = {};
    rosterGroups.forEach((g) => {
      (g.members || []).forEach((m) => {
        sourceWeekShifts[m.id] = {};
        ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach((dayId) => {
          sourceWeekShifts[m.id][dayId] = { ...getMemberShift(m, dayId, sourceWeekKey) };
        });
      });
    });

    setWeeksStore((prev) => {
      const updated = { ...prev, [targetWeekKey]: sourceWeekShifts };
      try {
        localStorage.setItem(STORAGE_WEEKS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setHasUnsavedChanges(true);
    triggerToast(`📋 Copied schedule pattern to week ${targetWeekKey}!`);
  };

  // Cloud Save Action
  const handleSaveToCloud = async () => {
    setIsSavingCloud(true);
    try {
      const author = myAgentName || currentUserName || 'Support';
      const res = await saveScheduleToCloud(rosterGroups, weeksStore, author);
      if (res.success) {
        setCloudMeta(res.meta);
        setHasUnsavedChanges(false);
        triggerToast(`☁️ Schedule saved & published to cloud! All team members using the site can now see this.`);
      } else {
        triggerToast(`⚠️ ${res.message || 'Error saving to cloud.'}`);
      }
    } catch (e) {
      console.error(e);
      triggerToast('⚠️ Failed to save to cloud.');
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Cloud Refresh Action
  const handleRefreshFromCloud = async () => {
    setIsLoadingCloud(true);
    try {
      const res = await fetchScheduleFromCloud();
      if (res.success) {
        if (res.rosterGroups && Array.isArray(res.rosterGroups) && res.rosterGroups.length > 0) {
          setRosterGroups(res.rosterGroups);
        }
        if (res.weeksStore && typeof res.weeksStore === 'object') {
          setWeeksStore(res.weeksStore);
        }
        if (res.meta) {
          setCloudMeta(res.meta);
        }
        setHasUnsavedChanges(false);
        triggerToast('🔄 Synced with latest schedule from cloud!');
      }
    } catch (e) {
      console.error(e);
      triggerToast('⚠️ Failed to fetch cloud updates.');
    } finally {
      setIsLoadingCloud(false);
    }
  };

  // Reset to Factory Default
  const handleResetToMasterRoster = () => {
    if (window.confirm('Reset the entire schedule back to default template?')) {
      try {
        localStorage.removeItem(STORAGE_ROSTER_KEY);
        localStorage.removeItem(STORAGE_WEEKS_KEY);
      } catch {}
      setRosterGroups(MASTER_SHIFT_GROUPS);
      setWeeksStore({});
      setHasUnsavedChanges(true);
      triggerToast('🔄 Reset schedule to default template.');
    }
  };

  // Filter roster by search & shift filter
  const filteredGroups = useMemo(() => {
    return rosterGroups
      .map((group) => {
        if (selectedShiftFilter !== 'all' && group.id !== selectedShiftFilter) {
          return null;
        }

        const filteredMembers = (group.members || []).filter((m) => {
          if (!searchQuery.trim()) return true;
          return m.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
        });

        return {
          ...group,
          members: filteredMembers,
        };
      })
      .filter(Boolean);
  }, [rosterGroups, searchQuery, selectedShiftFilter]);

  // Total metrics
  const allMembers = useMemo(() => {
    return rosterGroups.flatMap((g) => g.members || []);
  }, [rosterGroups]);

  const nightCount = rosterGroups.find((g) => g.id === 'night')?.members?.length || 0;
  const morningCount = rosterGroups.find((g) => g.id === 'morning')?.members?.length || 0;
  const afternoonCount = rosterGroups.find((g) => g.id === 'afternoon')?.members?.length || 0;

  /* ============================================================
     REUSABLE WEEKLY SHIFT MATRIX TABLE (Matches user spreadsheet)
     ============================================================ */
  const renderWeeklyTable = (days, weekKey, weekLabel = '') => {
    return (
      <div className="table-responsive-wrapper">
        <table className="schedule-matrix-table spreadsheet-styled" aria-label={`Schedule Matrix for ${weekLabel}`}>
          <thead>
            {/* Row 1: Day Numbers (Centered, large numbers as in screenshot) */}
            <tr className="table-header-day-numbers">
              <th rowSpan="3" className="col-names-header sticky-col">
                <div className="col-names-title">NAMES</div>
              </th>
              {days.map((day) => (
                <th
                  key={`num-${day.id}-${weekKey}`}
                  colSpan="2"
                  className={`col-day-num-th ${day.isHoliday ? 'day-holiday-header' : ''} ${highlightedDay === day.id ? 'day-highlighted' : ''}`}
                  onClick={() => setHighlightedDay(highlightedDay === day.id ? null : day.id)}
                  title={`Click to highlight ${day.fullDate}`}
                >
                  <span className="spreadsheet-day-number">{day.dayNum}</span>
                </th>
              ))}
            </tr>

            {/* Row 2: Day Names (Monday, Tuesday...) */}
            <tr className="table-header-day-names">
              {days.map((day) => (
                <th
                  key={`name-${day.id}-${weekKey}`}
                  colSpan="2"
                  className={`col-day-name-th ${day.isHoliday ? 'day-holiday-header' : ''} ${highlightedDay === day.id ? 'day-highlighted' : ''}`}
                >
                  <span className="spreadsheet-day-name">{day.dayName}</span>
                  {day.isHoliday && <span className="spreadsheet-holiday-tag">HOLIDAY</span>}
                </th>
              ))}
            </tr>

            {/* Row 3: IN / OUT Subheaders */}
            <tr className="table-header-sub">
              {days.map((day) => (
                <React.Fragment key={`sub-${day.id}-${weekKey}`}>
                  <th className={`col-time-sub col-in ${highlightedDay === day.id ? 'day-highlighted' : ''}`}>IN</th>
                  <th className={`col-time-sub col-out ${highlightedDay === day.id ? 'day-highlighted' : ''}`}>OUT</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredGroups.length === 0 ? (
              <tr>
                <td colSpan="15" className="no-results-cell">
                  <i className="bi bi-search me-2"></i> No agents matched "{searchQuery}".
                </td>
              </tr>
            ) : (
              filteredGroups.map((group) => {
                const isGroupDropTarget = dragOverGroupId === group.id && draggedMember?.sourceGroupId !== group.id;

                return (
                  <React.Fragment key={`group-${group.id}-${weekKey}`}>
                    {/* Shift Group Header Row */}
                    <tr
                      className={`shift-group-header-row ${group.colorClass} ${isGroupDropTarget ? 'group-drop-active' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                        if (dragOverGroupId !== group.id) setDragOverGroupId(group.id);
                      }}
                      onDragLeave={() => {
                        if (dragOverGroupId === group.id) setDragOverGroupId(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleDropOnGroupHeader(group.id);
                      }}
                    >
                      <td colSpan="15">
                        <div className="shift-group-banner">
                          <div className="banner-left">
                            <i className={`bi ${group.icon} me-2`}></i>
                            <span className="group-name">{group.name.toUpperCase()}</span>
                            <span className="group-hours">({group.hours})</span>
                            {isGroupDropTarget && (
                              <span className="group-drop-indicator-badge">
                                <i className="bi bi-arrow-down-circle-fill me-1"></i> Drop here to move name into {group.name}
                              </span>
                            )}
                          </div>
                          <div className="banner-right">
                            <button
                              type="button"
                              className="btn-group-add-member"
                              onClick={() => {
                                setNewAgentGroupId(group.id);
                                setIsAddModalOpen(true);
                              }}
                              title={`Add agent to ${group.name}`}
                            >
                              <i className="bi bi-plus-circle me-1"></i> Add Agent
                            </button>
                            <span className="group-badge">{group.members.length} {group.members.length === 1 ? 'Agent' : 'Agents'}</span>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Member Rows with Name-Only Drag & Drop */}
                    {group.members.map((member) => {
                      const displayName = getMemberName(member, weekKey);
                      const isMe = myAgentName && displayName.toUpperCase() === myAgentName.toUpperCase();
                      const isBeingDragged = draggedMember?.id === member.id;
                      const isDragOverTarget = dragOverMemberId === member.id && draggedMember?.id !== member.id;

                      return (
                        <tr
                          key={`row-${member.id}-${weekKey}`}
                          className={`schedule-row ${group.colorClass} ${isMe ? 'is-my-row' : ''}`}
                          onDragOver={(e) => {
                            if (draggedMember && draggedMember.id !== member.id) {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                              if (dragOverMemberId !== member.id) setDragOverMemberId(member.id);
                            }
                          }}
                          onDragLeave={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget)) {
                              if (dragOverMemberId === member.id) setDragOverMemberId(null);
                            }
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDropOnMember(member.id, group.id);
                          }}
                        >
                          {/* Name Column - Only Name Moves */}
                          <td className={`member-name-cell sticky-col ${group.colorClass} ${isDragOverTarget ? 'is-name-drop-target' : ''}`}>
                            <div className="member-name-wrap">
                              <div
                                className={`draggable-name-badge ${isBeingDragged ? 'is-dragging-name' : ''} ${isDragOverTarget ? 'name-badge-target' : ''}`}
                                draggable={true}
                                onDragStart={(e) => {
                                  setDraggedMember({ id: member.id, name: displayName, sourceGroupId: group.id, weekKey });
                                  e.dataTransfer.setData('text/plain', member.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                  if (e.currentTarget) {
                                    e.dataTransfer.setDragImage(e.currentTarget, 24, 16);
                                  }
                                }}
                                onDragEnd={() => {
                                  setDraggedMember(null);
                                  setDragOverMemberId(null);
                                  setDragOverGroupId(null);
                                }}
                                title={`Drag ${displayName}'s name to move or swap names between schedule slots`}
                              >
                                <span className="drag-grip-handle" aria-hidden="true">
                                  <i className="bi bi-grip-vertical"></i>
                                </span>
                                <span className="member-avatar">{displayName.charAt(0)}</span>
                                <span className="member-name-text">{displayName}</span>
                                {isMe && <span className="my-row-badge" title="You">YOU</span>}
                              </div>

                              {isDragOverTarget && draggedMember && (
                                <span className="swap-name-indicator-chip" title="Drop here to swap employee names">
                                  <i className="bi bi-arrow-left-right me-1"></i>Swap Name
                                </span>
                              )}

                              <button
                                type="button"
                                className="btn-rename-member"
                                onClick={() => {
                                  setRenamingMember({ id: member.id, currentName: displayName });
                                  setRenameInput(displayName);
                                }}
                                title={`Rename ${displayName}`}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>

                              {isEditMode && (
                                <button
                                  type="button"
                                  className="btn-remove-member-row"
                                  onClick={() => handleRemoveAgent(group.id, member.id, displayName)}
                                  title={`Remove ${displayName} from schedule`}
                                >
                                  <i className="bi bi-trash3"></i>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* 7 Days of In / Out Cells */}
                          {days.map((day) => {
                            const shiftInfo = getMemberShift(member, day.id, weekKey);
                            const isDayHighlighted = highlightedDay === day.id;
                            const shiftColorClass = getShiftColorClass(shiftInfo, group.colorClass);

                            if (shiftInfo.type === 'shift') {
                              return (
                                <React.Fragment key={`cell-${member.id}-${day.id}-${weekKey}`}>
                                  <td
                                    className={`cell-shift-time cell-in cell-quick-clickable ${shiftColorClass} ${isDayHighlighted ? 'col-highlighted' : ''}`}
                                    onClick={() => setActiveCellPopover({
                                      memberId: member.id,
                                      memberName: displayName,
                                      dayId: day.id,
                                      dayName: day.dayName,
                                      currentShift: shiftInfo,
                                      groupHours: group.hours,
                                      defaultIn: group.inTime,
                                      defaultOut: group.outTime,
                                      groupId: group.id,
                                      groupName: group.name,
                                      weekKey,
                                    })}
                                    title={`Click to change shift for ${displayName} on ${day.dayName}`}
                                  >
                                    <span className="time-badge">{shiftInfo.in}</span>
                                    <i className="bi bi-chevron-down cell-tap-icon"></i>
                                  </td>
                                  <td
                                    className={`cell-shift-time cell-out cell-quick-clickable ${shiftColorClass} ${isDayHighlighted ? 'col-highlighted' : ''}`}
                                    onClick={() => setActiveCellPopover({
                                      memberId: member.id,
                                      memberName: displayName,
                                      dayId: day.id,
                                      dayName: day.dayName,
                                      currentShift: shiftInfo,
                                      groupHours: group.hours,
                                      defaultIn: group.inTime,
                                      defaultOut: group.outTime,
                                      groupId: group.id,
                                      groupName: group.name,
                                      weekKey,
                                    })}
                                    title={`Click to change shift for ${displayName} on ${day.dayName}`}
                                  >
                                    <span className="time-badge">{shiftInfo.out}</span>
                                    <i className="bi bi-chevron-down cell-tap-icon"></i>
                                  </td>
                                </React.Fragment>
                              );
                            }

                            if (shiftInfo.type === 'day-off') {
                              return (
                                <td
                                  key={`cell-${member.id}-${day.id}-${weekKey}`}
                                  colSpan="2"
                                  className={`cell-status cell-day-off cell-quick-clickable ${isDayHighlighted ? 'col-highlighted' : ''}`}
                                  onClick={() => setActiveCellPopover({
                                    memberId: member.id,
                                    memberName: displayName,
                                    dayId: day.id,
                                    dayName: day.dayName,
                                    currentShift: shiftInfo,
                                    groupHours: group.hours,
                                    defaultIn: group.inTime,
                                    defaultOut: group.outTime,
                                    groupId: group.id,
                                    groupName: group.name,
                                    weekKey,
                                  })}
                                  title={`Click to change shift for ${displayName} (${day.dayName} - DAY-OFF)`}
                                >
                                  <span className="status-pill status-pill-dayoff">{shiftInfo.label || 'DAY-OFF'}</span>
                                  <i className="bi bi-chevron-down cell-tap-icon"></i>
                                </td>
                              );
                            }

                            if (shiftInfo.type === 'holiday') {
                              return (
                                <td
                                  key={`cell-${member.id}-${day.id}-${weekKey}`}
                                  colSpan="2"
                                  className={`cell-status cell-holiday cell-quick-clickable ${isDayHighlighted ? 'col-highlighted' : ''}`}
                                  onClick={() => setActiveCellPopover({
                                    memberId: member.id,
                                    memberName: displayName,
                                    dayId: day.id,
                                    dayName: day.dayName,
                                    currentShift: shiftInfo,
                                    groupHours: group.hours,
                                    defaultIn: group.inTime,
                                    defaultOut: group.outTime,
                                    groupId: group.id,
                                    groupName: group.name,
                                    weekKey,
                                  })}
                                  title={`Click to change shift for ${displayName} (${day.dayName} - HOLIDAY)`}
                                >
                                  <span className="status-pill status-pill-holiday">{shiftInfo.label || 'HOLIDAY'}</span>
                                  <i className="bi bi-chevron-down cell-tap-icon"></i>
                                </td>
                              );
                            }

                            if (shiftInfo.type === 'ot-rd') {
                              return (
                                <td
                                  key={`cell-${member.id}-${day.id}-${weekKey}`}
                                  colSpan="2"
                                  className={`cell-status cell-ot-rd cell-quick-clickable ${isDayHighlighted ? 'col-highlighted' : ''}`}
                                  onClick={() => setActiveCellPopover({
                                    memberId: member.id,
                                    memberName: displayName,
                                    dayId: day.id,
                                    dayName: day.dayName,
                                    currentShift: shiftInfo,
                                    groupHours: group.hours,
                                    defaultIn: group.inTime,
                                    defaultOut: group.outTime,
                                    groupId: group.id,
                                    groupName: group.name,
                                    weekKey,
                                  })}
                                  title={`Click to change shift for ${displayName} (${day.dayName} - OT/RD)`}
                                >
                                  <span className="status-pill status-pill-otrd">{shiftInfo.label || 'OT/RD'}</span>
                                  <i className="bi bi-chevron-down cell-tap-icon"></i>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={`cell-${member.id}-${day.id}-${weekKey}`}
                                colSpan="2"
                                className={`cell-status cell-quick-clickable ${isDayHighlighted ? 'col-highlighted' : ''}`}
                                onClick={() => setActiveCellPopover({
                                  memberId: member.id,
                                  memberName: displayName,
                                  dayId: day.id,
                                  dayName: day.dayName,
                                  currentShift: shiftInfo,
                                  groupHours: group.hours,
                                  defaultIn: group.inTime,
                                  defaultOut: group.outTime,
                                  groupId: group.id,
                                  groupName: group.name,
                                  weekKey,
                                })}
                                title={`Click to change shift for ${displayName} (${day.dayName})`}
                              >
                                <span className="status-pill status-pill-custom">{shiftInfo.label || 'CUSTOM'}</span>
                                <i className="bi bi-chevron-down cell-tap-icon"></i>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="schedule-plotting-container animate__animated animate__fadeIn">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="schedule-toast-notification">
          <i className="bi bi-info-circle-fill me-2"></i> {toastMsg}
        </div>
      )}

      {/* Top Header Card */}
      <div className="schedule-page-header-card">
        <div className="header-left">
          <div className="header-icon-box">
            <i className="bi bi-calendar-check-fill"></i>
          </div>
          <div>
            <h1 className="schedule-page-title">Team Shift Schedule Planner</h1>
            <p className="schedule-page-subtitle">
              Live interactive monthly & weekly shift plotting with cloud persistence and drag-and-drop name assignment
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className={`btn-schedule-action ${isEditMode ? 'active' : ''}`}
            onClick={() => setIsEditMode((prev) => !prev)}
            title="Toggle Roster Editing Mode"
          >
            <i className={`bi ${isEditMode ? 'bi-check2-circle' : 'bi-pencil-square'} me-1`}></i>
            {isEditMode ? 'Done Editing' : 'Edit Roster'}
          </button>

          <button
            type="button"
            className="btn-schedule-action"
            onClick={handleResetToMasterRoster}
            title="Reset to default template"
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i> Reset
          </button>

          {onBackToDashboard && (
            <button
              type="button"
              className="btn-schedule-action primary"
              onClick={onBackToDashboard}
              title="Return to main ticketing dashboard"
            >
              <i className="bi bi-speedometer2 me-1"></i> Dashboard
            </button>
          )}
        </div>
      </div>

      {/* ============================================================
          MONTH SELECTION BAR (Matching user spreadsheet tabs)
          ============================================================ */}
      <div className="schedule-month-tabs-bar">
        <div className="month-tabs-header-label">
          <i className="bi bi-calendar3 me-1"></i> SELECT MONTH:
        </div>
        <div className="month-tabs-scroll">
          {MONTH_NAMES.map((name, idx) => {
            const isActive = selectedMonthIndex === idx;
            return (
              <button
                key={name}
                type="button"
                className={`month-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMonthIndex(idx);
                  const firstDay = new Date(selectedYear, idx, 1);
                  setSelectedMonday(getMonday(firstDay));
                  setActiveCellPopover(null);
                }}
              >
                {name.toUpperCase()}
              </button>
            );
          })}
        </div>

        <div className="month-year-select-wrap">
          <label htmlFor="schedule-year-select" className="visually-hidden">Year</label>
          <select
            id="schedule-year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="schedule-year-select"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
            <option value={2028}>2028</option>
          </select>
        </div>
      </div>

      {/* ============================================================
          SAVE & CLOUD PERSISTENCE ACTION BAR
          ============================================================ */}
      <div className="schedule-save-publish-bar">
        <div className="save-bar-left">
          {/* Prominent Save Button */}
          <button
            type="button"
            className={`btn-save-cloud-schedule ${isSavingCloud ? 'is-saving' : ''} ${hasUnsavedChanges ? 'has-unsaved' : ''}`}
            onClick={handleSaveToCloud}
            disabled={isSavingCloud}
            title="Save schedule to cloud so all team members using the site can see it"
          >
            {isSavingCloud ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Saving to Cloud...
              </>
            ) : (
              <>
                <i className="bi bi-cloud-arrow-up-fill me-2"></i>
                <strong>Save Schedule</strong>
                {hasUnsavedChanges && <span className="unsaved-badge-dot" title="Unsaved changes"></span>}
              </>
            )}
          </button>

          {/* Refresh Cloud Button */}
          <button
            type="button"
            className="btn-refresh-cloud-schedule"
            onClick={handleRefreshFromCloud}
            disabled={isLoadingCloud || isSavingCloud}
            title="Pull latest schedule saved by other team members"
          >
            <i className={`bi bi-arrow-clockwise me-1 ${isLoadingCloud ? 'spin-icon' : ''}`}></i>
            Refresh Cloud
          </button>

          {/* Cloud Sync Status Pill */}
          <div className="cloud-sync-status-badge">
            <span className={`sync-pulse-dot ${hasUnsavedChanges ? 'is-unsaved' : 'is-synced'}`}></span>
            <div className="sync-text-wrap">
              {hasUnsavedChanges ? (
                <span className="sync-status-warning">
                  <strong>Unsaved Changes</strong> — Click "Save Schedule" to publish to team
                </span>
              ) : cloudMeta.updatedAt ? (
                <>
                  <span className="sync-status-ok">Saved to Cloud · Visible to Everyone</span>
                  <span className="sync-subtext">
                    Last saved by <strong>{cloudMeta.updatedBy || 'Team'}</strong> on {new Date(cloudMeta.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(cloudMeta.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </>
              ) : (
                <span className="sync-status-neutral">Ready to Save · Local & Cloud Connected</span>
              )}
            </div>
          </div>
        </div>

        <div className="save-bar-right">
          {/* View Mode Toggle: Whole Month View (Stacked Weeks) vs Single Week Focus */}
          <div className="view-mode-pill-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
              title="View the whole month with all consecutive weeks stacked (Spreadsheet style)"
            >
              <i className="bi bi-calendar3-range me-1"></i> Whole Month View
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
              title="Focus on a single week"
            >
              <i className="bi bi-calendar-week me-1"></i> Single Week Focus
            </button>
          </div>
        </div>
      </div>

      {/* Drag & Drop Notice Banner */}
      <div className="schedule-drag-notice-bar">
        <div className="drag-notice-content">
          <i className="bi bi-arrows-move me-2 text-accent"></i>
          <span>
            <strong>Drag-and-Drop Active:</strong> Drag an employee's name to swap names between slots. All shift hours, days off, and schedule details stay firmly in their slots.
          </span>
        </div>
        <span className="drag-notice-hint">
          <i className="bi bi-shield-check me-1"></i> Only names move — schedule hours and days off never move with the name
        </span>
      </div>

      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="schedule-edit-mode-banner">
          <div className="edit-banner-left">
            <i className="bi bi-pencil-fill me-2"></i>
            <span>
              <strong>Roster Editing Mode:</strong> Click the pencil next to any name to rename agents. Click any shift cell for instant 1-click shift switching.
            </span>
          </div>
          <div className="edit-banner-right">
            <button
              type="button"
              className="btn-add-agent-banner"
              onClick={() => setIsAddModalOpen(true)}
            >
              <i className="bi bi-person-plus-fill me-1"></i> + Add Agent
            </button>
            <button
              type="button"
              className="btn-done-editing"
              onClick={() => setIsEditMode(false)}
            >
              Finish Editing
            </button>
          </div>
        </div>
      )}

      {/* Quick Shift Summary Cards */}
      <div className="schedule-stats-row">
        <div className="schedule-stat-card total-card">
          <div className="stat-icon-wrap total">
            <i className="bi bi-people-fill"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">TOTAL TEAM MEMBERS</span>
            <span className="stat-value">{allMembers.length} Agents</span>
            <span className="stat-note">3 Shift Groups Active</span>
          </div>
        </div>

        <div className="schedule-stat-card night-card">
          <div className="stat-icon-wrap night">
            <i className="bi bi-moon-stars-fill"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">NIGHT SHIFT</span>
            <span className="stat-value">{nightCount} Agents</span>
            <span className="stat-note">9:00 PM – 6:00 AM</span>
          </div>
        </div>

        <div className="schedule-stat-card morning-card">
          <div className="stat-icon-wrap morning">
            <i className="bi bi-sun-fill"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">MORNING SHIFT</span>
            <span className="stat-value">{morningCount} Agents</span>
            <span className="stat-note">5:00 AM – 2:00 PM</span>
          </div>
        </div>

        <div className="schedule-stat-card afternoon-card">
          <div className="stat-icon-wrap afternoon">
            <i className="bi bi-sunset-fill"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">AFTERNOON SHIFT</span>
            <span className="stat-value">{afternoonCount} Agents</span>
            <span className="stat-note">2:00 PM – 11:00 PM</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="schedule-toolbar-card">
        <div className="toolbar-left">
          <div className="schedule-search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search agent name (e.g., Hanz, Ronie, Sean)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search agent"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                <i className="bi bi-x-circle-fill"></i>
              </button>
            )}
          </div>

          <div className="shift-filter-tabs">
            <button
              type="button"
              className={`shift-filter-btn ${selectedShiftFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedShiftFilter('all')}
            >
              All Shifts ({allMembers.length})
            </button>
            <button
              type="button"
              className={`shift-filter-btn shift-filter-night ${selectedShiftFilter === 'night' ? 'active' : ''}`}
              onClick={() => setSelectedShiftFilter('night')}
            >
              <i className="bi bi-moon-stars-fill me-1"></i> Night ({nightCount})
            </button>
            <button
              type="button"
              className={`shift-filter-btn shift-filter-morning ${selectedShiftFilter === 'morning' ? 'active' : ''}`}
              onClick={() => setSelectedShiftFilter('morning')}
            >
              <i className="bi bi-sun-fill me-1"></i> Morning ({morningCount})
            </button>
            <button
              type="button"
              className={`shift-filter-btn shift-filter-afternoon ${selectedShiftFilter === 'afternoon' ? 'active' : ''}`}
              onClick={() => setSelectedShiftFilter('afternoon')}
            >
              <i className="bi bi-sunset-fill me-1"></i> Afternoon ({afternoonCount})
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          {myAgentName ? (
            <div className="my-shift-indicator" title={`Showing highlights for ${myAgentName}`}>
              <i className="bi bi-person-check-fill me-1"></i> Logged in: <strong>{myAgentName}</strong>
            </div>
          ) : (
            <div className="my-name-prompt">
              <input
                type="text"
                placeholder="Highlight my name..."
                value={myAgentName}
                onChange={(e) => setMyAgentName(e.target.value)}
                className="my-name-input"
              />
            </div>
          )}
        </div>
      </div>

      {/* ============================================================
          MAIN CONTENT: WHOLE MONTH VIEW (Stacked Weeks) or SINGLE WEEK
          ============================================================ */}
      {viewMode === 'month' ? (
        <div className="whole-month-stacked-container">
          <div className="month-overview-banner">
            <div className="month-overview-left">
              <h2 className="month-overview-title">
                {MONTH_NAMES[selectedMonthIndex].toUpperCase()} {selectedYear} · FULL MONTH SCHEDULE
              </h2>
              <span className="month-overview-subtitle">
                {monthWeeks.length} Weekly Blocks Stacked Sequentially · Click any shift cell to edit · Drag names to swap
              </span>
            </div>
            <div className="month-overview-right">
              <span className="badge-month-weeks-count">{monthWeeks.length} Weeks</span>
            </div>
          </div>

          {monthWeeks.map((weekObj, idx) => (
            <div key={`month-week-block-${weekObj.weekKey}`} className="month-view-week-card">
              <div className="week-block-banner">
                <div className="week-block-banner-left">
                  <span className="week-block-badge">WEEK {idx + 1}</span>
                  <span className="week-block-range-text">
                    {MONTH_NAMES[selectedMonthIndex].toUpperCase()} {weekObj.days[0].dayNum} – {weekObj.days[6].dayNum}, {selectedYear}
                  </span>
                  <span className="week-block-subrange">
                    ({weekObj.days[0].monthName} {weekObj.days[0].dayNum} to {weekObj.days[6].monthName} {weekObj.days[6].dayNum})
                  </span>
                </div>
                <div className="week-block-banner-right">
                  {idx < monthWeeks.length - 1 && (
                    <button
                      type="button"
                      className="btn-week-copy-pattern"
                      onClick={() => handleCopyWeekToTarget(weekObj.weekKey, monthWeeks[idx + 1].weekKey)}
                      title={`Copy Week ${idx + 1} schedule to Week ${idx + 2}`}
                    >
                      <i className="bi bi-copy me-1"></i> Copy to Week {idx + 2}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-week-focus"
                    onClick={() => {
                      setSelectedMonday(weekObj.monday);
                      setViewMode('week');
                    }}
                    title="Focus on this week only"
                  >
                    <i className="bi bi-arrows-angle-expand me-1"></i> Focus Week
                  </button>
                </div>
              </div>

              {renderWeeklyTable(weekObj.days, weekObj.weekKey, `Week ${idx + 1}`)}
            </div>
          ))}
        </div>
      ) : (
        /* Single Week Focus View */
        <div className="single-week-container">
          <div className="schedule-table-card">
            <div className="week-navigation-toolbar">
              <button
                type="button"
                className="week-nav-step-btn"
                onClick={() => {
                  const prev = new Date(selectedMonday);
                  prev.setDate(selectedMonday.getDate() - 7);
                  setSelectedMonday(prev);
                }}
              >
                <i className="bi bi-chevron-left me-1"></i> Previous Week
              </button>
              <div className="week-nav-title">
                {currentWeekDays[0].fullDate} – {currentWeekDays[6].fullDate}
              </div>
              <button
                type="button"
                className="week-nav-step-btn"
                onClick={() => {
                  const next = new Date(selectedMonday);
                  next.setDate(selectedMonday.getDate() + 7);
                  setSelectedMonday(next);
                }}
              >
                Next Week <i className="bi bi-chevron-right ms-1"></i>
              </button>
            </div>

            {renderWeeklyTable(currentWeekDays, currentWeekKey, 'Single Week')}
          </div>
        </div>
      )}

      {/* ============================================================
          QUICK 1-CLICK SHIFT PALETTE POPOVER / MODAL
          ============================================================ */}
      {activeCellPopover && typeof document !== 'undefined' && createPortal(
        <div className="schedule-popover-overlay" onClick={() => setActiveCellPopover(null)}>
          <div className="schedule-popover-card animate__animated animate__zoomIn" onClick={(e) => e.stopPropagation()}>
            <div className="popover-header">
              <div className="popover-title-row">
                <span className="popover-agent-name">{activeCellPopover.memberName}</span>
                <span className="popover-day-badge">{activeCellPopover.dayName}</span>
              </div>
              <button
                type="button"
                className="popover-close-btn"
                onClick={() => setActiveCellPopover(null)}
                aria-label="Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="popover-current-status">
              Current: <strong>{activeCellPopover.currentShift?.type === 'shift' ? `${activeCellPopover.currentShift.in} – ${activeCellPopover.currentShift.out}` : (activeCellPopover.currentShift?.label || activeCellPopover.currentShift?.type?.toUpperCase() || 'SHIFT')}</strong>
            </div>

            {/* Same-Day Consistent Time Form */}
            <form onSubmit={handleApplyCustomTimesForm} className="palette-custom-time-form">
              <div className="palette-time-header">
                <i className="bi bi-clock-history me-1 text-accent"></i> Custom Shift Times (Selected Agent / Day)
              </div>
              <div className="palette-time-inputs-row">
                <div className="time-input-wrap">
                  <label htmlFor="palette-in-time">IN Time</label>
                  <input
                    id="palette-in-time"
                    type="text"
                    value={popoverInTime}
                    onChange={(e) => setPopoverInTime(e.target.value)}
                    placeholder="e.g. 9:00 PM"
                    className="palette-input-time"
                  />
                </div>
                <div className="time-input-wrap">
                  <label htmlFor="palette-out-time">OUT Time</label>
                  <input
                    id="palette-out-time"
                    type="text"
                    value={popoverOutTime}
                    onChange={(e) => setPopoverOutTime(e.target.value)}
                    placeholder="e.g. 6:00 AM"
                    className="palette-input-time"
                  />
                </div>
                <button type="submit" className="btn-apply-day-time">
                  <i className="bi bi-check-lg me-1"></i> Apply Times
                </button>
              </div>

              <div className="palette-sync-checkbox-wrap">
                <label className="palette-sync-checkbox-label">
                  <input
                    type="checkbox"
                    checked={syncSameDayShifts}
                    onChange={(e) => setSyncSameDayShifts(e.target.checked)}
                  />
                  <span>
                    Also apply these hours to other agents working on <strong>{activeCellPopover.dayName}</strong>
                  </span>
                </label>
              </div>
            </form>

            <div className="popover-presets-label">OR SELECT 1-CLICK PRESET:</div>
            <div className="popover-presets-grid">
              <button
                type="button"
                className="preset-btn preset-night"
                onClick={() => handleQuickShiftSelect('shift', '9:00 PM', '6:00 AM', '9:00 PM - 6:00 AM')}
              >
                <i className="bi bi-moon-stars-fill me-1"></i>
                <div className="preset-name">Night Shift</div>
                <div className="preset-time">9:00 PM – 6:00 AM</div>
              </button>

              <button
                type="button"
                className="preset-btn preset-morning"
                onClick={() => handleQuickShiftSelect('shift', '5:00 AM', '2:00 PM', '5:00 AM - 2:00 PM')}
              >
                <i className="bi bi-sun-fill me-1"></i>
                <div className="preset-name">Morning Shift</div>
                <div className="preset-time">5:00 AM – 2:00 PM</div>
              </button>

              <button
                type="button"
                className="preset-btn preset-afternoon"
                onClick={() => handleQuickShiftSelect('shift', '2:00 PM', '11:00 PM', '2:00 PM - 11:00 PM')}
              >
                <i className="bi bi-sunset-fill me-1"></i>
                <div className="preset-name">Afternoon Shift</div>
                <div className="preset-time">2:00 PM – 11:00 PM</div>
              </button>

              <button
                type="button"
                className="preset-btn preset-dayoff"
                onClick={() => handleQuickShiftSelect('day-off', null, null, 'DAY-OFF')}
              >
                <i className="bi bi-cup-hot-fill me-1"></i>
                <div className="preset-name">Day-Off</div>
                <div className="preset-time">Rest Day</div>
              </button>

              <button
                type="button"
                className="preset-btn preset-holiday"
                onClick={() => handleQuickShiftSelect('holiday', null, null, 'HOLIDAY')}
              >
                <i className="bi bi-flag-fill me-1"></i>
                <div className="preset-name">Holiday</div>
                <div className="preset-time">Official Holiday</div>
              </button>

              <button
                type="button"
                className="preset-btn preset-otrd"
                onClick={() => handleQuickShiftSelect('ot-rd', null, null, 'OT/RD')}
              >
                <i className="bi bi-clock-history me-1"></i>
                <div className="preset-name">OT / RD</div>
                <div className="preset-time">Overtime / Rest Day Duty</div>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Rename Agent Modal */}
      {renamingMember && (
        <div className="schedule-popover-overlay" onClick={() => setRenamingMember(null)}>
          <div className="schedule-popover-card animate__animated animate__zoomIn" onClick={(e) => e.stopPropagation()}>
            <div className="popover-header">
              <h3 className="popover-title">Rename Agent</h3>
              <button
                type="button"
                className="popover-close-btn"
                onClick={() => setRenamingMember(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleSaveRename} style={{ padding: '16px 20px 20px' }}>
              <div style={{ marginBottom: 14 }}>
                <label className="rename-label" htmlFor="agent-name-input">New Agent Name</label>
                <input
                  id="agent-name-input"
                  type="text"
                  className="rename-input"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  placeholder="e.g., ADI, HANZ, RONIE"
                  autoFocus
                  required
                />
              </div>
              <div className="rename-actions">
                <button
                  type="button"
                  className="btn-cancel-rename"
                  onClick={() => setRenamingMember(null)}
                >
                  <i className="bi bi-x me-1"></i> Cancel
                </button>
                <button type="submit" className="btn-confirm-rename">
                  <i className="bi bi-check-lg me-1"></i> Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Agent Modal */}
      {isAddModalOpen && (
        <div className="schedule-popover-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="schedule-popover-card animate__animated animate__zoomIn" onClick={(e) => e.stopPropagation()}>
            <div className="popover-header">
              <h3 className="popover-title">Add New Agent</h3>
              <button
                type="button"
                className="popover-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleAddAgent} style={{ padding: '16px 20px 20px' }}>
              <div style={{ marginBottom: 14 }}>
                <label className="rename-label" htmlFor="new-agent-name-input">Agent Name</label>
                <input
                  id="new-agent-name-input"
                  type="text"
                  className="rename-input"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g., CARLO"
                  autoFocus
                  required
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label className="rename-label" htmlFor="new-agent-group-select">Shift Group</label>
                <select
                  id="new-agent-group-select"
                  className="rename-input"
                  value={newAgentGroupId}
                  onChange={(e) => setNewAgentGroupId(e.target.value)}
                >
                  {rosterGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.hours})
                    </option>
                  ))}
                </select>
              </div>
              <div className="rename-actions">
                <button
                  type="button"
                  className="btn-cancel-rename"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  <i className="bi bi-x me-1"></i> Cancel
                </button>
                <button type="submit" className="btn-confirm-rename">
                  <i className="bi bi-person-plus-fill me-1"></i> Add Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
