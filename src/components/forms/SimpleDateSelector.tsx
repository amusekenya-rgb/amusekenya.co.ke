import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format, startOfWeek, endOfWeek } from 'date-fns';

interface SimpleDateSelectorProps {
  availableDates: string[];
  selectedDates: string[];
  onDatesChange: (dates: string[]) => void;
  sessionRate: number;
  currency: string;
  disabled?: boolean;
}

// Parse date string as local date to avoid timezone issues
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const SimpleDateSelector: React.FC<SimpleDateSelectorProps> = ({
  availableDates,
  selectedDates,
  onDatesChange,
  sessionRate,
  currency,
  disabled = false
}) => {
  // Group dates by week
  const groupDatesByWeek = (dates: string[]) => {
    const weeks: { [key: string]: string[] } = {};
    
    dates.forEach(dateStr => {
      const date = parseLocalDate(dateStr);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      const weekKey = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(dateStr);
    });
    
    return weeks;
  };

  const handleDateToggle = (dateStr: string) => {
    if (disabled) return;
    
    if (selectedDates.includes(dateStr)) {
      onDatesChange(selectedDates.filter(d => d !== dateStr));
    } else {
      onDatesChange([...selectedDates, dateStr].sort());
    }
  };

  const handleSelectAllWeek = (weekDates: string[]) => {
    if (disabled) return;
    
    const allSelected = weekDates.every(d => selectedDates.includes(d));
    if (allSelected) {
      onDatesChange(selectedDates.filter(d => !weekDates.includes(d)));
    } else {
      const newDates = [...new Set([...selectedDates, ...weekDates])].sort();
      onDatesChange(newDates);
    }
  };

  const weeks = groupDatesByWeek(availableDates);
  const totalPrice = selectedDates.length * sessionRate;

  if (availableDates.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground bg-muted/50 rounded-lg">
        No dates available. Please check back later.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Object.entries(weeks).map(([weekLabel, weekDates]) => {
        const allSelected = weekDates.every(d => selectedDates.includes(d));
        const someSelected = weekDates.some(d => selectedDates.includes(d));
        
        return (
          <div key={weekLabel} className="border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm text-foreground">{weekLabel}</h4>
              <button
                type="button"
                onClick={() => handleSelectAllWeek(weekDates)}
                disabled={disabled}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {weekDates.map(dateStr => {
                const date = parseLocalDate(dateStr);
                const isSelected = selectedDates.includes(dateStr);
                
                return (
                  <div
                    key={dateStr}
                    className={`flex items-center space-x-3 p-3 rounded-md border cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary/10 border-primary' 
                        : 'bg-background hover:bg-muted/50 border-border'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => handleDateToggle(dateStr)}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={disabled}
                      onCheckedChange={() => handleDateToggle(dateStr)}
                    />
                    <Label className="cursor-pointer flex-1">
                      <span className="font-medium">{format(date, 'EEEE')}</span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        {format(date, 'MMM d, yyyy')}
                      </span>
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      
      {selectedDates.length > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground">
              {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
            </span>
            <span className="font-semibold text-primary">
              {currency} {totalPrice.toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleDateSelector;
