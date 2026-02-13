# Leave Management System - Quick Start Guide

## Prerequisites
- Java 17+
- Maven 3.8+
- Node.js 16+
- MySQL 8.0+
- Spring Boot 3.x

## Steps to Run

### 1. Backend Setup

#### Step 1.1: Navigate to backend directory
```bash
cd backend
```

#### Step 1.2: Build the project
```bash
mvn clean install
```

#### Step 1.3: Run the application
```bash
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### 2. Frontend Setup

#### Step 2.1: Navigate to frontend directory
```bash
cd hrmsproject
```

#### Step 2.2: Install dependencies
```bash
npm install
```

#### Step 2.3: Start the development server
```bash
npm run dev
```

The frontend will be available on `http://localhost:5173` or as shown in terminal

---

## Testing the Leave Management System

### 1. Create Test Data
When the application starts, DataSeeder automatically:
- Creates leave balances for all existing employees
- Sets default values: 10 casual, 6 sick, 12 earned leaves

### 2. Login as Employee
1. Go to frontend URL
2. Login with employee credentials (check DataSeeder for default users)
3. Navigate to "Dashboard" tab

### 3. View Leave Balance
- On the Dashboard tab, you'll see leave balance cards
- Shows: Total Leaves, Casual Leaves, Sick Leaves, Earned Leaves
- Shows recent leave history below

### 4. Submit Leave Request
1. Click "Leave Request" tab
2. Select leave type: SICK, CASUAL, or EARNED
3. Choose start and end dates
4. Enter reason for leave
5. Click "Request" button
6. You'll see success message if successful

### 5. View Recent Leave History
- On Dashboard tab, scroll down to "Recent Leave History"
- See all your submitted leave requests
- Status shows as PENDING, APPROVED, or REJECTED
- For PENDING leaves, you can click "Recall"

---

## Key Features Implemented

### Employee Features
✅ View available leave balance (10 casual, 6 sick, 12 earned)
✅ Submit leave requests
✅ View leave request history
✅ See leave status (Pending/Approved/Rejected)
✅ Recall pending leave requests

### System Features
✅ Automatic leave balance initialization for all employees
✅ Leave validation (checks available balance)
✅ Leave approval workflow
✅ Automatic balance deduction on approval
✅ Real-time dashboard updates

---

## API Endpoints Quick Reference

### Leave Requests
```
GET    /api/leaves                              - Get all leaves
GET    /api/leaves/{id}                         - Get specific leave
GET    /api/leaves/employee/{employeeId}       - Get employee's leaves
GET    /api/leaves/employee/{employeeId}/recent?limit=5 - Get recent leaves
POST   /api/leaves                              - Submit leave request
POST   /api/leaves/{id}/approve                 - Approve leave
POST   /api/leaves/{id}/reject                  - Reject leave
```

### Leave Balance
```
GET    /api/leaves/balance/{employeeId}        - Get leave balance
POST   /api/leaves/balance/initialize/{employeeId} - Initialize balance
```

---

## Default Leave Allocation

Every employee receives:
- **Casual Leaves**: 10
- **Sick Leaves**: 6
- **Earned Leaves**: 12
- **Total**: 28 leaves per year

---

## Troubleshooting

### Issue: Backend not connecting to frontend
**Solution**: 
- Check CORS configuration in `CorsConfig.java`
- Ensure backend is running on `http://localhost:8080`
- Check browser console for CORS errors

### Issue: Leave balance not showing
**Solution**:
- Ensure user is logged in
- Check browser console for API errors
- Verify employee ID is stored in localStorage

### Issue: Leave request submission fails
**Solution**:
- Check all form fields are filled
- Ensure sufficient leave balance
- Check backend logs for validation errors
- Verify start date is before end date

### Issue: DataSeeder not initializing balances
**Solution**:
- Ensure `LeaveBalanceRepository` is autowired
- Check database migration scripts
- Verify `leave_balances` table exists

---

## Important Notes

1. **Default Credentials** (check DataSeeder):
   - Employee user will be created automatically
   - Use these to login and test

2. **Leave Type Values**:
   - Must be uppercase: `SICK`, `CASUAL`, `EARNED`
   - Frontend dropdown automatically formats these

3. **Date Format**:
   - Backend uses: `LocalDate` (YYYY-MM-DD)
   - Frontend uses: HTML date input (browser dependent)
   - Dashboard displays: DD-MM-YYYY

4. **Database Tables**:
   - `leaves` - Stores leave requests
   - `leave_balances` - Stores employee leave balances
   - Both are created automatically by Hibernate

5. **Authentication**:
   - Bearer token stored in `localStorage` as `token`
   - Used in all API requests
   - Verify token exists before fetching data

---

## Development Notes

### Adding New Leave Type
1. Update `LeaveType.java` enum
2. Update `LeaveBalanceService.java` initialization
3. Update frontend dropdown in `LeaveRequestPage.jsx`

### Changing Default Leave Counts
1. Update `LeaveBalanceService.java`:
   ```java
   balance.setCasualLeavesTotal(10);  // Change here
   balance.setSickLeavesTotal(6);     // Change here
   balance.setEarnedLeavesTotal(12);  // Change here
   ```

### Customizing Leave Validation
1. Edit `LeaveService.java` `hassufficientBalance()` method
2. Add additional validation logic

---

## Support & Contact

For issues or questions:
1. Check the `LEAVE_MANAGEMENT_SYSTEM.md` documentation
2. Review backend logs for errors
3. Check browser console for frontend errors
4. Verify database connectivity

---

## Success Indicators

✅ Application starts without errors
✅ DataSeeder initializes leave balances
✅ Login works and user data loads
✅ Dashboard shows leave balance cards with numbers
✅ Leave Request form submits successfully
✅ Recent leave history displays
✅ All API calls return 200/201 status codes
