import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Enterprise Color Utilities
 * Provides semantic color classes for the knowledge management system
 */

export function getKnowledgeColor(type: 'file' | 'commit' | 'module' | 'person') {
  switch (type) {
    case 'file':
      return 'text-knowledge border-knowledge bg-knowledge/10'
    case 'commit':
      return 'text-data border-data bg-data/10'
    case 'module':
      return 'text-insight border-insight bg-insight/10'
    case 'person':
      return 'text-primary border-primary bg-primary/10'
    default:
      return 'text-muted-foreground border-border bg-muted'
  }
}

export function getImportanceColor(importance: 'high' | 'medium' | 'low') {
  switch (importance) {
    case 'high':
      return 'border-l-4 border-l-success bg-success/5'
    case 'medium':
      return 'border-l-4 border-l-warning bg-warning/5'
    case 'low':
      return 'border-l-4 border-l-muted-foreground/20 bg-muted/50'
    default:
      return 'border-l-4 border-l-border bg-muted'
  }
}

export function getStatusColor(status: 'success' | 'warning' | 'error' | 'info') {
  switch (status) {
    case 'success':
      return 'text-success bg-success/10 border-success/20'
    case 'warning':
      return 'text-warning bg-warning/10 border-warning/20'
    case 'error':
      return 'text-destructive bg-destructive/10 border-destructive/20'
    case 'info':
      return 'text-info bg-info/10 border-info/20'
    default:
      return 'text-muted-foreground bg-muted border-border'
  }
}

export function sleep(ms: number = 1000) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Generates page numbers for pagination with ellipsis
 * @param currentPage - Current page number (1-based)
 * @param totalPages - Total number of pages
 * @returns Array of page numbers and ellipsis strings
 *
 * Examples:
 * - Small dataset (≤5 pages): [1, 2, 3, 4, 5]
 * - Near beginning: [1, 2, 3, 4, '...', 10]
 * - In middle: [1, '...', 4, 5, 6, '...', 10]
 * - Near end: [1, '...', 7, 8, 9, 10]
 */
export function getPageNumbers(currentPage: number, totalPages: number) {
  const maxVisiblePages = 5 // Maximum number of page buttons to show
  const rangeWithDots = []

  if (totalPages <= maxVisiblePages) {
    // If total pages is 5 or less, show all pages
    for (let i = 1; i <= totalPages; i++) {
      rangeWithDots.push(i)
    }
  } else {
    // Always show first page
    rangeWithDots.push(1)

    if (currentPage <= 3) {
      // Near the beginning: [1] [2] [3] [4] ... [10]
      for (let i = 2; i <= 4; i++) {
        rangeWithDots.push(i)
      }
      rangeWithDots.push('...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      // Near the end: [1] ... [7] [8] [9] [10]
      rangeWithDots.push('...')
      for (let i = totalPages - 3; i <= totalPages; i++) {
        rangeWithDots.push(i)
      }
    } else {
      // In the middle: [1] ... [4] [5] [6] ... [10]
      rangeWithDots.push('...')
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        rangeWithDots.push(i)
      }
      rangeWithDots.push('...', totalPages)
    }
  }

  return rangeWithDots
}
