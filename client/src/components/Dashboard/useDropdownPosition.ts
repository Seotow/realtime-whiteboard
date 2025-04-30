import { useState, useEffect } from 'react';

interface DropdownPosition {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
}

export const useDropdownPosition = (
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLElement>,
  dropdownWidth = 160,
  dropdownHeight = 200
): DropdownPosition => {
  const [position, setPosition] = useState<DropdownPosition>({});

  useEffect(() => {
    if (!isOpen || !triggerRef.current) {
      return;
    }

    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const newPosition: DropdownPosition = {};

    // Determine horizontal position
    if (rect.right + dropdownWidth > viewportWidth) {
      // Not enough space on the right, position to the left
      newPosition.right = '0';
    } else {
      // Enough space on the right
      newPosition.left = '0';
    }

    // Determine vertical position
    if (rect.bottom + dropdownHeight > viewportHeight) {
      // Not enough space below, position above
      newPosition.bottom = '100%';
      newPosition.top = undefined;
    } else {
      // Enough space below
      newPosition.top = '100%';
      newPosition.bottom = undefined;
    }

    setPosition(newPosition);
  }, [isOpen, dropdownWidth, dropdownHeight, triggerRef]);

  return position;
};
