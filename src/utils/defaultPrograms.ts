
import { Event } from '@/services/calendarService';

// Default programs for testing and development
export const createDefaultPrograms = (): Event[] => {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(today.getDate() + 14);
  
  const threeWeeksLater = new Date(today);
  threeWeeksLater.setDate(today.getDate() + 21);
  
  const oneMonthLater = new Date(today);
  oneMonthLater.setDate(today.getDate() + 30);

  return [
    {
      id: 'camp-001',
      title: 'Nature Discovery Camp',
      start: nextWeek,
      end: new Date(nextWeek.getTime() + 8 * 60 * 60 * 1000), // 8 hours later
      description: 'An exciting day camp where children explore nature, learn about wildlife, and engage in outdoor activities.',
      color: '#22c55e',
      location: 'Karura Forest, Limuru Road',
      maxAttendees: 100,
      programId: 'camp-001',
      isWeeklong: false,
      eventType: 'camp',
      ageGroups: [
        { name: 'Neem Campers', ageRange: '2 years and below', capacity: 15, description: 'Gentle activities for toddlers' },
        { name: 'Grevillia Campers', ageRange: '3-5 years', capacity: 20, description: 'Early exploration and play' },
        { name: 'Eucalyptus Campers', ageRange: '6-8 years', capacity: 25, description: 'Nature discovery activities' },
        { name: 'Croton Campers', ageRange: '9-11 years', capacity: 25, description: 'Adventure and skill building' },
        { name: 'Mighty Oaks', ageRange: '12-15 years', capacity: 20, description: 'Leadership and outdoor skills' }
      ],
      pricing: {
        morning: 1500,
        afternoon: 1500,
        fullDay: 2500
      },
      enableDefaultActivities: true,
      defaultActivities: [
        { id: '1', name: 'Medium Canvas Painting', price: 700, description: 'Express creativity on canvas' },
        { id: '3', name: 'Trampoline', price: 250, description: 'Fun bouncing activities' },
        { id: '7', name: 'Little Explorers', price: 1500, description: 'Educational exploration for children' }
      ]
    },
    {
      id: 'camp-002',
      title: 'Adventure Week Camp',
      start: twoWeeksLater,
      end: new Date(twoWeeksLater.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days later
      description: 'A week-long adventure camp featuring hiking, team-building, outdoor cooking, and wilderness skills.',
      color: '#3b82f6',
      location: 'Karura Forest Adventure Grounds',
      maxAttendees: 80,
      programId: 'camp-002',
      isWeeklong: true,
      eventType: 'camp',
      ageGroups: [
        { name: 'Junior Adventurers', ageRange: '6-9 years', capacity: 30, description: 'Introduction to outdoor adventures' },
        { name: 'Explorer Rangers', ageRange: '10-13 years', capacity: 30, description: 'Intermediate adventure skills' },
        { name: 'Wilderness Leaders', ageRange: '14-17 years', capacity: 20, description: 'Advanced wilderness and leadership training' }
      ],
      pricing: {
        morning: 2000,
        afternoon: 2000,
        fullDay: 3500,
        weeklong: 15000
      },
      enableDefaultActivities: true,
      defaultActivities: [
        { id: '4', name: 'Horse Riding', price: 2000, description: 'Guided horse riding experience' },
        { id: '5', name: 'Rope Course', price: 600, description: 'Challenge yourself on our rope course' },
        { id: '2', name: 'Big Canvas Painting', price: 1200, description: 'Create masterpieces on large canvas' }
      ]
    },
    {
      id: 'workshop-001',
      title: 'Wildlife Photography Workshop',
      start: threeWeeksLater,
      end: new Date(threeWeeksLater.getTime() + 4 * 60 * 60 * 1000), // 4 hours later
      description: 'Learn the basics of wildlife photography while exploring Karura Forest with professional photographers.',
      color: '#f59e0b',
      location: 'Karura Forest Photography Trail',
      maxAttendees: 20,
      programId: 'workshop-001',
      isWeeklong: false,
      eventType: 'workshop',
      pricing: {
        morning: 2500,
        afternoon: 2500,
        fullDay: 4500
      },
      enableDefaultActivities: false
    },
    {
      id: 'program-001',
      title: 'Environmental Education Program',
      start: oneMonthLater,
      end: new Date(oneMonthLater.getTime() + 6 * 60 * 60 * 1000), // 6 hours later
      description: 'An educational program focused on environmental conservation, sustainability, and climate awareness.',
      color: '#10b981',
      location: 'Karura Environmental Center',
      maxAttendees: 50,
      programId: 'program-001',
      isWeeklong: false,
      eventType: 'program',
      ageGroups: [
        { name: 'Eco Explorers', ageRange: '8-12 years', capacity: 25, description: 'Introduction to environmental science' },
        { name: 'Green Champions', ageRange: '13-16 years', capacity: 25, description: 'Advanced environmental projects' }
      ],
      pricing: {
        morning: 1800,
        afternoon: 1800,
        fullDay: 3000
      },
      enableDefaultActivities: true,
      defaultActivities: [
        { id: '1', name: 'Medium Canvas Painting', price: 700, description: 'Environmental art projects' },
        { id: '7', name: 'Little Explorers', price: 1500, description: 'Nature exploration activities' }
      ]
    }
  ];
};

// Initialize default programs in localStorage if none exist
export const initializeDefaultPrograms = (): void => {
  const existingEvents = localStorage.getItem('calendar_events');
  
  if (!existingEvents || JSON.parse(existingEvents).length === 0) {
    const defaultPrograms = createDefaultPrograms();
    const eventsToSave = defaultPrograms.map(event => ({
      ...event,
      start: event.start instanceof Date ? event.start.toISOString() : event.start,
      end: event.end instanceof Date ? event.end.toISOString() : event.end,
    }));
    
    localStorage.setItem('calendar_events', JSON.stringify(eventsToSave));
    console.log('Default programs initialized in localStorage:', defaultPrograms.length);
  } else {
    console.log('Existing programs found in localStorage, skipping initialization');
  }
};

// Clear and reinitialize programs (useful for testing)
export const resetDefaultPrograms = (): void => {
  localStorage.removeItem('calendar_events');
  initializeDefaultPrograms();
  console.log('Programs reset and reinitialized');
};
