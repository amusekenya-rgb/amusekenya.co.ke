
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon, Clock, Plus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Event } from '@/services/calendarService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { programTypes, getProgramsByCategory, getProgramUrl } from '@/services/programMappingService';

interface EventManagementProps {
  onAddEvent?: (event: Event) => void;
  className?: string;
}

const EventManagement: React.FC<EventManagementProps> = ({ 
  onAddEvent,
  className 
}) => {
  const [eventStartDate, setEventStartDate] = useState<Date | undefined>(new Date());
  const [eventEndDate, setEventEndDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("20");
  const [color, setColor] = useState("bg-forest-500");
  const [eventType, setEventType] = useState<'camp' | 'program' | 'workshop' | 'other'>('program');
  const [programPdf, setProgramPdf] = useState<string>("");
  const [activeTab, setActiveTab] = useState("basicDetails");
  const [programType, setProgramType] = useState<string>("");
  const [registrationUrl, setRegistrationUrl] = useState<string>("");

  // Auto-populate registration URL when program type changes
  useEffect(() => {
    if (programType) {
      const url = getProgramUrl(programType);
      setRegistrationUrl(url);
    }
  }, [programType]);

  // Handle start date change
  const handleStartDateChange = (date: Date | undefined) => {
    setEventStartDate(date);
    // Only auto-update end date if it's before the new start date
    if (date && (!eventEndDate || eventEndDate < date)) {
      setEventEndDate(date);
    }
  };
  
  // Handle end date change
  const handleEndDateChange = (date: Date | undefined) => {
    if (date && eventStartDate && date >= eventStartDate) {
      setEventEndDate(date);
    }
  };

  const handleAddEvent = () => {
    if (!title || !eventStartDate || !eventEndDate) return;
    
    // Create the event start and end dates by combining the date with the times
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    
    const startDate = new Date(eventStartDate);
    startDate.setHours(startHour, startMinute);
    
    const endDate = new Date(eventEndDate);
    endDate.setHours(endHour, endMinute);
    
    const newEvent: Event = {
      id: Date.now().toString(),
      title,
      start: startDate,
      end: endDate,
      description,
      color,
      location,
      maxAttendees: parseInt(maxAttendees, 10),
      eventType: eventType,
      programType: programType || undefined,
      registrationUrl: registrationUrl || undefined,
      programPdf: programPdf || undefined,
    };
    
    if (onAddEvent) {
      onAddEvent(newEvent);
    }
    
    // Reset form
    setTitle("");
    setDescription("");
    setLocation("");
    setMaxAttendees("20");
    setStartTime("09:00");
    setEndTime("17:00");
    setEventType('program');
    setProgramPdf("");
    setProgramType("");
    setRegistrationUrl("");
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload to a server and get a URL
      // For now, we'll create a data URL as a placeholder
      const reader = new FileReader();
      reader.onload = () => {
        setProgramPdf(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const colorOptions = [
    { value: "bg-forest-500", label: "Forest Green" },
    { value: "bg-forest-400", label: "Light Green" },
    { value: "bg-sky-500", label: "Sky Blue" },
    { value: "bg-earth-500", label: "Earth Brown" },
    { value: "bg-earth-400", label: "Light Brown" },
    { value: "bg-amber-500", label: "Amber" },
    { value: "bg-rose-500", label: "Rose" },
    { value: "bg-purple-500", label: "Purple" },
  ];
  
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Program Event
        </CardTitle>
        <CardDescription>
          Create a new program event that will appear in the calendar.
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="basicDetails">Basic Details</TabsTrigger>
            <TabsTrigger value="programMaterials">Program Materials</TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="space-y-4 pt-4">
          <TabsContent value="basicDetails">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input 
                  id="title" 
                  placeholder="Enter event title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label>Program Type</Label>
                <Select value={programType} onValueChange={setProgramType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(getProgramsByCategory()).map(([category, programs]) => (
                      <React.Fragment key={category}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                          {category}
                        </div>
                        {programs.map((program) => (
                          <SelectItem key={program.value} value={program.value}>
                            {program.label}
                          </SelectItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
                {registrationUrl && (
                  <p className="text-xs text-muted-foreground">
                    Registration URL: {registrationUrl}
                  </p>
                )}
              </div>
              
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={eventType} onValueChange={(val: 'camp' | 'program' | 'workshop' | 'other') => setEventType(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="camp">Camp</SelectItem>
                      <SelectItem value="program">Program</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="color">Event Color</Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${option.value}`}></div>
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !eventStartDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {eventStartDate ? format(eventStartDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={eventStartDate}
                          onSelect={handleStartDateChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !eventEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {eventEndDate ? format(eventEndDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={eventEndDate}
                          onSelect={handleEndDateChange}
                          disabled={(date) => !eventStartDate || date < eventStartDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    placeholder="E.g., Main Center, Field Area" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxAttendees">Maximum Attendees</Label>
                  <Input 
                    id="maxAttendees" 
                    type="number" 
                    placeholder="20" 
                    value={maxAttendees} 
                    onChange={(e) => setMaxAttendees(e.target.value)} 
                    min="1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Program Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Enter a detailed description of the program" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={4} 
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="programMaterials">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="programPdf">Program PDF</Label>
                <div className="grid gap-2">
                  <Input
                    id="programPdf"
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="cursor-pointer"
                  />
                  
                  {programPdf && (
                    <div className="flex items-center space-x-2 py-2">
                      <Badge variant="outline" className="px-2 py-1 flex items-center gap-2">
                        <span>PDF Uploaded</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-4 w-4 p-0" 
                          onClick={() => setProgramPdf("")}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </Badge>
                    </div>
                  )}
                  
                  <p className="text-sm text-muted-foreground">
                    Upload a PDF document with detailed information about the program.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter>
        <Button onClick={handleAddEvent} className="w-full">
          Add Program Event
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EventManagement;
