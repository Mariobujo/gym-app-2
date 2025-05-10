/**
 * Format a date to a string
 * @param date - The date to format
 * @param format - Format type: 'full', 'short', or 'time'
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, format: 'full' | 'short' | 'time' = 'full'): string => {
  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  // Format options
  const options: Intl.DateTimeFormatOptions = {};
  
  if (format === 'full') {
    options.weekday = 'long';
    options.year = 'numeric';
    options.month = 'long';
    options.day = 'numeric';
    options.hour = '2-digit';
    options.minute = '2-digit';
  } else if (format === 'short') {
    options.month = 'short';
    options.day = 'numeric';
  } else if (format === 'time') {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

/**
 * Get start of day for a date
 * @param date - The date to get start of day for
 * @returns Date object set to start of day
 */
export const getStartOfDay = (date: Date): Date => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

/**
 * Get end of day for a date
 * @param date - The date to get end of day for
 * @returns Date object set to end of day
 */
export const getEndOfDay = (date: Date): Date => {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

/**
 * Get start of week for a date
 * @param date - The date to get start of week for
 * @returns Date object set to start of week (Sunday)
 */
export const getStartOfWeek = (date: Date): Date => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  startOfWeek.setDate(startOfWeek.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

/**
 * Get end of week for a date
 * @param date - The date to get end of week for
 * @returns Date object set to end of week (Saturday)
 */
export const getEndOfWeek = (date: Date): Date => {
  const endOfWeek = new Date(date);
  const day = endOfWeek.getDay();
  endOfWeek.setDate(endOfWeek.getDate() + (6 - day));
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
};

/**
 * Get start of month for a date
 * @param date - The date to get start of month for
 * @returns Date object set to start of month
 */
export const getStartOfMonth = (date: Date): Date => {
  const startOfMonth = new Date(date);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
};

/**
 * Get end of month for a date
 * @param date - The date to get end of month for
 * @returns Date object set to end of month
 */
export const getEndOfMonth = (date: Date): Date => {
  const endOfMonth = new Date(date);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);
  return endOfMonth;
};

/**
 * Add days to a date
 * @param date - The base date
 * @param days - Number of days to add
 * @returns New date with days added
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Get difference in days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days between dates
 */
export const getDaysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  return diffDays;
};

/**
 * Check if a date is today
 * @param date - The date to check
 * @returns True if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Check if a date is in the future
 * @param date - The date to check
 * @returns True if date is in the future
 */
export const isFuture = (date: Date): boolean => {
  return date.getTime() > new Date().getTime();
};

/**
 * Check if a date is in the past
 * @param date - The date to check
 * @returns True if date is in the past
 */
export const isPast = (date: Date): boolean => {
  return date.getTime() < new Date().getTime();
};