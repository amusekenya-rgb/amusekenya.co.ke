
import React, { useState, useEffect } from 'react';
import { 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  format, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  eachDayOfInterval,
  parseISO,
  set
} from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  CalendarDays, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Download, 
  Users, 
  Grid3X3, 
  LayoutGrid,
  X,
  FileText,
  Calendar as CalendarDateIcon,
  Tag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';
import { Event, Activity, loadEvents, createProgramDownload } from '@/services/calendarService';
import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';

interface EventCalendarProps {
  className?: string;
  showControls?: boolean;
  isAdmin?: boolean;
  events?: Event[];
  showAgeGroups?: boolean;
  showPdfDownload?: boolean;
  onDeleteEvent?: (eventId: string) => void;
}

const EventCalendar: React.FC<EventCalendarProps> = ({ 
  className, 
  showControls = true,
  isAdmin = false,
  events: externalEvents,
  showAgeGroups = false,
  showPdfDownload = false,
  onDeleteEvent
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState<boolean>(false);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  useEffect(() => {
    if (externalEvents) {
      setEvents(externalEvents);
    } else {
      const loadedEvents = loadEvents();
      setEvents(loadedEvents);
    }
  }, [externalEvents]);
  
  const getDays = () => {
    if (view === 'month') {
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const startDate = startOfWeek(start);
      const endDate = endOfWeek(end);
      
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else if (view === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      
      return eachDayOfInterval({ start, end });
    } else {
      return [currentDate];
    }
  };
  
  const days = getDays();
  
  const navigatePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addDays(currentDate, -1));
    }
  };
  
  const navigateNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 1));
    }
  };
  
  const navigateToday = () => {
    setCurrentDate(new Date());
  };
  
  const getEventsByDay = (day: Date) => {
    return events.filter(event => 
      isSameDay(event.start instanceof Date ? event.start : new Date(event.start), day)
    );
  };
  
  const getEventTimeDisplay = (event: Event) => {
    const startTime = format(event.start instanceof Date ? event.start : new Date(event.start), 'h:mm a');
    const endTime = format(event.end instanceof Date ? event.end : new Date(event.end), 'h:mm a');
    return `${startTime} - ${endTime}`;
  };
  
  const downloadProgram = (event: Event) => {
    createProgramDownload(event);
  };
  
  const isToday = (day: Date) => {
    return isSameDay(day, new Date());
  };
  
  const isCurrentMonth = (day: Date) => {
    return isSameMonth(day, currentDate);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (onDeleteEvent) {
      onDeleteEvent(eventId);
    }
  };
  
  const getEventDuration = (event: Event) => {
    const start = event.start instanceof Date ? event.start : new Date(event.start);
    const end = event.end instanceof Date ? event.end : new Date(event.end);
    
    const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      return "1 day";
    } else if (daysDiff >= 4 && daysDiff <= 6) {
      return "Week-long";
    } else {
      return `${daysDiff + 1} days`;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="space-y-1 border-b pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-forest-600" />
            <CardTitle>Program Calendar</CardTitle>
          </div>
          
          {showControls && (
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={navigateToday}
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={navigatePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={navigateNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {view === 'month' ? (
              format(currentDate, 'MMMM yyyy')
            ) : view === 'week' ? (
              `Week of ${format(days[0], 'MMM d')} - ${format(days[days.length - 1], 'MMM d, yyyy')}`
            ) : (
              format(currentDate, 'MMMM d, yyyy')
            )}
          </h3>
          
          <Tabs 
            defaultValue={view}
            value={view} 
            onValueChange={(val) => setView(val as 'month' | 'week' | 'day')}
            className="w-[300px]"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="month">
                <CalendarDays className="h-4 w-4 mr-2" />
                Month
              </TabsTrigger>
              <TabsTrigger value="week">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Week
              </TabsTrigger>
              <TabsTrigger value="day">
                <Grid3X3 className="h-4 w-4 mr-2" />
                Day
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 pt-0">
        {view === 'month' && (
          <div className="grid grid-cols-7 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-2 border-b font-medium text-sm">
                {day}
              </div>
            ))}
            
            {days.map((day, index) => {
              const dayEvents = getEventsByDay(day);
              const isCurrentDay = isToday(day);
              const inMonth = isCurrentMonth(day);
              
              return (
                <div 
                  key={index}
                  className={cn(
                    "min-h-[100px] border-t border-r p-1 relative",
                    index % 7 === 0 && "border-l",
                    !inMonth && "bg-gray-50",
                    isCurrentDay && "bg-blue-50"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium leading-none rounded-full w-7 h-7 flex items-center justify-center",
                    isCurrentDay && "bg-blue-600 text-white"
                  )}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs p-1 rounded truncate cursor-pointer",
                          event.color
                        )}
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsEventDialogOpen(true);
                        }}
                      >
                        <span className="text-white">{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {view === 'week' && (
          <div className="grid grid-cols-7 divide-x">
            {days.map((day, i) => (
              <div key={i} className={cn(
                "min-h-[500px] p-2",
                isToday(day) && "bg-blue-50"
              )}>
                <div className="text-center mb-2 font-medium">
                  <div>{format(day, 'EEE')}</div>
                  <div className={cn(
                    "text-lg inline-flex items-center justify-center h-8 w-8 rounded-full",
                    isToday(day) && "bg-blue-600 text-white"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
                <div className="space-y-2">
                  {getEventsByDay(day).map((event) => (
                    <div
                      key={event.id}
                      className={cn(
                        "p-2 rounded text-white cursor-pointer",
                        event.color
                      )}
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsEventDialogOpen(true);
                      }}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        {getEventTimeDisplay(event)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {view === 'day' && (
          <div className="p-4">
            <div className="text-center mb-4">
              <div className="text-2xl font-semibold">
                {format(currentDate, 'EEEE')}
              </div>
              <div className={cn(
                "text-lg inline-flex items-center justify-center h-10 w-10 rounded-full",
                isToday(currentDate) && "bg-blue-600 text-white"
              )}>
                {format(currentDate, 'd')}
              </div>
            </div>
            
            <div className="space-y-3">
              {getEventsByDay(currentDate).length > 0 ? (
                getEventsByDay(currentDate).map((event) => (
                  <Card key={event.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
                    setSelectedEvent(event);
                    setIsEventDialogOpen(true);
                  }}>
                    <div className={cn("h-2", event.color)} />
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">{event.title}</h4>
                        <Badge variant="outline">{getEventTimeDisplay(event)}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        {event.location && (
                          <div className="flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1" />
                            {event.location}
                          </div>
                        )}
                        {event.maxAttendees && (
                          <div className="flex items-center">
                            <Users className="h-3.5 w-3.5 mr-1" />
                            Max: {event.maxAttendees}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No events scheduled for today
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl">{selectedEvent?.title}</DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0" 
                onClick={() => setIsEventDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>
              {selectedEvent && (
                <div className="flex items-center space-x-2">
                  <CalendarDateIcon className="h-4 w-4" />
                  <span>
                    {format(selectedEvent.start instanceof Date ? selectedEvent.start : new Date(selectedEvent.start), 'EEEE, MMMM d, yyyy')}
                    {!isSameDay(
                      selectedEvent.start instanceof Date ? selectedEvent.start : new Date(selectedEvent.start),
                      selectedEvent.end instanceof Date ? selectedEvent.end : new Date(selectedEvent.end)
                    ) && (
                      <> - {format(selectedEvent.end instanceof Date ? selectedEvent.end : new Date(selectedEvent.end), 'EEEE, MMMM d, yyyy')}</>
                    )}
                  </span>
                  
                  {selectedEvent.isWeeklong && (
                    <Badge variant="outline" className="ml-2">
                      Week-long Event
                    </Badge>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center text-sm">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span>{getEventTimeDisplay(selectedEvent)}</span>
                
                {selectedEvent.isWeeklong && (
                  <Badge variant="outline" className="ml-2">
                    {getEventDuration(selectedEvent)}
                  </Badge>
                )}
              </div>
              
              {selectedEvent.location && (
                <div className="flex items-start text-sm">
                  <Users className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              
              <div className="text-sm space-y-2">
                <h4 className="font-medium">Program Details:</h4>
                <p className="text-gray-700">
                  {selectedEvent.description}
                </p>
              </div>
              
              {showAgeGroups && selectedEvent.ageGroups && selectedEvent.ageGroups.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Age Groups:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.ageGroups.map((group, index) => (
                      <Badge 
                        key={index}
                        variant={selectedAgeGroup === group.name ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedAgeGroup(selectedAgeGroup === group.name ? null : group.name)}
                      >
                        {group.name}
                      </Badge>
                    ))}
                  </div>
                  
                  {selectedAgeGroup && (
                    <div className="bg-slate-50 p-3 rounded-md text-sm mt-2">
                      {selectedEvent.ageGroups.find(g => g.name === selectedAgeGroup)?.description || (
                        <span>Activities designed for {selectedEvent.ageGroups.find(g => g.name === selectedAgeGroup)?.ageRange}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {selectedEvent.pricing && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Pricing:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Morning Session: <span className="font-medium">{selectedEvent.pricing.morning} KES</span></div>
                    <div>Afternoon Session: <span className="font-medium">{selectedEvent.pricing.afternoon} KES</span></div>
                    <div>Full Day: <span className="font-medium">{selectedEvent.pricing.fullDay} KES</span></div>
                    {selectedEvent.isWeeklong && selectedEvent.pricing.weeklong && (
                      <div>Full Week: <span className="font-medium">{selectedEvent.pricing.weeklong} KES</span></div>
                    )}
                  </div>
                </div>
              )}
              
              {selectedEvent.enableDefaultActivities && selectedEvent.defaultActivities && selectedEvent.defaultActivities.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Optional Activities:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.defaultActivities.map((activity, index) => (
                      <Badge 
                        key={index}
                        variant={selectedActivity?.id === activity.id ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setSelectedActivity(selectedActivity?.id === activity.id ? null : activity)}
                      >
                        {activity.name}
                      </Badge>
                    ))}
                  </div>
                  
                  {selectedActivity && (
                    <div className="bg-slate-50 p-3 rounded-md text-sm mt-2">
                      <div className="flex items-center justify-between">
                        <span>{selectedActivity.description || selectedActivity.name}</span>
                        <div className="flex items-center text-foreground">
                          <Tag className="h-3.5 w-3.5 mr-1" />
                          <span className="font-medium">{selectedActivity.price} KES</span>
                          {selectedActivity.specialPricing && (
                            <span className="ml-2 text-xs text-gray-600">
                              ({selectedActivity.specialPricing.condition}: {selectedActivity.specialPricing.price} KES)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {selectedEvent.maxAttendees && (
                <div className="text-sm">
                  <span className="font-medium">Maximum Attendees:</span> {selectedEvent.maxAttendees}
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-end pt-2">
                {isAdmin ? (
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        handleDeleteEvent(selectedEvent.id);
                        setIsEventDialogOpen(false);
                      }}
                    >
                      Delete
                    </Button>
                    {showPdfDownload && (
                      <Button
                        variant="outline"
                        className="gap-1.5"
                        size="sm"
                        onClick={() => downloadProgram(selectedEvent)}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      asChild
                    >
                      <Link to={`/register/${selectedEvent.id}`}>
                        Register
                      </Link>
                    </Button>
                    {showPdfDownload && (
                      <Button
                        variant="outline"
                        className="gap-1.5"
                        size="sm"
                        onClick={() => downloadProgram(selectedEvent)}
                      >
                        <FileText className="h-4 w-4" />
                        {selectedEvent.programPdf ? "Download Brochure" : "Program Details"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default EventCalendar;
