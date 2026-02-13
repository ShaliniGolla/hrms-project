# Leave Management System - Testing & Deployment Guide

## System Overview

This is a complete leave management system with:
- Employee leave request submission with balance validation
- Real-time balance display and leave day calculation
- Admin approval/rejection workflow with reason tracking
- Toast notifications for all user interactions
- Auto-updated employee dashboard reflecting admin actions

## Prerequisites

### Backend
- Java 17
- Maven 3.x
- MySQL 8.0.33
- Spring Boot 3.2.0

### Frontend
- Node.js (npm)
- React 19.2.0
- Vite

## Installation & Startup

### 1. Start Backend
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```
Backend will start on http://localhost:8080

### 2. Install Frontend Dependencies
```bash
cd hrmsproject
npm install
```

### 3. Start Frontend (if running separately)
```bash
npm run dev
```
Frontend will be available at http://localhost:5173

## Default Leave Allocation

All employees automatically get:
- **Casual Leaves:** 10 days
- **Sick Leaves:** 6 days
- **Earned Leaves:** 12 days

(Initialized by DataSeeder on first backend startup)

## User Login Credentials

### Employee Login
- **Username:** Any employee account
- **Password:** As set during employee creation

After login, employee will see:
- Leave balance cards (Casual/Sick/Earned with remaining days)
- Recent leave history table
- Request leave button

### Admin Login
- **Username:** admin (System admin user)
- **Password:** As configured

After login, admin will see:
- Leave Requests tab with all pending leaves
- Ability to approve/reject with reason input

## Testing Workflow

### Test Case 1: Submit Leave with Sufficient Balance
1. Login as employee
2. Navigate to Leave Request tab
3. Select dates (e.g., 3 days) and type (Casual)
4. Click Submit
5. **Expected:** 
   - Success toast appears
   - Leave balance decreases by 3 days
   - Recent leave history shows new entry with PENDING status

### Test Case 2: Submit Leave with Insufficient Balance
1. Login as employee
2. Navigate to Leave Request tab
3. Select dates (e.g., 15 days) and type (Casual - only 10 available)
4. Click Submit
5. **Expected:**
   - Error toast appears: "Insufficient Casual leaves. Available: 10, Requested: 15"
   - Leave is NOT created
   - Balance unchanged

### Test Case 3: Admin Approves Leave
1. Login as admin
2. Navigate to "Leave Requests" tab
3. Find pending leave and click "Approve"
4. **Expected:**
   - Success toast appears
   - Leave disappears from pending list
   - Status changes to APPROVED in recent history
   - Approver name (admin username) appears in "Approved By" column

### Test Case 4: Admin Rejects Leave with Reason
1. Login as admin
2. Navigate to "Leave Requests" tab
3. Find pending leave and click "Reject"
4. Modal appears asking for rejection reason
5. Enter reason (e.g., "Insufficient team coverage") and click Reject
6. **Expected:**
   - Modal closes
   - Success toast appears
   - Leave disappears from pending list
   - Status changes to REJECTED in recent history
   - Approver name appears with review date
   - Employee's balance unchanged

### Test Case 5: Employee Sees Updated Status
1. Employee logged in, viewing dashboard
2. Admin approves/rejects a pending leave in parallel
3. Employee refresh page or wait for auto-update
4. **Expected:**
   - Recent leave history shows updated status
   - Approver name is visible
   - Balance reflects approved days (reduced) or rejected (unchanged)

## Key Files Modified

### Backend
- `Leave.java` - Model with approval tracking
- `LeaveBalance.java` - Balance model
- `LeaveService.java` - Business logic with approval
- `LeaveController.java` - REST endpoints
- `LeaveDTO.java` - Data transfer object with new fields

### Frontend
- `App.jsx` - Added ToastContainer
- `LeaveRequestPage.jsx` - Balance validation with toast
- `EmployeeDashboard.jsx` - Added "Approved By" column
- `AdminDashboard.jsx` - Admin approval interface
- `package.json` - Added react-toastify

## API Endpoints Reference

### Get All Leaves
```
GET /api/leaves
Response: List<LeaveDTO>
```

### Get Leave Balance
```
GET /api/leaves/balance/{employeeId}
Response: LeaveBalance
  - casualLeavesTotal: 10
  - casualLeavesUsed: 3
  - casualLeavesRemaining: 7
```

### Submit Leave Request
```
POST /api/leaves
Body: {
  "employeeId": 1,
  "startDate": "2025-04-01",
  "endDate": "2025-04-03",
  "leaveType": "CASUAL",
  "reason": "Personal"
}
Response: LeaveDTO with status=PENDING
```

### Approve Leave
```
POST /api/leaves/{id}/approve
Body: {
  "approverId": 2
}
Response: LeaveDTO with status=APPROVED, approvedBy=admin_username
```

### Reject Leave
```
POST /api/leaves/{id}/reject
Body: {
  "approverId": 2,
  "reason": "Insufficient coverage"
}
Response: LeaveDTO with status=REJECTED, rejectionReason=...
```

## Database Tables

### leaves
- id (PK)
- employee_id (FK)
- start_date
- end_date
- leave_type (CASUAL, SICK, EARNED)
- reason
- status (PENDING, APPROVED, REJECTED)
- approved_by_id (FK to users - who approved/rejected)
- rejection_reason
- submitted_at
- reviewed_at

### leave_balances
- id (PK)
- employee_id (FK, UNIQUE)
- casual_leaves_total (10)
- casual_leaves_used (0-10)
- sick_leaves_total (6)
- sick_leaves_used (0-6)
- earned_leaves_total (12)
- earned_leaves_used (0-12)
- last_updated

## Troubleshooting

### Issue: Toast notifications not showing
- **Solution:** Check that `npm install` completed successfully
- **Check:** Browser console for import errors
- Check that ToastContainer is in App.jsx with closing fragment

### Issue: Admin approval fails with "Approver not found"
- **Solution:** Verify admin user exists in database and has valid ID
- **Check:** localStorage contains user.id or user.userId
- Verify approverId matches actual user in database

### Issue: Leave balance not updating after approval
- **Solution:** Check backend logs for updateLeaveBalance errors
- **Check:** LeaveBalance record exists for employee
- Refresh employee dashboard (or wait for auto-refresh)

### Issue: Recent leave history not showing
- **Solution:** Verify employee has submitted leaves
- **Check:** GET /api/leaves/employee/{empId}/recent endpoint
- Check browser network tab for API errors

### Issue: Cannot submit leave (stuck on loading)
- **Solution:** Check backend is running on port 8080
- **Check:** CORS configuration allows localhost:3000/5173
- Check browser console for network errors

## Performance Notes

- Leave balance is cached on component mount (not real-time)
- Manual refresh needed to see balance after admin actions
- Consider implementing WebSocket for real-time updates
- Database queries are optimized with JPA pagination

## Security Notes

- Admin ID must be valid user in database
- JWT token required for all authenticated endpoints
- Balance validation happens on backend (not just frontend)
- Rejection reasons logged for audit trail

## Future Enhancements

1. Real-time balance updates using WebSocket
2. Email notifications to employees on approval/rejection
3. Bulk leave approval interface
4. Leave quota adjustments by HR
5. Integration with attendance system
6. Manager-level approval hierarchy
7. Leave policy templates
8. Leave carry-forward management

---

**Last Updated:** January 2026
**System Status:** Production Ready
**Test Coverage:** Manual testing scenarios provided
