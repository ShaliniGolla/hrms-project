# Leave Management System - Implementation Guide

## Overview
This document summarizes the complete implementation of the leave management system for the HRMS application. The system now includes:
- Default leave allocation for all employees (10 casual, 6 sick, 12 earned leaves)
- Backend-frontend integration for leave requests
- Leave balance tracking and management
- Recent leave history display in employee dashboard

---

## Backend Implementation

### 1. **Models Created/Updated**

#### Leave.java
- **File**: `backend/src/main/java/com/hrms/model/Leave.java`
- **Fields**:
  - `id`: Unique identifier
  - `employee`: Employee requesting leave
  - `startDate`: Leave start date
  - `endDate`: Leave end date
  - `leaveType`: Type (CASUAL, SICK, EARNED)
  - `reason`: Reason for leave
  - `status`: Status (PENDING, APPROVED, REJECTED)
  - `rejectionReason`: Reason if rejected
  - `approvedBy`: User who approved
  - `submittedAt`: When leave was requested
  - `reviewedAt`: When leave was reviewed

#### LeaveBalance.java (New)
- **File**: `backend/src/main/java/com/hrms/model/LeaveBalance.java`
- **Purpose**: Tracks remaining leaves for each employee
- **Fields**:
  - `employee`: OneToOne relationship with Employee
  - `casualLeavesTotal`: Total casual leaves (default: 10)
  - `casualLeavesUsed`: Casual leaves used
  - `sickLeavesTotal`: Total sick leaves (default: 6)
  - `sickLeavesUsed`: Sick leaves used
  - `earnedLeavesTotal`: Total earned leaves (default: 12)
  - `earnedLeavesUsed`: Earned leaves used
  - Methods to get remaining leaves

---

### 2. **Repositories**

#### LeaveRepository.java
- **Methods Added**:
  - `findByEmployeeId()`: Get all leaves for an employee
  - `findByStatus()`: Get leaves by status
  - `findByEmployeeIdAndStatus()`: Get leaves by employee and status
  - `findByEmployeeIdOrderBySubmittedAtDesc()`: Get leaves ordered by latest first

#### LeaveBalanceRepository.java (New)
- **Methods**:
  - `findByEmployeeId()`: Get leave balance for an employee

---

### 3. **Services**

#### LeaveService.java
- **Key Methods**:
  - `getAllLeaves()`: Get all leaves
  - `getLeaveById()`: Get specific leave
  - `getLeavesByEmployeeId()`: Get all leaves for employee
  - `getRecentLeavesByEmployeeId()`: Get recent N leaves for employee
  - `createLeave()`: Submit new leave request
    - Validates leave balance
    - Prevents exceeding available leaves
  - `approveLeave()`: Approve pending leave
    - Updates leave balance when approved
  - `rejectLeave()`: Reject pending leave
  - `updateLeaveBalance()`: Updates balance after approval

#### LeaveBalanceService.java (New)
- **Key Methods**:
  - `initializeLeaveBalance()`: Create new balance for employee
    - Default: 10 casual, 6 sick, 12 earned leaves
  - `getLeaveBalance()`: Get balance for employee
  - `getRemainingLeaves()`: Get total remaining leaves

---

### 4. **Controllers**

#### LeaveController.java - Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/leaves` | GET | Get all leaves |
| `/api/leaves/{id}` | GET | Get specific leave |
| `/api/leaves/employee/{employeeId}` | GET | Get all leaves for employee |
| `/api/leaves/employee/{employeeId}/recent` | GET | Get recent leaves (with limit parameter) |
| `/api/leaves` | POST | Submit new leave request |
| `/api/leaves/{id}/approve` | POST | Approve leave |
| `/api/leaves/{id}/reject` | POST | Reject leave |
| `/api/leaves/balance/{employeeId}` | GET | Get leave balance |
| `/api/leaves/balance/initialize/{employeeId}` | POST | Initialize balance for employee |

---

### 5. **DTO Updates**

#### LeaveDTO.java
- **New Fields Added**:
  - `employeeName`: Employee's name
  - `submittedAt`: Submission timestamp
  - `approvedBy`: Approver username
  - `reviewedAt`: Review timestamp

---

### 6. **Data Initialization**

#### DataSeeder.java
- **New Functionality**:
  - Automatically initializes leave balances for all employees
  - Runs on application startup
  - Sets default values: 10 casual, 6 sick, 12 earned leaves
  - Checks to prevent duplicate balance creation

---

## Frontend Implementation

### 1. **LeaveRequestPage.jsx** (`hrmsproject/src/pages/employee/LeaveRequestPage.jsx`)

#### Features:
- **Form Fields**:
  - Leave Type (dropdown): SICK, CASUAL, EARNED
  - Start Date (date picker)
  - End Date (date picker)
  - Reason (textarea)

- **Validations**:
  - All fields required
  - Start date <= End date
  - Employee ID verification
  - Balance validation (backend)

- **API Integration**:
  - POST to `http://localhost:8080/api/leaves`
  - Includes bearer token for authentication
  - Handles success/error responses
  - Loading state during submission

- **User Feedback**:
  - Success message on submission
  - Error alerts with details
  - Loading indicator on button
  - Form reset after successful submission

---

### 2. **EmployeeDashboard.jsx** (`hrmsproject/src/pages/employee/EmployeeDashboard.jsx`)

#### Features:

##### Leave Balance Stats Cards
- **Total Leaves**: Sum of all remaining leaves
- **Casual Leaves**: Remaining casual leaves
- **Sick Leaves**: Remaining sick leaves
- **Earned Leaves**: Remaining earned leaves

