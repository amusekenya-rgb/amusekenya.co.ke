
import { format, parseISO } from 'date-fns';

export interface AgeGroup {
  name: string;
  ageRange: string;
  capacity: number;
  description?: string;
}

export interface Activity {
  id: string;
  name: string;
  price: number;
  description?: string;
  // For special pricing cases like Rope Course
  specialPricing?: {
    condition: string;
    price: number;
  };
}

export interface Event {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  description: string;
  color: string;
  location?: string;
  maxAttendees?: number;
  programType?: string; // Maps to program type from programMappingService
  registrationUrl?: string; // Direct link to registration form
  programPdf?: string; // URL or path to PDF
  eventType?: 'camp' | 'program' | 'workshop' | 'other';
  // Legacy fields - kept for backward compatibility
  programId?: string;
  isWeeklong?: boolean;
  ageGroups?: AgeGroup[];
  pricing?: {
    morning: number;
    afternoon: number;
    fullDay: number;
    weeklong?: number;
  };
  enableDefaultActivities?: boolean;
  defaultActivities?: Activity[];
}

// Default age groups for camping events
export const defaultCampAgeGroups: AgeGroup[] = [
  { name: 'Neem Campers', ageRange: '2 years and below', capacity: 15, description: 'Activities designed for toddlers' },
  { name: 'Grevillia Campers', ageRange: '3-5 years', capacity: 20, description: 'Early childhood exploration and play' },
  { name: 'Eucalyptus Campers', ageRange: '6-8 years', capacity: 25, description: 'Introduction to nature and teamwork' },
  { name: 'Croton Campers', ageRange: '9-11 years', capacity: 25, description: 'Adventure and skill development' },
  { name: 'Mighty Oaks', ageRange: '12-15 years', capacity: 20, description: 'Leadership and advanced outdoor skills' }
];

// Default activities that can be enabled for events
export const defaultActivities: Activity[] = [
  { id: '1', name: 'Medium Canvas Painting', price: 700, description: 'Express your creativity on a medium-sized canvas' },
  { id: '2', name: 'Big Canvas Painting', price: 1200, description: 'Create a masterpiece on a large canvas' },
  { id: '3', name: 'Trampoline', price: 250, description: 'Enjoy bouncing on our safe trampolines' },
  { id: '4', name: 'Horse Riding', price: 2000, description: 'Guided horse riding experience' },
  { 
    id: '5', 
    name: 'Rope Course', 
    price: 600, 
    description: 'Challenge yourself on our rope course',
    specialPricing: {
      condition: '> 2 rounds',
      price: 1000
    }
  },
  { id: '6', name: 'Tamasha', price: 1500, description: 'Weekend entertainment and activities' },
  { 
    id: '7', 
    name: 'Little Explorers', 
    price: 1500, 
    description: 'Educational exploration activities for children',
    specialPricing: {
      condition: 'Full day',
      price: 2500
    }
  }
];

// Helper function to ensure dates are proper Date objects
const ensureDateObjects = (events: Event[]): Event[] => {
  return events.map(event => ({
    ...event,
    start: event.start instanceof Date ? event.start : new Date(event.start),
    end: event.end instanceof Date ? event.end : new Date(event.end),
  }));
};

// Save events to local storage
export const saveEvents = (events: Event[]): void => {
  const eventsToSave = events.map(event => ({
    ...event,
    start: event.start instanceof Date ? event.start.toISOString() : event.start,
    end: event.end instanceof Date ? event.end.toISOString() : event.end,
  }));
  
  localStorage.setItem('calendar_events', JSON.stringify(eventsToSave));
  console.log('Events saved to localStorage:', eventsToSave.length);
};

// Load events from local storage
export const loadEvents = (): Event[] => {
  const storedEvents = localStorage.getItem('calendar_events');
  
  if (storedEvents) {
    try {
      const parsedEvents: Event[] = JSON.parse(storedEvents);
      console.log('Events loaded from localStorage:', parsedEvents.length);
      return ensureDateObjects(parsedEvents);
    } catch (error) {
      console.error('Failed to parse stored events:', error);
      return [];
    }
  }
  
  console.log('No events found in localStorage');
  return [];
};

