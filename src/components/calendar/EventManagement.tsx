
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, isSameDay, differenceInDays } from "date-fns";
import { CalendarIcon, Clock, Plus, Trash2, Calendar as CalendarFullIcon, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Event, defaultCampAgeGroups, AgeGroup, defaultActivities, Activity } from '@/services/calendarService';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

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
  const [isWeeklong, setIsWeeklong] = useState(false);
  const [eventType, setEventType] = useState<'camp' | 'program' | 'workshop' | 'other'>('program');
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [showAgeGroups, setShowAgeGroups] = useState(false);
  const [morningPrice, setMorningPrice] = useState("1500");
  const [afternoonPrice, setAfternoonPrice] = useState("1500");
  const [fullDayPrice, setFullDayPrice] = useState("2500");
  const [weeklongPrice, setWeeklongPrice] = useState("12000");
  const [programPdf, setProgramPdf] = useState<string>("");
  const [activeTab, setActiveTab] = useState("basicDetails");
  
  // New state for default activities
  const [enableDefaultActivities, setEnableDefaultActivities] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState<Activity[]>([...defaultActivities]);

  // Reset or initialize age groups based on event type
  useEffect(() => {
    if (eventType === 'camp') {
      setAgeGroups([...defaultCampAgeGroups]);
      setShowAgeGroups(true);
    } else if (ageGroups.length === 0) {
      // Initialize with a single empty age group for other event types
      setAgeGroups([{ name: '', ageRange: '', capacity: 20 }]);
    }
  }, [eventType]);

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
      
      // If multi-day event, automatically set isWeeklong if it spans more than 4 days
      const daysDiff = differenceInDays(date, eventStartDate);
      if (daysDiff >= 4) {
        setIsWeeklong(true);
      }
    }
  };

  // Handle adding a new age group
  const handleAddAgeGroup = () => {
    setAgeGroups([...ageGroups, { name: '', ageRange: '', capacity: 20 }]);
  };

  // Handle removing an age group
  const handleRemoveAgeGroup = (index: number) => {
    const updatedGroups = [...ageGroups];
    updatedGroups.splice(index, 1);
    setAgeGroups(updatedGroups);
  };

  // Handle updating an age group
  const handleAgeGroupChange = (index: number, field: keyof AgeGroup, value: string | number) => {
    const updatedGroups = [...ageGroups];
    updatedGroups[index] = { ...updatedGroups[index], [field]: value };
    setAgeGroups(updatedGroups);
  };
  
  // Toggle activity selection
  const toggleActivity = (activity: Activity, isChecked: boolean) => {
    if (isChecked) {
      // Make sure activity isn't already in the list
      if (!selectedActivities.some(a => a.id === activity.id)) {
        setSelectedActivities([...selectedActivities, activity]);
      }
    } else {
      setSelectedActivities(selectedActivities.filter(a => a.id !== activity.id));
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
    
    // Only include non-empty age groups
    const filteredAgeGroups = showAgeGroups 
      ? ageGroups.filter(group => group.name.trim() !== '') 
      : [];
    
    const newEvent: Event = {
      id: Date.now().toString(),
      title,
      start: startDate,
      end: endDate,
      description,
      color,
      location,
      maxAttendees: parseInt(maxAttendees, 10),
      isWeeklong: isWeeklong,
      eventType: eventType,
      ageGroups: filteredAgeGroups.length > 0 ? filteredAgeGroups : undefined,
      pricing: {
        morning: parseInt(morningPrice, 10),
        afternoon: parseInt(afternoonPrice, 10),
        fullDay: parseInt(fullDayPrice, 10),
        weeklong: isWeeklong ? parseInt(weeklongPrice, 10) : undefined
      },
      programPdf: programPdf || undefined,
      enableDefaultActivities: enableDefaultActivities,
      defaultActivities: enableDefaultActivities ? selectedActivities : undefined
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
    setIsWeeklong(false);
    setEventType('program');
    setShowAgeGroups(false);
    setAgeGroups([]);
    setProgramPdf("");
    setMorningPrice("1500");
    setAfternoonPrice("1500");
    setFullDayPrice("2500");
    setWeeklongPrice("12000");
    setEnableDefaultActivities(false);
    setSelectedActivities([...defaultActivities]);
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
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="ageGroups">Age Groups</TabsTrigger>
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
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id="weeklong"
                    checked={isWeeklong}
                    onCheckedChange={(checked) => setIsWeeklong(checked === true)}
                  />
                  <Label htmlFor="weeklong">Week-long Event</Label>
                </div>
                
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
          
          <TabsContent value="pricing">
            <div className="space-y-6">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="morningPrice">Morning Rate (KES)</Label>
                  <Input 
                    id="morningPrice" 
                    type="number" 
                    value={morningPrice} 
                    onChange={(e) => setMorningPrice(e.target.value)} 
                    min="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="afternoonPrice">Afternoon Rate (KES)</Label>
                  <Input 
                    id="afternoonPrice" 
                    type="number" 
                    value={afternoonPrice} 
                    onChange={(e) => setAfternoonPrice(e.target.value)} 
                    min="0"
                  />
                </div>
              </div>
              
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullDayPrice">Full Day Rate (KES)</Label>
                  <Input 
                    id="fullDayPrice" 
                    type="number" 
                    value={fullDayPrice} 
                    onChange={(e) => setFullDayPrice(e.target.value)} 
                    min="0"
                  />
                </div>
                
                {isWeeklong && (
                  <div className="space-y-2">
                    <Label htmlFor="weeklongPrice">Week-long Rate (KES)</Label>
                    <Input 
                      id="weeklongPrice" 
                      type="number" 
                      value={weeklongPrice} 
                      onChange={(e) => setWeeklongPrice(e.target.value)} 
                      min="0"
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="activities">
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="enableActivities" 
                  checked={enableDefaultActivities} 
                  onCheckedChange={setEnableDefaultActivities}
                />
                <Label htmlFor="enableActivities">Enable Default Activities</Label>
              </div>
              
              {enableDefaultActivities && (
                <div className="space-y-4 mt-4">
                  <h3 className="text-sm font-medium">Select Available Activities:</h3>
                  
                  <div className="grid gap-4">
                    {defaultActivities.map((activity) => (
                      <div key={activity.id} className="border rounded-md p-3 bg-slate-50">
                        <div className="flex items-start">
                          <Checkbox
                            id={`activity-${activity.id}`}
                            checked={selectedActivities.some(a => a.id === activity.id)}
                            onCheckedChange={(checked) => toggleActivity(activity, checked === true)}
                            className="mt-1"
                          />
                          <div className="ml-3 space-y-1 flex-1">
                            <Label 
                              htmlFor={`activity-${activity.id}`}
                              className="font-medium"
                            >
                              {activity.name}
                            </Label>
                            <div className="text-sm text-gray-600">
                              {activity.price} KES
                              {activity.specialPricing && (
                                <span className="ml-2">
                                  ({activity.specialPricing.condition}: {activity.specialPricing.price} KES)
                                </span>
                              )}
                            </div>
                            {activity.description && (
                              <div className="text-xs text-gray-500">
                                {activity.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-600 mt-2">
                    <p>Activities are charged separately when selected by participants.</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="ageGroups">
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showAgeGroups"
                  checked={showAgeGroups || eventType === 'camp'} 
                  onCheckedChange={(checked) => setShowAgeGroups(checked === true)}
                  disabled={eventType === 'camp'} // Always enabled for camps
                />
                <Label htmlFor="showAgeGroups">
                  Define Specific Age Groups
                  {eventType === 'camp' && <span className="ml-2 text-sm text-muted-foreground">(Required for camps)</span>}
                </Label>
              </div>
              
              {(showAgeGroups || eventType === 'camp') && (
                <>
                  <div className="space-y-4">
                    {ageGroups.map((group, index) => (
                      <div key={index} className="border rounded-md p-4 space-y-4 relative">
                        {ageGroups.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 h-7 w-7" 
                            onClick={() => handleRemoveAgeGroup(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`groupName-${index}`}>Group Name</Label>
                            <Input 
                              id={`groupName-${index}`} 
                              placeholder="e.g., Neem Campers" 
                              value={group.name} 
                              onChange={(e) => handleAgeGroupChange(index, 'name', e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`ageRange-${index}`}>Age Range</Label>
                            <Input 
                              id={`ageRange-${index}`} 
                              placeholder="e.g., 3-5 years" 
                              value={group.ageRange} 
                              onChange={(e) => handleAgeGroupChange(index, 'ageRange', e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`capacity-${index}`}>Capacity</Label>
                            <Input 
                              id={`capacity-${index}`} 
                              type="number" 
                              placeholder="20" 
                              value={group.capacity} 
                              onChange={(e) => handleAgeGroupChange(index, 'capacity', parseInt(e.target.value))}
                              min="1"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`description-${index}`}>Description (Optional)</Label>
                            <Input 
                              id={`description-${index}`} 
                              placeholder="Activities for this age group" 
                              value={group.description || ''} 
                              onChange={(e) => handleAgeGroupChange(index, 'description', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full"
                    onClick={handleAddAgeGroup}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Another Age Group
                  </Button>
                </>
              )}
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