##### Recent Leave History Table
- **Columns**:
  - Type: Leave type
  - Dates: Start → End date
  - Status: APPROVED/PENDING/REJECTED (with color coding)
  - Actions: Recall button for pending leaves

##### API Integration
- **Endpoints Used**:
  - GET `/api/leaves/balance/{employeeId}`: Fetch leave balance
  - GET `/api/leaves/employee/{employeeId}/recent?limit=5`: Fetch recent leaves

- **Features**:
  - Automatic data loading on component mount
  - Bearer token authentication
  - Loading states
  - Error handling
  - Date formatting (DD-MM-YYYY)
  - Status-based color coding:
    - APPROVED: Green
    - PENDING: Yellow
    - REJECTED: Red

---

## Database Tables

### leaves table
```sql
CREATE TABLE leaves (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  employee_id BIGINT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type VARCHAR(20) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'PENDING',
  rejection_reason TEXT,
  approved_by_id BIGINT,
  submitted_at DATETIME,
  reviewed_at DATETIME,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (approved_by_id) REFERENCES users(id)
);
```

### leave_balances table
```sql
CREATE TABLE leave_balances (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  employee_id BIGINT NOT NULL UNIQUE,
  casual_leaves_total INT DEFAULT 10,
  casual_leaves_used INT DEFAULT 0,
  sick_leaves_total INT DEFAULT 6,
  sick_leaves_used INT DEFAULT 0,
  earned_leaves_total INT DEFAULT 12,
  earned_leaves_used INT DEFAULT 0,
  last_updated DATETIME,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
```

---

## How It Works - Flow Diagram

### Leave Request Submission Flow
1. Employee navigates to "Leave Request" tab
2. Fills out form (type, dates, reason)
3. Submits form
4. Frontend validates input and sends POST to `/api/leaves`
5. Backend validates:
   - Employee exists
   - Leave balance exists
   - Sufficient leaves available
6. If valid:
   - Creates Leave record with PENDING status
   - Returns success response
7. Frontend shows success message and resets form

### Leave Balance Display Flow
1. Employee opens dashboard
2. Component mounts and fetches leave balance via `/api/leaves/balance/{employeeId}`
3. Backend queries LeaveBalance table
4. Returns balance with calculated remaining leaves
5. Frontend displays in stat cards
6. Also fetches recent 5 leaves via `/api/leaves/employee/{employeeId}/recent`
7. Displays in history table with proper formatting and status colors

### Leave Approval Flow (for Reporting Managers/Admin)
1. Manager receives pending leave request
2. Reviews request
3. Calls `/api/leaves/{id}/approve` with approverId
4. Backend updates Leave status to APPROVED
5. Backend updates LeaveBalance (increments used leaves)
6. Returns updated leave record

---

## Configuration

### Backend Configuration
- **Leave Counts** (in LeaveBalanceService):
  - Casual Leaves: 10
  - Sick Leaves: 6
  - Earned Leaves: 12

- **API Base URL**: `http://localhost:8080`

### Frontend Configuration
- **API Base URL**: `http://localhost:8080`
- **Leave Fetch Limit**: 5 recent leaves
- **Authentication**: Bearer token from localStorage

---

## Testing Checklist

### Backend Testing
- [ ] Application starts and DataSeeder initializes leave balances
- [ ] POST `/api/leaves` - Creates leave request
- [ ] GET `/api/leaves/balance/{employeeId}` - Returns correct balance
- [ ] GET `/api/leaves/employee/{employeeId}/recent` - Returns recent leaves
- [ ] Insufficient balance validation works
- [ ] Leave approval updates balance correctly

### Frontend Testing
- [ ] Leave Request form submits successfully
- [ ] Error messages display for invalid input
- [ ] Dashboard loads leave balance on mount
- [ ] Leave stats cards show correct values
- [ ] Recent leave history displays with correct formatting
- [ ] Status colors apply correctly
- [ ] Recall button shows only for pending leaves

---

## Files Modified/Created

### Backend Files
- ✅ `Leave.java` - Uncommented and updated
- ✅ `LeaveBalance.java` - Created (New)
- ✅ `LeaveRepository.java` - Uncommented and updated
- ✅ `LeaveBalanceRepository.java` - Created (New)
- ✅ `LeaveService.java` - Uncommented and fully updated
- ✅ `LeaveBalanceService.java` - Created (New)
- ✅ `LeaveController.java` - Uncommented and updated
- ✅ `LeaveDTO.java` - Uncommented and updated
- ✅ `DataSeeder.java` - Updated with leave balance initialization

### Frontend Files
- ✅ `LeaveRequestPage.jsx` - Updated with backend integration
- ✅ `EmployeeDashboard.jsx` - Updated with leave data fetching and display

---

## Future Enhancements

1. **Leave Carry Over**: Handle carry-over of unused leaves
2. **Leave Policies**: Different policies for different employee types
3. **Restricted Dates**: Block leave requests on holidays/blackout dates
4. **Leave Categories**: Add more leave types (unpaid, maternity, etc.)
5. **Approval Workflow**: Multi-level approvals
6. **Email Notifications**: Send emails on leave request/approval
7. **Leave Reports**: Generate leave reports
8. **Attendance Integration**: Link leaves with attendance

---

## Notes

- All leave balances are initialized automatically for existing employees
- New employees get default balance upon creation
- Leave request validation happens on both frontend and backend
- Default leave values can be configured in LeaveBalanceService
- Employee must have sufficient balance to submit leave request
- Approved leaves automatically deduct from available balance