// Create program download
export const createProgramDownload = (event: Event): void => {
  // If there's a program PDF to download
  if (event.programPdf) {
    // Create an anchor element and simulate a click to download the PDF
    const link = document.createElement('a');
    link.href = event.programPdf;
    link.download = `${event.title.replace(/\s+/g, '_')}_Program.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }
  
  // Fallback to text file if no PDF is available
  const startDate = event.start instanceof Date ? event.start : new Date(event.start);
  const endDate = event.end instanceof Date ? event.end : new Date(event.end);
  
  const fileName = `${event.title.replace(/\s+/g, '_')}_Program.txt`;
  let fileContent = `
${event.title}
Date: ${format(startDate, 'MMMM d, yyyy')}
Time: ${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}
Location: ${event.location || 'TBD'}

PROGRAM DETAILS:
${event.description}

Attendee Limit: ${event.maxAttendees || 'Unlimited'}
Contact: info@amuseke.com | (123) 456-7890
`;

  // Add age groups if available
  if (event.ageGroups && event.ageGroups.length > 0) {
    fileContent += "\nAGE GROUPS:\n";
    event.ageGroups.forEach(group => {
      fileContent += `${group.name} (${group.ageRange}): ${group.description || 'No description available'}\n`;
    });
  }

  // Add pricing information
  if (event.pricing) {
    fileContent += "\nPRICING:\n";
    fileContent += `Morning Session: ${event.pricing.morning} KES\n`;
    fileContent += `Afternoon Session: ${event.pricing.afternoon} KES\n`;
    fileContent += `Full Day: ${event.pricing.fullDay} KES\n`;
    if (event.isWeeklong && event.pricing.weeklong) {
      fileContent += `Full Week: ${event.pricing.weeklong} KES\n`;
    }
  }
  
  // Add default activities if enabled
  if (event.enableDefaultActivities && event.defaultActivities && event.defaultActivities.length > 0) {
    fileContent += "\nOPTIONAL ACTIVITIES:\n";
    event.defaultActivities.forEach(activity => {
      fileContent += `${activity.name}: ${activity.price} KES`;
      if (activity.specialPricing) {
        fileContent += ` (${activity.specialPricing.condition}: ${activity.specialPricing.price} KES)`;
      }
      fileContent += "\n";
    });
  }
  
  const blob = new Blob([fileContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Get available programs from events for registration
export const getAvailablePrograms = () => {
  const events = loadEvents();
  const now = new Date();
  
  // Only return events that are in the future
  const futureEvents = events.filter(event => {
    const eventDate = event.start instanceof Date ? event.start : new Date(event.start);
    return eventDate > now;
  });
  
  return futureEvents.map(event => {
    const baseProgramInfo = {
      id: event.id,
      title: event.title,
      date: format(event.start instanceof Date ? event.start : new Date(event.start), 'MMMM d, yyyy'),
      time: `${format(event.start instanceof Date ? event.start : new Date(event.start), 'h:mm a')} - ${format(event.end instanceof Date ? event.end : new Date(event.end), 'h:mm a')}`,
      location: event.location || 'TBD',
      maxAttendees: event.maxAttendees || 'Unlimited',
      isWeeklong: event.isWeeklong || false,
      eventType: event.eventType || 'program',
      ageGroups: event.ageGroups || [],
      pricing: event.pricing || { morning: 1500, afternoon: 1500, fullDay: 2500 },
      programPdf: event.programPdf || null,
      enableDefaultActivities: event.enableDefaultActivities || false,
      defaultActivities: event.defaultActivities || []
    };

    return baseProgramInfo;
  });
};

// Calculate cost for a selected program based on timeSlot and ageGroup
export const calculateProgramCost = (
  programId: string, 
  timeSlot: 'morning' | 'afternoon' | 'fullDay' | 'weeklong',
  ageGroup?: string,
  selectedActivities?: string[]
): number => {
  const events = loadEvents();
  const event = events.find(e => e.id === programId);
  
  if (!event || !event.pricing) {
    // Default pricing if not found
    switch(timeSlot) {
      case 'morning': return 1500;
      case 'afternoon': return 1500;
      case 'fullDay': return 2500;
      case 'weeklong': return 12000; // Default weeklong price
      default: return 2500;
    }
  }
  
  // Start with the base price for the time slot
  let totalCost = 0;
  switch(timeSlot) {
    case 'morning': totalCost = event.pricing.morning; break;
    case 'afternoon': totalCost = event.pricing.afternoon; break;
    case 'fullDay': totalCost = event.pricing.fullDay; break;
    case 'weeklong': totalCost = event.pricing.weeklong || event.pricing.fullDay * 5; break;
    default: totalCost = event.pricing.fullDay; break;
  }
  
  // Add costs for selected activities if applicable
  if (event.enableDefaultActivities && event.defaultActivities && selectedActivities && selectedActivities.length > 0) {
    selectedActivities.forEach(activityId => {
      const activity = event.defaultActivities?.find(a => a.id === activityId);
      if (activity) {
        // For Little Explorers, use special pricing for full day
        if (activity.id === '7' && timeSlot === 'fullDay' && activity.specialPricing) {
          totalCost += activity.specialPricing.price;
        } 
        // For other activities with special pricing, we'd need additional logic here
        else {
          totalCost += activity.price;
        }
      }
    });
  }
  
  return totalCost;
};

export default {
  saveEvents,
  loadEvents,
  createProgramDownload,
  getAvailablePrograms,
  calculateProgramCost,
  defaultCampAgeGroups,
  defaultActivities
};
