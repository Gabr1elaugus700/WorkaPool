import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface CalendarPopoverProps {
  date: Date | undefined;
  onChange: (date: Date | undefined) => void;
}

export default function CalendarPopover({ date, onChange }: CalendarPopoverProps) {
  const [openPopover, setOpenPopover] = useState(false);

  return (
    <Popover open={openPopover} onOpenChange={setOpenPopover}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id="date"
          className="w-48 justify-between font-normal"
        >
          {date ? date.toLocaleDateString() : "Select date"}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0 z-[100]" align="start">
        <Calendar
          mode="single"
          selected={date}
          captionLayout="dropdown"
          onSelect={(selectedDate) => {
            if (selectedDate) {
              onChange(selectedDate);
              setOpenPopover(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
