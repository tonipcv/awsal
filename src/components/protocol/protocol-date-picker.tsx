import React from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

interface ProtocolDatePickerProps {
  label: string;
  date: Date | null;
  onDateChange: (date: Date | null) => void;
  disabled?: boolean;
}

export function ProtocolDatePicker({ label, date, onDateChange, disabled }: ProtocolDatePickerProps) {
  return (
    <div className="space-y-2">
      <Label className="text-gray-900 font-semibold flex items-center gap-2">
        <CalendarDaysIcon className="h-4 w-4" />
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="datetime-local"
          value={date ? format(date, "yyyy-MM-dd'T'HH:mm") : ''}
          onChange={(e) => onDateChange(e.target.value ? new Date(e.target.value) : null)}
          disabled={disabled}
          className="bg-white border-gray-300 focus:border-[#5154e7] focus:ring-[#5154e7] text-gray-900 rounded-xl h-10 font-medium"
        />
        {date && (
          <Button
            variant="ghost"
            onClick={() => onDateChange(null)}
            disabled={disabled}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear
          </Button>
        )}
      </div>
      {date && (
        <p className="text-sm text-gray-500">
          {format(date, "EEEE, MMMM d, yyyy 'at' h:mm a", { locale: enUS })}
        </p>
      )}
    </div>
  );
} 