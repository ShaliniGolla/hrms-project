# Admin Leave Approval Workflow Implementation

## Overview
Complete leave management system with admin approval workflow, toast notifications, and real-time balance updates.

## Implementation Summary

### ✅ Backend Components
1. **Leave Model** - Complete leave request tracking with approval details
2. **LeaveBalance Model** - Per-employee, per-type leave tracking (10 casual, 6 sick, 12 earned)
3. **LeaveService** - Business logic with:
   - Balance validation before creation
   - Balance deduction on approval
   - Rejection with reason tracking
   - Employee name resolution from Employee entity
4. **LeaveController** - 9 RESTful endpoints:
   - GET /api/leaves - All leaves
   - GET /api/leaves/{id} - Single leave
   - GET /api/leaves/employee/{employeeId} - Employee's leaves
   - GET /api/leaves/employee/{employeeId}/recent?limit=5 - Recent leaves
   - POST /api/leaves - Create new leave (validates balance)
   - POST /api/leaves/{id}/approve - Approve with approverId
   - POST /api/leaves/{id}/reject - Reject with approverId and reason
   - GET /api/leaves/balance/{employeeId} - Get balance
   - POST /api/leaves/balance/initialize/{employeeId} - Initialize balance
5. **DataSeeder** - Auto-initializes default leave balances for all employees

### ✅ Frontend Components

#### 1. LeaveRequestPage.jsx
- **Features:**
  - Fetch leave balance on component mount
  - Display current balance (Casual, Sick, Earned) with remaining leaves
  - Calculate leave days dynamically (endDate - startDate + 1)
  - Validate balance before allowing submission
  - Toast error notification if insufficient leaves
  - Formatted error message: "Insufficient {TYPE} leaves. Available: {X}, Requested: {Y}"
  - Loading state management
  - Success toast after submission

#### 2. EmployeeDashboard.jsx
- **Features:**
  - Display leave balance in 4 stat cards (Total, Casual, Sick, Earned)
  - Recent leave history table with columns:
    - Type (CASUAL, SICK, EARNED)
    - Dates (formatted as DD-MM-YYYY)
    - Status (color-coded: GREEN=APPROVED, YELLOW=PENDING, RED=REJECTED)
    - **Approved By** (new column showing approver username and review date)
    - Actions (Recall button for pending leaves)
  - Fetches data on component mount
  - Auto-updates when status changes

#### 3. AdminDashboard.jsx
- **Features:**
  - Fetch pending leave requests from backend
  - Leave requests table on dashboard showing recent 5 leaves
  - Leave Requests tab with all pending leaves
  - **Approve button** - Sends POST to /api/leaves/{id}/approve with approverId
  - **Reject button** - Opens modal for rejection reason entry
  - **Reject Modal** - 
    - Textarea for rejection reason
    - Cancel button closes modal
    - Reject button sends POST to /api/leaves/{id}/reject with approverId and reason
  - Auto-refresh leave list after approve/reject
  - Error handling with user feedback
  - Status color coding in dashboard table

#### 4. App.jsx
- **Features:**
  - ToastContainer imported and configured globally
  - Settings:
    - Position: top-right
    - Auto-close: 5 seconds
    - Close on click enabled
    - Draggable enabled
    - Pause on hover enabled
  - Styles imported from react-toastify/dist/ReactToastify.css

### ✅ Data Flow

#### Leave Submission Flow
1. Employee selects dates and leave type in LeaveRequestPage
2. Frontend validates available balance
3. If insufficient: Toast error "Insufficient {TYPE} leaves. Available: {X}, Requested: {Y}"
4. If sufficient: POST to /api/leaves with data
5. Backend creates leave record with PENDING status
6. Employee sees success toast and recent leave history updates

