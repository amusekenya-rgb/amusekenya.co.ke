
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import EventCalendar from '@/components/calendar/EventCalendar';
import EventManagement from '@/components/calendar/EventManagement';
import { Event, saveEvent, loadEvents, deleteEvent } from '@/services/calendarService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

const AdminCalendar: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState("calendar");
  
  useEffect(() => {
    const fetchEvents = async () => {
      const loadedEvents = await loadEvents();
      if (loadedEvents.length > 0) {
        // Ensure all events have proper Date objects
        const formattedEvents = loadedEvents.map(event => ({
          ...event,
          start: event.start instanceof Date ? event.start : new Date(event.start),
          end: event.end instanceof Date ? event.end : new Date(event.end)
        }));
        setEvents(formattedEvents);
        console.log('AdminCalendar loaded events:', formattedEvents.length);
      } else {
        console.log('AdminCalendar: No events found');
      }
    };
    fetchEvents();
  }, []);
  
  const handleAddEvent = (newEvent: Event) => {
    setEvents([...events, newEvent]);
    toast({
      title: "Event Added",
      description: `"${newEvent.title}" has been added to the calendar.`,
      duration: 3000,
    });
    setActiveTab("calendar");
    console.log('Event added and saved:', newEvent.title);
  };
  
  const handleDeleteEvent = async (eventId: string) => {
    const success = await deleteEvent(eventId);
    if (success) {
      setEvents(events.filter(event => event.id !== eventId));
      toast({
        title: "Event Deleted",
        description: "The event has been removed from the calendar.",
        duration: 3000,
      });
      console.log('Event deleted:', eventId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Program Calendar Management</h2>
          <p className="text-gray-500">
            Add, edit, and manage program events that appear on the calendar
          </p>
        </div>
        <Button onClick={() => setActiveTab("add")} className="gap-1">
          <PlusCircle className="h-4 w-4" />
          Add Event
        </Button>
      </div>
      
      <Tabs 
        defaultValue="calendar" 
        value={activeTab} 
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="calendar">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="add">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Event
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <EventCalendar 
                isAdmin={true}
                events={events}
                onDeleteEvent={handleDeleteEvent} 
              />
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events</CardTitle>
                <CardDescription>
                  List of all scheduled program events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.length > 0 ? (
                    events
                      .sort((a, b) => {
                        const dateA = a.start instanceof Date ? a.start : new Date(a.start);
                        const dateB = b.start instanceof Date ? b.start : new Date(b.start);
                        return dateA.getTime() - dateB.getTime();
                      })
                      .map((event) => (
                        <Card key={event.id} className="overflow-hidden">
                          <div className={`h-1 ${event.color}`} />
                          <CardContent className="p-4 flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{event.title}</h4>
                              <p className="text-sm text-gray-500">
                                {format(event.start instanceof Date ? event.start : new Date(event.start), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              Delete
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                  ) : (
                    <p className="text-center py-4 text-gray-500">
                      No events have been added yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="add" className="mt-6">
          <EventManagement onAddEvent={handleAddEvent} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminCalendar;
