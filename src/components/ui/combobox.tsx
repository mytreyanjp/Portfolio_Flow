
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
  options: { label: string; value: string }[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyStateMessage?: string;
  className?: string;
  popoverClassName?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search option...",
  emptyStateMessage = "No option found.",
  className,
  popoverClassName,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  // inputValue is what's visible in the search box or button
  const [inputValue, setInputValue] = React.useState(value || ""); 

  // Effect to keep inputValue in sync with the external `value` prop,
  // especially when the form is reset or `value` changes externally.
  React.useEffect(() => {
    const currentOption = options.find(option => option.value.toLowerCase() === (value || "").toLowerCase());
    setInputValue(currentOption ? currentOption.label : (value || ""));
  }, [value, options]);
  
  const handleSelectOption = (optionValue: string) => {
    const selectedOption = options.find(opt => opt.value.toLowerCase() === optionValue.toLowerCase());
    onChange(selectedOption ? selectedOption.value : optionValue); // Store the actual value
    setInputValue(selectedOption ? selectedOption.label : optionValue); // Display the label or typed value
    setOpen(false);
  };

  const handleInputChange = (currentSearchValue: string) => {
    setInputValue(currentSearchValue); // Keep inputValue state in sync with user typing
  };

  // This will be the label shown on the button
  const displayLabel = options.find(option => option.value.toLowerCase() === (value || "").toLowerCase())?.label || value || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className={className}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
        >
          {displayLabel}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn("w-[--radix-popover-trigger-width] p-0", popoverClassName)} 
        align="start"
        // Ensures popover doesn't exceed viewport height, especially on mobile
        style={{ maxHeight: 'min(var(--radix-popover-content-available-height), 300px)' }}
      >
        <Command>
          <CommandInput 
            placeholder={searchPlaceholder}
            value={inputValue} 
            onValueChange={handleInputChange} // Update inputValue as user types
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.trim() ? (
                <div
                  className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                  onClick={() => handleSelectOption(inputValue.trim())} // Allow selecting the typed value
                >
                  Add new category: "{inputValue.trim()}"
                </div>
              ) : (
                emptyStateMessage
              )}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label} // `cmdk` filters based on the `value` prop of `CommandItem` which should be the label for search
                  onSelect={() => handleSelectOption(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      (value || "").toLowerCase() === option.value.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {inputValue && !options.some(opt => opt.label.toLowerCase() === inputValue.toLowerCase()) && (
             <CommandItem
                key={`add-${inputValue}`}
                value={inputValue} // The value here should be what the user typed for filtering
                className="italic"
                onSelect={() => handleSelectOption(inputValue.trim())} // Use the typed value
             >
                <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                Add new category: "{inputValue.trim()}"
             </CommandItem>
           )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
