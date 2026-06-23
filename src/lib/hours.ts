
export interface StatusResult {
  isOpen: boolean;
  known: boolean; // false when no hours are on file — show "Hours not listed", never "Closed"
  text: string;
  todayHours: string;
}

export function getStatus(hours: Record<string, string> | undefined, timezone?: string): StatusResult {
  // No hours on file is NOT the same as closed. Showing "Closed" on a listing
  // whose owner simply hasn't entered hours is misleading (and a support ticket).
  if (!hours || Object.keys(hours).length === 0) {
    return { isOpen: false, known: false, text: 'Hours not listed', todayHours: '' };
  }

  // Use provided timezone or fall back to Toronto. The platform is Canada-only,
  // so an unknown timezone should default to Eastern Canada, not the US.
  const tz = timezone || 'America/Toronto';
  
  // Get current time in correct timezone
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  const todayHours = hours[today];
  
  if (!todayHours || typeof todayHours !== 'string' || todayHours.toLowerCase() === 'closed') {
    return { isOpen: false, known: true, text: 'Closed', todayHours: 'Closed' };
  }
  
  try {
    // Hours come from several sources in different formats: "9AM-5PM",
    // "9:00 AM to 8:00 PM", "10AM–7PM" (en-dash). Split on any of them, else a
    // "to"-separated range silently fell through to isOpen:true (the Tri-Health bug).
    const parts = todayHours.split(/\s+to\s+|\s*[‒–—-]\s*/i).filter(Boolean);
    if (parts.length < 2) {
      // A single token that is a real time / "open" / "24 hours" means open all
      // day. Free text like "By appointment" is NOT a status — show "Hours not
      // listed" instead of a misleading "Open now" (the Diamond Aesthetics case).
      const looksOpen = /\d\s*(:|\d|am|pm)|24\s*\/?\s*7|24\s*hours|open/i.test(todayHours);
      return looksOpen
        ? { isOpen: true, known: true, text: todayHours, todayHours }
        : { isOpen: false, known: false, text: 'Hours not listed', todayHours: '' };
    }
    
    const [start, end] = parts.map(t => t.trim());
    const parseTime = (t: string) => {
      // Handle formats like "9AM", "9:30AM", "9 AM", "09:00 AM"
      const match = t.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
      if (!match) return null;
      
      let h = parseInt(match[1]);
      const m = parseInt(match[2] || '0');
      const modifier = match[3].toUpperCase();
      
      if (modifier === 'PM' && h < 12) h += 12;
      if (modifier === 'AM' && h === 12) h = 0;
      
      const d = new Date(now); // Base it on current clinic time
      d.setHours(h, m, 0, 0);
      return d;
    };
    
    const startTime = parseTime(start);
    const endTime = parseTime(end);
    
    if (!startTime || !endTime) {
      return { isOpen: true, known: true, text: todayHours, todayHours };
    }
    
    if (now >= startTime && now <= endTime) {
      return { isOpen: true, known: true, text: 'Open Now', todayHours };
    } else {
      return { isOpen: false, known: true, text: `Closed · Opens ${start}`, todayHours };
    }
  } catch {
    return { isOpen: false, known: true, text: 'Closed', todayHours: 'Closed' };
  }
}