#### Leave Approval Flow
1. Admin logs in and navigates to Leave Requests tab
2. Sees list of pending leave requests
3. Clicks **Approve** button
4. POST to /api/leaves/{id}/approve with:
   - approverId (current admin's user id)
5. Backend:
   - Validates leave exists and is PENDING
   - Sets status to APPROVED
   - Records approver (admin username) in approvedBy field
   - Calculates leave days used
   - Updates LeaveBalance by incrementing used counts
   - Updates remaining counts automatically
6. Admin sees success toast
7. Employee dashboard auto-updates showing:
   - Updated status (GREEN badge)
   - Approver name and review date
   - Balance decreased by approved days

#### Leave Rejection Flow
1. Admin clicks **Reject** button on pending leave
2. Modal opens for rejection reason input
3. Admin enters reason and clicks Reject
4. POST to /api/leaves/{id}/reject with:
   - approverId (current admin's user id)
   - reason (rejection text)
5. Backend:
   - Validates leave exists and is PENDING
   - Sets status to REJECTED
   - Records rejection reason
   - Records approver (admin username)
   - Does NOT deduct from balance
6. Admin sees success toast
7. Employee dashboard shows:
   - Updated status (RED badge)
   - Approver name and review date
   - Balance remains unchanged

### ✅ Database Changes
- Leave table now has: approved_by_id, rejection_reason, reviewed_at fields
- LeaveBalance table has: casual_leaves_used, sick_leaves_used, earned_leaves_used fields

### ✅ API Endpoints Used

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | /api/leaves | - | List of all LeaveDTO objects |
| GET | /api/leaves/balance/{empId} | - | LeaveBalance with remaining counts |
| GET | /api/leaves/employee/{empId}/recent?limit=5 | - | List of recent LeaveDTO objects |
| POST | /api/leaves | LeaveDTO | Created LeaveDTO with PENDING status |
| POST | /api/leaves/{id}/approve | {approverId: Long} | LeaveDTO with APPROVED status |
| POST | /api/leaves/{id}/reject | {approverId: Long, reason: String} | LeaveDTO with REJECTED status |

### ✅ Toast Notifications
- **Error:** Insufficient balance when submitting leave
- **Error:** API failures during approve/reject
- **Success:** Leave submission successful
- **Success:** Leave approved
- **Success:** Leave rejected

### ✅ Dependencies Added
- react-toastify 10.0.0 (already in package.json and installed)

### ✅ Required User Fields
From localStorage user object:
- `user.id` or `user.userId` - Used as approverId for approval actions
- `user.employeeId` or `user.id` - Used for employee leave requests

### ✅ State Management
- AdminDashboard:
  - leaveRequests: All leave records from backend
  - pendingLeaves: Filtered PENDING status leaves
  - currentUserId: Admin's user id for approvals
  - showRejectModal: Modal visibility toggle
  - rejectingLeaveId: Track which leave is being rejected
  - rejectReason: Textarea content for rejection

- EmployeeDashboard:
  - leaveBalance: Balance object with remaining counts per type
  - recentLeaves: Last 5 leave records for employee
  - loading: Async operation indicator

## Testing Checklist

- [ ] Employee submits leave with sufficient balance
- [ ] Employee sees balance validation error with insufficient leave
- [ ] Toast error displays with correct message format
- [ ] Admin sees pending leaves in Leave Requests tab
- [ ] Admin approves leave, see success toast
- [ ] Employee dashboard updates with approved status
- [ ] Employee sees approver name in leave history
- [ ] Employee balance decreases by approved days
- [ ] Admin rejects leave with reason
- [ ] Rejection reason displays correctly (if stored/displayed)
- [ ] Employee dashboard shows rejected status
- [ ] Employee balance unchanged for rejected leave

## Known Limitations
- Toast notifications use browser defaults (not custom styled)
- Rejection reason modal uses browser alert for errors
- No confirmation before approval (only for rejection)
- No email notifications implemented

## Future Enhancements
1. Custom toast styling
2. Undo/recall approved leaves
3. Email notifications to employees
4. Bulk approval/rejection
5. Leave quota adjustments by admin
6. Attendance integration with leave status
7. Leave history reporting
8. Manager-level approval hierarchy
