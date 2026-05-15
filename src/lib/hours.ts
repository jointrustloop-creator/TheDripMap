
export interface StatusResult {
  isOpen: boolean;
  text: string;
  todayHours: string;
}

export function getStatus(hours: Record<string, string> | undefined, timezone?: string): StatusResult {
  if (!hours) return { isOpen: false, text: 'Closed', todayHours: 'Closed' };
  
  // Use provided timezone or fallback to America/New_York (Eastern Time)
  const tz = timezone || 'America/New_York';
  
  // Get current time in correct timezone
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[now.getDay()];
  const todayHours = hours[today];
  
  if (!todayHours || typeof todayHours !== 'string' || todayHours.toLowerCase() === 'closed') {
    return { isOpen: false, text: 'Closed', todayHours: 'Closed' };
  }
  
  try {
    const parts = todayHours.split('-');
    if (parts.length < 2) {
      return { isOpen: true, text: todayHours, todayHours };
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
      return { isOpen: true, text: todayHours, todayHours };
    }
    
    if (now >= startTime && now <= endTime) {
      return { isOpen: true, text: 'Open Now', todayHours };
    } else {
      return { isOpen: false, text: `Closed · Opens ${start}`, todayHours };
    }
  } catch {
    return { isOpen: false, text: 'Closed', todayHours: 'Closed' };
  }
}
