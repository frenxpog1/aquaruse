# Design Document

## Overview

This design addresses the staff page refresh issue by implementing a cache invalidation strategy that ensures fresh data is loaded when navigating to the staff page after making changes. The solution involves two key changes:

1. Force cache invalidation in the `deleteStaff()` method after successful deletion
2. Ensure the navigation handler properly triggers a fresh render when switching to the staff page

## Architecture

The fix involves modifications to two components:

```
┌─────────────────┐
│   app.js        │
│  (Navigation)   │
└────────┬────────┘
         │ navigates to staff
         ▼
┌─────────────────┐
│  staff.js       │
│ (Staff Module)  │
└────────┬────────┘
         │ calls render()
         ▼
┌─────────────────┐
│  utils.js       │
│   (AppData)     │
└─────────────────┘
```

## Components and Interfaces

### 1. Staff Module (staff.js)

**Current Behavior:**
- `deleteStaff()` sets `this.staff = null` and calls `render()`
- `render()` calls `loadStaff()` which calls `AppData.init()`
- `AppData.init()` returns early if `isLoaded` is true, causing stale data

**Modified Behavior:**
- `deleteStaff()` will set `AppData.isLoaded = false` to force cache invalidation
- This ensures `AppData.init()` will reload data on the next call

### 2. Navigation Handler (app.js)

**Current Behavior:**
- Staff navigation handler calls `staffModule.render()` when navigating to staff page
- This is already correct and doesn't need modification

**Verification:**
- Ensure the navigation handler is properly calling `render()` asynchronously

## Data Models

No changes to data models are required. The existing data structures remain the same:

```javascript
// Staff data structure (unchanged)
{
  id: string,
  name: string,
  email: string,
  phone: string
}
```

## Error Handling

The existing error handling in `deleteStaff()` is adequate:
- Try-catch block wraps the deletion logic
- Errors are logged to console
- User is notified via `showNotification()`

Additional consideration:
- If cache invalidation fails, the error should be caught and logged but not prevent the deletion from completing

## Testing Strategy

### Manual Testing Steps:
1. Navigate to the staff page and verify staff list displays
2. Delete a staff member
3. Navigate to a different page (e.g., dashboard)
4. Navigate back to the staff page
5. Verify the deleted staff member is not displayed
6. Verify the staff count is correct

### Edge Cases to Test:
- Delete the last staff member
- Delete multiple staff members in succession
- Delete a staff member and immediately navigate back without going to another page
- Delete a staff member while on a different page (if possible)

## Implementation Notes

The fix is minimal and focused:
- Add one line in `deleteStaff()`: `window.AppData.isLoaded = false;`
- This should be placed after the successful deletion from both `staffAccounts` and `AppData.staff`
- Place it before the `render()` call to ensure fresh data is loaded

The location should be after line 390 in staff.js (after `window.AppData.save()` is called).
