// src/SchedulePlottingPage.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import appLogo from './logo2.png';

const STORAGE_ROSTER_KEY = 'team_schedule_roster_v2';
const STORAGE_WEEKS_KEY = 'team_schedule_weeks_v2';

// Standard 13-agent Master Roster from user spreadsheet (Nov 2-8, 2026)
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
          mon: { type: 'holiday', label: 'HOLIDAY' },
          tue: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          wed: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          thu: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          fri: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          sat: { type: 'day-off' },
          sun: { type: 'day-off' },
        },
      },
      {
        id: 'member_sean',
        name: 'SEAN',
        shifts: {
          mon: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          tue: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          wed: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          thu: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          fri: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          sat: { type: 'day-off' },
          sun: { type: 'ot-rd', label: 'OT/RD' },
        },
      },
      {
        id: 'member_charles',
        name: 'CHARLES',
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
        id: 'member_nics',
        name: 'NICS',
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
        id: 'member_yas',
        name: 'YAS',
        shifts: {
          mon: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          tue: { type: 'day-off' },
          wed: { type: 'day-off' },
          thu: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          fri: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          sat: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          sun: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
        },
      },
      {
        id: 'member_anthony',
        name: 'ANTHONY',
        shifts: {
          mon: { type: 'holiday', label: 'HOLIDAY' },
          tue: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          wed: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          thu: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          fri: { type: 'shift', in: '9:00 PM', out: '6:00 AM' },
          sat: { type: 'day-off' },
          sun: { type: 'day-off' },
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
        id: 'member_ronie',
        name: 'RONIE',
        shifts: {
          mon: { type: 'holiday', label: 'HOLIDAY' },
          tue: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          wed: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          thu: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          fri: { type: 'day-off' },
          sat: { type: 'day-off' },
          sun: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
        },
      },
      {
        id: 'member_gab',
        name: 'GAB',
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
        id: 'member_mat',
        name: 'MAT',
        shifts: {
          mon: { type: 'day-off' },
          tue: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          wed: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          thu: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          fri: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          sat: { type: 'shift', in: '5:00 AM', out: '2:00 PM' },
          sun: { type: 'day-off' },
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
        id: 'member_jr',
        name: 'JR',
        shifts: {
          mon: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          tue: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          wed: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          thu: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
          fri: { type: 'day-off' },
          sat: { type: 'day-off' },
          sun: { type: 'shift', in: '2:00 PM', out: '11:00 PM' },
        },
      },
      {
        id: 'member_zel',
        name: 'ZEL',
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
        id: 'member_ej',
        name: 'EJ',
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
  'July', 'August', 'September', 'October', 'November', 'December'
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

export default function SchedulePlottingPage({ onBackToDashboard, currentUserName = '' }) {
  // Navigation State: default to November 2, 2026 (the master schedule)
  const [selectedMonday, setSelectedMonday] = useState(() => {
    return new Date(2026, 10, 2, 0, 0, 0);
  });

  // Base roster groups (agent names, IDs, shift groupings)
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

  // Current days of selected week
  const currentDays = useMemo(() => {
    return generateWeekDays(selectedMonday);
  }, [selectedMonday]);

  const currentWeekKey = useMemo(() => {
    return toDateISO(selectedMonday);
  }, [selectedMonday]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('all');
  const [highlightedDay, setHighlightedDay] = useState(null);
  const [myAgentName, setMyAgentName] = useState(() => {
    return (currentUserName || localStorage.getItem('user_name_creditcard') || '').trim();
  });
  const [toastMsg, setToastMsg] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Drag and Drop state
  const [draggedMember, setDraggedMember] = useState(null); // { id, name, sourceGroupId }
  const [dragOverMemberId, setDragOverMemberId] = useState(null);
  const [dragOverGroupId, setDragOverGroupId] = useState(null);

  // Quick Shift Popover / Modal state
  const [activeCellPopover, setActiveCellPopover] = useState(null);
  // { memberId, memberName, dayId, dayName, currentShift, groupHours, defaultIn, defaultOut, groupId }
  const [popoverInTime, setPopoverInTime] = useState('');
  const [popoverOutTime, setPopoverOutTime] = useState('');
  const [syncSameDayShifts, setSyncSameDayShifts] = useState(true);

  // Rename Agent state
  const [renamingMember, setRenamingMember] = useState(null); // { id, currentName }
  const [renameInput, setRenameInput] = useState('');

  // Add Member Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentGroupId, setNewAgentGroupId] = useState('night');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Synchronize popover inputs whenever active cell changes
  useEffect(() => {
    if (activeCellPopover) {
      const s = activeCellPopover.currentShift || {};
      setPopoverInTime(s.in || activeCellPopover.defaultIn || '9:00 PM');
      setPopoverOutTime(s.out || activeCellPopover.defaultOut || '6:00 AM');
      setSyncSameDayShifts(true);
    }
  }, [activeCellPopover]);

  // Get current active shift for an agent on a specific day
  const getMemberShift = (member, dayId) => {
    const weekData = weeksStore[currentWeekKey];
    if (weekData && weekData[member.id] && weekData[member.id][dayId]) {
      return weekData[member.id][dayId];
    }
    if (currentWeekKey === '2026-11-02' && member.shifts && member.shifts[dayId]) {
      return member.shifts[dayId];
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

  /**
   * Update shift and guarantee consistent clock-in / clock-out times for that SAME DAY.
   * Only updates the target date (dayId) without modifying other dates in the week or year.
   */
  const updateMemberShiftConsistent = ({
    memberId,
    dayId,
    newShift,
    syncGroupOnSameDay = true,
    applyToAllDays = false,
  }) => {
    setWeeksStore((prev) => {
      const currentWeekData = { ...(prev[currentWeekKey] || {}) };

      // 1. If applying across all days for this single agent
      if (applyToAllDays) {
        const memberShifts = { ...(currentWeekData[memberId] || {}) };
        ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach((d) => {
          memberShifts[d] = { ...newShift };
        });
        currentWeekData[memberId] = memberShifts;
      } else {
        // 2. Target specific day
        const memberShifts = { ...(currentWeekData[memberId] || {}) };
        memberShifts[dayId] = { ...newShift };
        currentWeekData[memberId] = memberShifts;

        // 3. Keep clock-in and clock-out times consistent for that same day across corresponding working agents
        if (syncGroupOnSameDay && newShift.type === 'shift') {
          // Find which group this member belongs to
          const group = rosterGroups.find((g) => (g.members || []).some((m) => m.id === memberId));
          if (group) {
            (group.members || []).forEach((m) => {
              const currentMShift = getMemberShift(m, dayId);
              // Only update working shifts on this same day so Day-off / Holidays remain intact
              if (currentMShift.type === 'shift' || m.id === memberId) {
                const existingShifts = { ...(currentWeekData[m.id] || {}) };
                existingShifts[dayId] = {
                  ...currentMShift,
                  type: 'shift',
                  in: newShift.in,
                  out: newShift.out,
                };
                currentWeekData[m.id] = existingShifts;
              }
            });
          }
        }
      }

      const updatedWeeks = { ...prev, [currentWeekKey]: currentWeekData };
      try {
        localStorage.setItem(STORAGE_WEEKS_KEY, JSON.stringify(updatedWeeks));
      } catch {}

      return updatedWeeks;
    });

    const dayName = currentDays.find((d) => d.id === dayId)?.dayName || dayId.toUpperCase();
    if (newShift.type === 'shift' && syncGroupOnSameDay) {
      triggerToast(`🕒 ${dayName} shift times synchronized (${newShift.in} – ${newShift.out}) for all working agents on this date!`);
    } else {
      triggerToast(`✅ Updated shift for ${dayName}!`);
    }

    setActiveCellPopover(null);
  };

  // Quick 1-click preset select
  const handleQuickShiftSelect = (type, customIn, customOut, label) => {
    if (!activeCellPopover) return;
    const { memberId, dayId, defaultIn, defaultOut } = activeCellPopover;

    let inTime = customIn || popoverInTime || defaultIn || '9:00 PM';
    let outTime = customOut || popoverOutTime || defaultOut || '6:00 AM';

    let newShift = {};
    if (type === 'shift') {
      newShift = { type: 'shift', in: inTime, out: outTime };
    } else if (type === 'day-off') {
      newShift = { type: 'day-off', label: 'DAY-OFF' };
    } else if (type === 'holiday') {
      newShift = { type: 'holiday', label: label || 'HOLIDAY' };
    } else if (type === 'ot-rd') {
      newShift = { type: 'ot-rd', label: label || 'OT/RD' };
    } else {
      newShift = { type: 'custom', label: label || 'CUSTOM', in: inTime, out: outTime };
    }

    updateMemberShiftConsistent({
      memberId,
      dayId,
      newShift,
      syncGroupOnSameDay: syncSameDayShifts,
    });
  };

  // Custom Time Apply
  const handleApplyCustomTime = (e) => {
    if (e) e.preventDefault();
    if (!activeCellPopover) return;
    const { memberId, dayId } = activeCellPopover;

    const inTime = popoverInTime.trim() || '9:00 PM';
    const outTime = popoverOutTime.trim() || '6:00 AM';

    updateMemberShiftConsistent({
      memberId,
      dayId,
      newShift: { type: 'shift', in: inTime, out: outTime },
      syncGroupOnSameDay: syncSameDayShifts,
    });
  };

  /* ============================================================
     DRAG AND DROP HANDLERS FOR EMPLOYEE NAMES & SLOTS
     ============================================================ */

  // Drop an employee name on another employee slot (swap names only, keep all schedule details intact)
  const handleDropOnMember = (targetMemberId, targetGroupId) => {
    if (!draggedMember || draggedMember.id === targetMemberId) {
      setDraggedMember(null);
      setDragOverMemberId(null);
      setDragOverGroupId(null);
      return;
    }

    setRosterGroups((prevGroups) => {
      let sourceMember = null;
      let targetMember = null;

      // Locate both source member and target member across all groups
      for (const group of prevGroups) {
        for (const m of (group.members || [])) {
          if (m.id === draggedMember.id) sourceMember = m;
          if (m.id === targetMemberId) targetMember = m;
        }
      }

      if (!sourceMember || !targetMember) return prevGroups;

      const sourceName = sourceMember.name;
      const targetName = targetMember.name;

      // Swap ONLY the employee names between the two schedule slots.
      // Every single shift, in/out time, day-off, and holiday entry stays strictly in its schedule slot!
      const updatedGroups = prevGroups.map((group) => {
        return {
          ...group,
          members: (group.members || []).map((m) => {
            if (m.id === sourceMember.id) {
              return {
                ...m,
                name: targetName, // Slot A keeps all its shifts and schedule details, receives Slot B's name
              };
            }
            if (m.id === targetMember.id) {
              return {
                ...m,
                name: sourceName, // Slot B keeps all its shifts and schedule details, receives Slot A's name
              };
            }
            return m;
          }),
        };
      });

      try {
        localStorage.setItem(STORAGE_ROSTER_KEY, JSON.stringify(updatedGroups));
      } catch {}

      return updatedGroups;
    });

    const targetMemberObj = rosterGroups
      .flatMap((g) => g.members || [])
      .find((m) => m.id === targetMemberId);

    const targetName = targetMemberObj?.name || 'slot';
    triggerToast(`🔄 Moved name "${draggedMember.name}" into ${targetName}'s slot! (Schedule details stayed in place)`);

    setDraggedMember(null);
    setDragOverMemberId(null);
    setDragOverGroupId(null);
  };

  // Drop employee into a Shift Group Header (swaps with the first slot in that shift group, preserving all schedule details)
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
      // Move name into target shift group by swapping with the first slot, preserving all schedule details
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

    triggerToast(`✏️ Renamed agent to "${clean}"!`);
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
      triggerToast(`🗑️ Removed ${memberName}.`);
    }
  };

  // Week navigation
  const handlePrevWeek = () => {
    const prevMon = new Date(selectedMonday);
    prevMon.setDate(selectedMonday.getDate() - 7);
    setSelectedMonday(prevMon);
    setActiveCellPopover(null);
  };

  const handleNextWeek = () => {
    const nextMon = new Date(selectedMonday);
    nextMon.setDate(selectedMonday.getDate() + 7);
    setSelectedMonday(nextMon);
    setActiveCellPopover(null);
  };

  const handleJumpToToday = () => {
    setSelectedMonday(getMonday(new Date()));
    setActiveCellPopover(null);
  };

  const handleJumpToMaster = () => {
    setSelectedMonday(new Date(2026, 10, 2, 0, 0, 0));
    setActiveCellPopover(null);
  };

  const handleSelectMonth = (monthIndex) => {
    const y = selectedMonday.getFullYear();
    const firstDay = new Date(y, monthIndex, 1);
    setSelectedMonday(getMonday(firstDay));
    setActiveCellPopover(null);
  };

  const handleSelectYear = (year) => {
    const m = selectedMonday.getMonth();
    const d = new Date(year, m, 1);
    setSelectedMonday(getMonday(d));
    setActiveCellPopover(null);
  };

  // Copy schedule to next week
  const handleCopyWeekToNext = () => {
    const nextMon = new Date(selectedMonday);
    nextMon.setDate(selectedMonday.getDate() + 7);
    const nextKey = toDateISO(nextMon);

    const currentWeekShifts = {};
    rosterGroups.forEach((g) => {
      (g.members || []).forEach((m) => {
        currentWeekShifts[m.id] = {};
        ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach((dayId) => {
          currentWeekShifts[m.id][dayId] = { ...getMemberShift(m, dayId) };
        });
      });
    });

    setWeeksStore((prev) => {
      const updated = { ...prev, [nextKey]: currentWeekShifts };
      try {
        localStorage.setItem(STORAGE_WEEKS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setSelectedMonday(nextMon);
    triggerToast(`📋 Schedule copied to week of ${nextKey}!`);
  };

  // Reset to Factory Master
  const handleResetToMasterRoster = () => {
    if (window.confirm('Reset the entire schedule and agent roster back to default November 2–8, 2026 spreadsheet?')) {
      try {
        localStorage.removeItem(STORAGE_ROSTER_KEY);
        localStorage.removeItem(STORAGE_WEEKS_KEY);
      } catch {}
      setRosterGroups(MASTER_SHIFT_GROUPS);
      setWeeksStore({});
      setSelectedMonday(new Date(2026, 10, 2, 0, 0, 0));
      triggerToast('🔄 Schedule restored to original Master spreadsheet.');
    }
  };

  // Flattened team members
  const allMembers = useMemo(() => {
    const list = [];
    rosterGroups.forEach((g) => {
      (g.members || []).forEach((m) => {
        list.push({ ...m, shiftGroupId: g.id, shiftName: g.name });
      });
    });
    return list;
  }, [rosterGroups]);

  // Filter groups and members
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    return rosterGroups.map((group) => {
      if (selectedShiftFilter !== 'all' && group.id !== selectedShiftFilter) {
        return { ...group, members: [] };
      }
      const filtered = (group.members || []).filter((m) => {
        if (!q) return true;
        return m.name.toUpperCase().includes(q);
      });
      return { ...group, members: filtered };
    }).filter((g) => g.members.length > 0);
  }, [rosterGroups, searchQuery, selectedShiftFilter]);

  // Export CSV
  const handleExportCSV = () => {
    let csv = `WEEK: ${currentDays[0].fullDate} TO ${currentDays[6].fullDate}\n`;
    csv += `SHIFT,NAME,${currentDays.map((d) => `"${d.dayNum} ${d.dayName} (IN)","${d.dayNum} ${d.dayName} (OUT)"`).join(',')}\n`;

    rosterGroups.forEach((group) => {
      (group.members || []).forEach((m) => {
        const row = [group.name, m.name];
        currentDays.forEach((d) => {
          const s = getMemberShift(m, d.id);
          if (s.type === 'shift') {
            row.push(`"${s.in}"`, `"${s.out}"`);
          } else if (s.type === 'day-off') {
            row.push('"DAY-OFF"', '"DAY-OFF"');
          } else if (s.type === 'holiday') {
            row.push(`"${s.label || 'HOLIDAY'}"`, `"${s.label || 'HOLIDAY'}"`);
          } else if (s.type === 'ot-rd') {
            row.push(`"${s.label || 'OT/RD'}"`, `"${s.label || 'OT/RD'}"`);
          } else {
            row.push(`"${s.label || 'CUSTOM'}"`, `"${s.out || ''}"`);
          }
        });
        csv += row.join(',') + '\n';
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Schedule_Plotting_${currentWeekKey}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast('📥 Schedule CSV downloaded!');
  };

  // Shift counts
  const nightCount = (rosterGroups.find((g) => g.id === 'night')?.members || []).length;
  const morningCount = (rosterGroups.find((g) => g.id === 'morning')?.members || []).length;
  const afternoonCount = (rosterGroups.find((g) => g.id === 'afternoon')?.members || []).length;

  const primaryMonth = currentDays[0].monthName.toUpperCase();
  const secondaryMonth = currentDays[6].monthName.toUpperCase();
  const monthBannerTitle = primaryMonth === secondaryMonth
    ? `${primaryMonth} ${currentDays[0].year}`
    : `${primaryMonth} / ${secondaryMonth} ${currentDays[6].year}`;

  return (
    <div className={`schedule-plotting-page ${isEditMode ? 'edit-mode-active' : ''}`}>
      {/* Toast */}
      {toastMsg && (
        <div className="schedule-toast" role="alert">
          <i className="bi bi-info-circle-fill me-2"></i> {toastMsg}
        </div>
      )}

      {/* Page Header */}
      <div className="schedule-page-header">
        <div>
          <div className="shift-kicker">
            <img src={appLogo} alt="CC Logo" className="shift-kicker-logo" />
            <span className="kicker-pill schedule-kicker-pill">
              <i className="bi bi-calendar3-range me-1" aria-hidden="true"></i> Annual Schedule & Drag-and-Drop Roster
            </span>
          </div>
          <h1>SCHEDULE PLOTTING</h1>
          <p className="panel-subtitle">
            Drag and drop employee names to move between shift slots. Changing a shift's time updates that day's corresponding entries consistently.
          </p>
        </div>

        <div className="schedule-header-actions">
          {/* Toggle Edit Mode */}
          <button
            type="button"
            className={`schedule-btn-toggle-edit ${isEditMode ? 'active' : ''}`}
            onClick={() => setIsEditMode(!isEditMode)}
            title={isEditMode ? "Exit editing mode" : "Toggle edit mode for adding/removing/renaming agents"}
          >
            <i className={`bi ${isEditMode ? 'bi-check2-circle' : 'bi-pencil-square'} me-1`}></i>
            {isEditMode ? 'Done Editing' : 'Edit Roster'}
          </button>

          {/* Copy Week to Next */}
          <button
            type="button"
            className="schedule-btn-secondary"
            onClick={handleCopyWeekToNext}
            title="Duplicate this week's shift schedule to the following week"
          >
            <i className="bi bi-arrow-right-circle me-1"></i> Copy to Next Week
          </button>

          {/* Reset to Master */}
          <button
            type="button"
            className="schedule-btn-secondary"
            onClick={handleResetToMasterRoster}
            title="Restore original November 2026 master roster"
          >
            <i className="bi bi-arrow-counterclockwise me-1"></i> Reset Master
          </button>

          {/* Export CSV */}
          <button
            type="button"
            className="schedule-btn-secondary"
            onClick={handleExportCSV}
            title="Download CSV for currently selected week"
          >
            <i className="bi bi-file-earmark-spreadsheet me-1"></i> Export CSV
          </button>

          {/* Print */}
          <button
            type="button"
            className="schedule-btn-secondary"
            onClick={() => window.print()}
            title="Print or Save as PDF"
          >
            <i className="bi bi-printer me-1"></i> Print
          </button>

          {/* Back to Dashboard */}
          <button
            type="button"
            className="announcement-back-btn"
            onClick={onBackToDashboard}
            title="Return to Ticketing Dashboard"
          >
            <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
          </button>
        </div>
      </div>

      {/* ============================================================
          YEAR-ROUND CALENDAR & MONTH JUMP NAVIGATOR
          ============================================================ */}
      <div className="schedule-calendar-navigator-card">
        {/* Month Pills Bar (Jan - Dec) */}
        <div className="navigator-month-bar">
          <div className="year-selector-wrap">
            <label htmlFor="nav-year-select" className="visually-hidden">Year:</label>
            <select
              id="nav-year-select"
              className="year-dropdown"
              value={selectedMonday.getFullYear()}
              onChange={(e) => handleSelectYear(Number(e.target.value))}
            >
              {[2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="month-pills-list">
            {MONTH_NAMES.map((mName, mIdx) => {
              const isCurrentSelected = currentDays.some((d) => d.monthIndex === mIdx);
              return (
                <button
                  key={mName}
                  type="button"
                  className={`month-pill-btn ${isCurrentSelected ? 'active' : ''}`}
                  onClick={() => handleSelectMonth(mIdx)}
                  title={`Jump to ${mName} ${selectedMonday.getFullYear()}`}
                >
                  {mName.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Week Stepper Controls */}
        <div className="navigator-week-controls">
          <button
            type="button"
            className="week-nav-btn"
            onClick={handlePrevWeek}
            title="Go to previous week"
          >
            <i className="bi bi-chevron-left me-1"></i> Prev Week
          </button>

          <div className="current-week-display">
            <span className="week-label-range">
              <i className="bi bi-calendar-event me-2 text-sky"></i>
              <strong>{currentDays[0].monthName} {currentDays[0].dayNum}</strong> – <strong>{currentDays[6].monthName} {currentDays[6].dayNum}, {currentDays[6].year}</strong>
            </span>
            <span className="week-key-tag">Week of {currentWeekKey}</span>
          </div>

          <button
            type="button"
            className="week-nav-btn"
            onClick={handleNextWeek}
            title="Go to next week"
          >
            Next Week <i className="bi bi-chevron-right ms-1"></i>
          </button>

          <div className="quick-jump-buttons">
            <button
              type="button"
              className="quick-jump-btn"
              onClick={handleJumpToMaster}
              title="Jump to original November 2–8, 2026 spreadsheet"
            >
              <i className="bi bi-pin-angle-fill me-1"></i> Nov 2–8 Master
            </button>
            <button
              type="button"
              className="quick-jump-btn"
              onClick={handleJumpToToday}
              title="Jump to current week today"
            >
              <i className="bi bi-calendar-check me-1"></i> Today
            </button>
          </div>
        </div>
      </div>

      {/* Drag & Drop Notice Banner */}
      <div className="schedule-drag-notice-bar">
        <div className="drag-notice-content">
          <i className="bi bi-arrows-move me-2 text-accent"></i>
          <span>
            <strong>Drag-and-Drop Active:</strong> Drag an employee's name to move or swap names between schedule slots. All shift hours, days off, and schedule details stay firmly in their slots.
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
          MAIN SCHEDULE MATRIX TABLE WITH DRAG AND DROP
          ============================================================ */}
      <div className="schedule-table-card">
        <div className="table-responsive-wrapper">
          <table className="schedule-matrix-table" aria-label="Team Shift Schedule Matrix">
            {/* Top Month Banner */}
            <thead>
              <tr className="table-header-month">
                <th colSpan="15" className="month-banner">
                  <div className="month-banner-content">
                    <span className="month-title">{monthBannerTitle}</span>
                    <span className="month-subtitle">
                      WEEKLY SHIFT PLOTTING · {currentDays[0].fullDate.toUpperCase()} TO {currentDays[6].fullDate.toUpperCase()}
                    </span>
                  </div>
                </th>
              </tr>

              {/* Day and Date Row */}
              <tr className="table-header-days">
                <th rowSpan="2" className="col-names-header sticky-col">
                  <div className="col-names-title">NAMES</div>
                </th>
                {currentDays.map((day) => (
                  <th
                    key={day.id}
                    colSpan="2"
                    className={`col-day-header ${day.isHoliday ? 'day-holiday-header' : ''} ${highlightedDay === day.id ? 'day-highlighted' : ''}`}
                    onClick={() => setHighlightedDay(highlightedDay === day.id ? null : day.id)}
                    title={`Click to toggle highlight for ${day.fullDate}`}
                  >
                    <div className="day-number-badge">{day.dayNum}</div>
                    <div className="day-name">{day.dayName}</div>
                    {day.isHoliday && <span className="holiday-indicator-dot">HOLIDAY</span>}
                  </th>
                ))}
              </tr>

              {/* Sub-Header: IN / OUT */}
              <tr className="table-header-sub">
                {currentDays.map((day) => (
                  <React.Fragment key={`${day.id}-sub`}>
                    <th className={`col-time-sub col-in ${highlightedDay === day.id ? 'day-highlighted' : ''}`}>IN</th>
                    <th className={`col-time-sub col-out ${highlightedDay === day.id ? 'day-highlighted' : ''}`}>OUT</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            {/* Matrix Body: Grouped by Shift with Drag & Drop */}
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
                    <React.Fragment key={group.id}>
                      {/* Shift Group Section Drop Zone */}
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
                                  <i className="bi bi-arrow-down-circle-fill me-1"></i> Drop here to move to {group.name}
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
                                title={`Add new agent to ${group.name}`}
                              >
                                <i className="bi bi-plus-circle me-1"></i> Add Agent
                              </button>
                              <span className="group-badge">{group.members.length} {group.members.length === 1 ? 'Agent' : 'Agents'}</span>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Member Rows with Drag-and-Drop */}
                      {group.members.map((member) => {
                        const isMe = myAgentName && member.name.toUpperCase() === myAgentName.toUpperCase();
                        const isBeingDragged = draggedMember?.id === member.id;
                        const isDragOverTarget = dragOverMemberId === member.id && draggedMember?.id !== member.id;

                        return (
                          <tr
                            key={member.id}
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
                            {/* Name Column with Draggable Name Badge & Rename Action - Only Name Moves */}
                            <td className={`member-name-cell sticky-col ${group.colorClass} ${isDragOverTarget ? 'is-name-drop-target' : ''}`}>
                              <div className="member-name-wrap">
                                {/* Only the Name Badge is Draggable */}
                                <div
                                  className={`draggable-name-badge ${isBeingDragged ? 'is-dragging-name' : ''} ${isDragOverTarget ? 'name-badge-target' : ''}`}
                                  draggable={true}
                                  onDragStart={(e) => {
                                    setDraggedMember({ id: member.id, name: member.name, sourceGroupId: group.id });
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
                                  title={`Drag ${member.name}'s name to move or swap names between schedule slots (schedule details stay intact)`}
                                >
                                  <span className="drag-grip-handle" aria-hidden="true">
                                    <i className="bi bi-grip-vertical"></i>
                                  </span>
                                  <span className="member-avatar">{member.name.charAt(0)}</span>
                                  <span className="member-name-text">{member.name}</span>
                                  {isMe && <span className="my-row-badge" title="You">YOU</span>}
                                </div>

                                {/* Swap Name Indicator when Dragging Over */}
                                {isDragOverTarget && draggedMember && (
                                  <span className="swap-name-indicator-chip" title="Drop here to swap employee names">
                                    <i className="bi bi-arrow-left-right me-1"></i>Swap Name
                                  </span>
                                )}

                                {/* Rename trigger button */}
                                <button
                                  type="button"
                                  className="btn-rename-member"
                                  onClick={() => {
                                    setRenamingMember({ id: member.id, currentName: member.name });
                                    setRenameInput(member.name);
                                  }}
                                  title={`Rename ${member.name}`}
                                >
                                  <i className="bi bi-pencil"></i>
                                </button>

                                {/* Remove trigger */}
                                {isEditMode && (
                                  <button
                                    type="button"
                                    className="btn-remove-member-row"
                                    onClick={() => handleRemoveAgent(group.id, member.id, member.name)}
                                    title={`Remove ${member.name} from schedule`}
                                  >
                                    <i className="bi bi-trash3"></i>
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* 7 Days of In/Out */}
                            {currentDays.map((day) => {
                              const shiftInfo = getMemberShift(member, day.id);
                              const isDayHighlighted = highlightedDay === day.id;

                              if (shiftInfo.type === 'shift') {
                                return (
                                  <React.Fragment key={`${member.id}-${day.id}`}>
                                    <td
                                      className={`cell-shift-time cell-in cell-quick-clickable ${group.colorClass} ${isDayHighlighted ? 'col-highlighted' : ''}`}
                                      onClick={() => setActiveCellPopover({
                                        memberId: member.id,
                                        memberName: member.name,
                                        dayId: day.id,
                                        dayName: day.dayName,
                                        currentShift: shiftInfo,
                                        groupHours: group.hours,
                                        defaultIn: group.inTime,
                                        defaultOut: group.outTime,
                                        groupId: group.id,
                                        groupName: group.name,
                                      })}
                                      title={`Click to change shift for ${member.name} on ${day.dayName}`}
                                    >
                                      <span className="time-badge">{shiftInfo.in}</span>
                                      <i className="bi bi-chevron-down cell-tap-icon"></i>
                                    </td>
                                    <td
                                      className={`cell-shift-time cell-out cell-quick-clickable ${group.colorClass} ${isDayHighlighted ? 'col-highlighted' : ''}`}
                                      onClick={() => setActiveCellPopover({
                                        memberId: member.id,
                                        memberName: member.name,
                                        dayId: day.id,
                                        dayName: day.dayName,
                                        currentShift: shiftInfo,
                                        groupHours: group.hours,
                                        defaultIn: group.inTime,
                                        defaultOut: group.outTime,
                                        groupId: group.id,
                                        groupName: group.name,
                                      })}
                                      title={`Click to change shift for ${member.name} on ${day.dayName}`}
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
                                    key={`${member.id}-${day.id}`}
                                    colSpan="2"
                                    className={`cell-status cell-day-off cell-quick-clickable ${isDayHighlighted ? 'col-highlighted' : ''}`}
                                    onClick={() => setActiveCellPopover({
                                      memberId: member.id,
                                      memberName: member.name,
                                      dayId: day.id,
                                      dayName: day.dayName,
                                      currentShift: shiftInfo,
                                      groupHours: group.hours,
                                      defaultIn: group.inTime,
                                      defaultOut: group.outTime,
                                      groupId: group.id,
                                      groupName: group.name,
                                    })}
                                    title={`Click to change shift for ${member.name} (${day.dayName} - DAY-OFF)`}
                                  >
                                    <span className="status-pill status-pill-dayoff">DAY-OFF</span>
                                    <i className="bi bi-chevron-down cell-tap-icon"></i>
                                  </td>
                                );
                              }

                              if (shiftInfo.type === 'holiday') {
                                return (
                                  <td
                                    key={`${member.id}-${day.id}`}
                                    colSpan="2"
                                    className={`cell-status cell-holiday cell-quick-clickable ${isDayHighlighted ? 'col-highlighted' : ''}`}
                                    onClick={() => setActiveCellPopover({
                                      memberId: member.id,
                                      memberName: member.name,
                                      dayId: day.id,
                                      dayName: day.dayName,
                                      currentShift: shiftInfo,
                                      groupHours: group.hours,
                                      defaultIn: group.inTime,
                                      defaultOut: group.outTime,
                                      groupId: group.id,
                                      groupName: group.name,
                                    })}
                                    title={`Click to change shift for ${member.name} (${day.dayName} - HOLIDAY)`}
                                  >
                                    <span className="status-pill status-pill-holiday">{shiftInfo.label || 'HOLIDAY'}</span>
                                    <i className="bi bi-chevron-down cell-tap-icon"></i>
                                  </td>
                                );
                              }

                              if (shiftInfo.type === 'ot-rd') {
                                return (
                                  <td
                                    key={`${member.id}-${day.id}`}
                                    colSpan="2"
                                    className={`cell-status cell-ot-rd cell-quick-clickable ${isDayHighlighted ? 'col-highlighted' : ''}`}
                                    onClick={() => setActiveCellPopover({
                                      memberId: member.id,
                                      memberName: member.name,
                                      dayId: day.id,
                                      dayName: day.dayName,
                                      currentShift: shiftInfo,
                                      groupHours: group.hours,
                                      defaultIn: group.inTime,
                                      defaultOut: group.outTime,
                                      groupId: group.id,
                                      groupName: group.name,
                                    })}
                                    title={`Click to change shift for ${member.name} (${day.dayName} - OT/RD)`}
                                  >
                                    <span className="status-pill status-pill-otrd">{shiftInfo.label || 'OT/RD'}</span>
                                    <i className="bi bi-chevron-down cell-tap-icon"></i>
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={`${member.id}-${day.id}`}
                                  colSpan="2"
                                  className={`cell-status cell-quick-clickable ${isDayHighlighted ? 'col-highlighted' : ''}`}
                                  onClick={() => setActiveCellPopover({
                                    memberId: member.id,
                                    memberName: member.name,
                                    dayId: day.id,
                                    dayName: day.dayName,
                                    currentShift: shiftInfo,
                                    groupHours: group.hours,
                                    defaultIn: group.inTime,
                                    defaultOut: group.outTime,
                                    groupId: group.id,
                                    groupName: group.name,
                                  })}
                                  title={`Click to change shift for ${member.name} (${day.dayName})`}
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
      </div>

      {/* Legend & Guide Bar */}
      <div className="schedule-legend-card">
        <div className="legend-title">
          <i className="bi bi-info-circle me-2"></i> LEGEND & QUICK SHORTCUTS
        </div>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-color-swatch swatch-night"></span>
            <span className="legend-label"><strong>Night Shift:</strong> 9:00 PM – 6:00 AM</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-swatch swatch-morning"></span>
            <span className="legend-label"><strong>Morning Shift:</strong> 5:00 AM – 2:00 PM</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-swatch swatch-afternoon"></span>
            <span className="legend-label"><strong>Afternoon Shift:</strong> 2:00 PM – 11:00 PM</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-swatch swatch-dayoff"></span>
            <span className="legend-label"><strong>DAY-OFF:</strong> Rest Day</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-swatch swatch-holiday"></span>
            <span className="legend-label"><strong>HOLIDAY:</strong> Recognized Holiday Off</span>
          </div>
          <div className="legend-item">
            <span className="legend-color-swatch swatch-otrd"></span>
            <span className="legend-label"><strong>OT/RD:</strong> Overtime / Rest Day Duty</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          FAST 1-CLICK SHIFT PALETTE WITH SAME-DAY TIME SYNC
          ============================================================ */}
      {activeCellPopover && (
        <div className="schedule-modal-backdrop" onClick={() => setActiveCellPopover(null)}>
          <div className="schedule-quick-palette-card" onClick={(e) => e.stopPropagation()}>
            <div className="palette-header">
              <div>
                <span className="palette-kicker">1-CLICK SHIFT SELECTOR & SAME-DAY TIME SYNC</span>
                <h4>{activeCellPopover.memberName} &bull; {activeCellPopover.dayName}</h4>
              </div>
              <button
                type="button"
                className="palette-close-btn"
                onClick={() => setActiveCellPopover(null)}
              >
                &times;
              </button>
            </div>

            {/* Quick 1-Click Status Palette */}
            <div className="palette-options-grid">
              <button
                type="button"
                className="palette-btn palette-btn-night"
                onClick={() => handleQuickShiftSelect('shift', '9:00 PM', '6:00 AM')}
              >
                <i className="bi bi-moon-stars-fill"></i>
                <div className="palette-btn-text">
                  <strong>Night Shift</strong>
                  <span>9:00 PM – 6:00 AM</span>
                </div>
              </button>

              <button
                type="button"
                className="palette-btn palette-btn-morning"
                onClick={() => handleQuickShiftSelect('shift', '5:00 AM', '2:00 PM')}
              >
                <i className="bi bi-sun-fill"></i>
                <div className="palette-btn-text">
                  <strong>Morning Shift</strong>
                  <span>5:00 AM – 2:00 PM</span>
                </div>
              </button>

              <button
                type="button"
                className="palette-btn palette-btn-afternoon"
                onClick={() => handleQuickShiftSelect('shift', '2:00 PM', '11:00 PM')}
              >
                <i className="bi bi-sunset-fill"></i>
                <div className="palette-btn-text">
                  <strong>Afternoon Shift</strong>
                  <span>2:00 PM – 11:00 PM</span>
                </div>
              </button>

              <button
                type="button"
                className="palette-btn palette-btn-dayoff"
                onClick={() => handleQuickShiftSelect('day-off')}
              >
                <i className="bi bi-cup-hot-fill"></i>
                <div className="palette-btn-text">
                  <strong>DAY-OFF</strong>
                  <span>Scheduled Rest Day</span>
                </div>
              </button>

              <button
                type="button"
                className="palette-btn palette-btn-holiday"
                onClick={() => handleQuickShiftSelect('holiday', '', '', 'HOLIDAY')}
              >
                <i className="bi bi-flag-fill"></i>
                <div className="palette-btn-text">
                  <strong>HOLIDAY</strong>
                  <span>Official Holiday Off</span>
                </div>
              </button>

              <button
                type="button"
                className="palette-btn palette-btn-otrd"
                onClick={() => handleQuickShiftSelect('ot-rd', '', '', 'OT/RD')}
              >
                <i className="bi bi-lightning-charge-fill"></i>
                <div className="palette-btn-text">
                  <strong>OT/RD</strong>
                  <span>Overtime / Rest Day Duty</span>
                </div>
              </button>
            </div>

            {/* Same-Day Clock-In & Clock-Out Custom Time Adjustment */}
            <form onSubmit={handleApplyCustomTime} className="palette-custom-time-form">
              <div className="palette-time-header">
                <i className="bi bi-clock-history me-1 text-sky"></i>
                <span>Custom Clock-In / Clock-Out for {activeCellPopover.dayName}:</span>
              </div>

              <div className="palette-time-inputs-row">
                <div className="time-input-wrap">
                  <label htmlFor="popover-in-time">IN Time:</label>
                  <input
                    id="popover-in-time"
                    type="text"
                    value={popoverInTime}
                    onChange={(e) => setPopoverInTime(e.target.value)}
                    placeholder="e.g. 9:00 PM"
                    className="palette-input-time"
                  />
                </div>
                <div className="time-input-wrap">
                  <label htmlFor="popover-out-time">OUT Time:</label>
                  <input
                    id="popover-out-time"
                    type="text"
                    value={popoverOutTime}
                    onChange={(e) => setPopoverOutTime(e.target.value)}
                    placeholder="e.g. 6:00 AM"
                    className="palette-input-time"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-apply-day-time"
                  title={`Apply this time to ${activeCellPopover.dayName}`}
                >
                  Apply Time
                </button>
              </div>

              {/* Consistency Checkbox: Syncs all agents on this shift on this day without touching other dates */}
              <div className="palette-sync-checkbox-wrap">
                <label className="palette-sync-checkbox-label">
                  <input
                    type="checkbox"
                    checked={syncSameDayShifts}
                    onChange={(e) => setSyncSameDayShifts(e.target.checked)}
                  />
                  <span>
                    Keep clock-in & clock-out times <strong>consistent for all {activeCellPopover.groupName || 'working'} agents</strong> on <strong>{activeCellPopover.dayName}</strong> (without affecting other dates)
                  </span>
                </label>
              </div>
            </form>

            {/* Bulk / Fill week shortcuts */}
            <div className="palette-footer-actions">
              <button
                type="button"
                className="btn-fill-whole-week"
                onClick={() => {
                  const current = activeCellPopover.currentShift || { type: 'shift', in: popoverInTime, out: popoverOutTime };
                  updateMemberShiftConsistent({
                    memberId: activeCellPopover.memberId,
                    dayId: activeCellPopover.dayId,
                    newShift: current,
                    syncGroupOnSameDay: false,
                    applyToAllDays: true,
                  });
                }}
              >
                <i className="bi bi-arrows-expand me-1"></i> Copy this status to all 7 days for {activeCellPopover.memberName}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: RENAME AGENT
          ============================================================ */}
      {renamingMember && (
        <div className="schedule-modal-backdrop" onClick={() => setRenamingMember(null)}>
          <div className="schedule-modal-card schedule-rename-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-compact">
              <div className="modal-title-wrap">
                <i className="bi bi-person-gear modal-title-icon"></i>
                <div>
                  <h3>Rename Team Member</h3>
                  <p className="modal-subtitle">Current name: <strong>{renamingMember.currentName}</strong></p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setRenamingMember(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveRename} className="modal-form-body">
              <div className="input-group-field">
                <label className="input-group-label" htmlFor="rename-input-box">New Name:</label>
                <input
                  id="rename-input-box"
                  type="text"
                  className="modal-input-field"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setRenamingMember(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-save"
                >
                  <i className="bi bi-check2 me-1"></i> Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: ADD NEW AGENT
          ============================================================ */}
      {isAddModalOpen && (
        <div className="schedule-modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="schedule-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-compact">
              <div className="modal-title-wrap">
                <i className="bi bi-person-plus-fill modal-title-icon"></i>
                <div>
                  <h3>Add Team Member</h3>
                  <p className="modal-subtitle">Add a new agent to your schedule roster.</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddAgent} className="modal-form-body">
              <div className="input-group-field">
                <label className="input-group-label" htmlFor="add-name-input">Agent Name:</label>
                <input
                  id="add-name-input"
                  type="text"
                  className="modal-input-field"
                  placeholder="e.g. KENNETH"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="input-group-field">
                <label className="input-group-label" htmlFor="add-group-select">Assigned Shift Group:</label>
                <select
                  id="add-group-select"
                  className="modal-select-field"
                  value={newAgentGroupId}
                  onChange={(e) => setNewAgentGroupId(e.target.value)}
                >
                  {rosterGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} ({g.hours})</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-save"
                >
                  <i className="bi bi-person-check-fill me-1"></i> Add to Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
