# Leave Management System - API Examples

## Base URL
```
http://localhost:8080
```

## Authentication
All requests require a Bearer token in the Authorization header:
```
Authorization: Bearer {token_from_localStorage}
```

---

## Leave Request Endpoints

### 1. Submit Leave Request
**Endpoint**: `POST /api/leaves`

**Request Body**:
```json
{
  "employeeId": 1,
  "leaveType": "CASUAL",
  "startDate": "2025-01-25",
  "endDate": "2025-01-27",
  "reason": "Medical appointment"
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "message": "Leave application submitted successfully",
  "data": {
    "id": 5,
    "employeeId": 1,
    "employeeName": "John Doe",
    "leaveType": "CASUAL",
    "startDate": "2025-01-25",
    "endDate": "2025-01-27",
    "reason": "Medical appointment",
    "status": "PENDING",
    "submittedAt": "2025-01-21T10:30:00"
  }
}
```

**Error Response (400)**:
```json
{
  "success": false,
  "message": "Insufficient leave balance",
  "data": null
}
```

---

### 2. Get All Leaves
**Endpoint**: `GET /api/leaves`

**Response**:
```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "id": 1,
      "employeeId": 1,
      "employeeName": "John Doe",
      "leaveType": "CASUAL",
      "startDate": "2025-01-20",
      "endDate": "2025-01-22",
      "reason": "Personal work",
      "status": "APPROVED",
      "submittedAt": "2025-01-18T09:00:00"
    },
    {
      "id": 2,
      "employeeId": 1,
      "leaveType": "SICK",
      "startDate": "2025-01-23",
      "endDate": "2025-01-23",
      "reason": "Fever",
      "status": "PENDING",
      "submittedAt": "2025-01-21T08:00:00"
    }
  ]
}
```

---

### 3. Get Employee's All Leaves
**Endpoint**: `GET /api/leaves/employee/{employeeId}`

**Example**: `GET /api/leaves/employee/1`

**Response**:
```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "id": 1,
      "employeeId": 1,
      "employeeName": "John Doe",
      "leaveType": "CASUAL",
      "startDate": "2025-01-20",
      "endDate": "2025-01-22",
      "status": "APPROVED",
      "submittedAt": "2025-01-18T09:00:00"
    }
  ]
}
```

---

### 4. Get Recent Leaves
**Endpoint**: `GET /api/leaves/employee/{employeeId}/recent`

**Query Parameters**:
- `limit` (optional): Number of recent leaves to fetch (default: 5)

**Example**: `GET /api/leaves/employee/1/recent?limit=3`

**Response**:
```json
{
  "success": true,
  "message": "success",
  "data": [
    {
      "id": 5,
      "employeeId": 1,
      "employeeName": "John Doe",
      "leaveType": "CASUAL",
      "startDate": "2025-01-25",
      "endDate": "2025-01-27",
      "status": "PENDING",
      "submittedAt": "2025-01-21T10:30:00"
    },
    {
      "id": 2,
      "employeeId": 1,
      "leaveType": "SICK",
      "startDate": "2025-01-23",
      "endDate": "2025-01-23",
      "status": "PENDING",
      "submittedAt": "2025-01-21T08:00:00"
    }
  ]
}
```

---

### 5. Get Specific Leave
**Endpoint**: `GET /api/leaves/{leaveId}`

**Example**: `GET /api/leaves/1`

**Response**:
```json
{
  "success": true,
  "message": "success",
  "data": {
    "id": 1,
    "employeeId": 1,
    "employeeName": "John Doe",
    "leaveType": "CASUAL",
    "startDate": "2025-01-20",
    "endDate": "2025-01-22",
    "reason": "Personal work",
    "status": "APPROVED",
    "submittedAt": "2025-01-18T09:00:00",
    "approvedBy": "admin",
    "reviewedAt": "2025-01-18T14:30:00"
  }
}
```

---

### 6. Approve Leave
**Endpoint**: `POST /api/leaves/{leaveId}/approve`

**Request Body**:
```json
{
  "approverId": 3
}
```

**Response**:
```json
{
  "success": true,
  "message": "Leave approved successfully",
  "data": {
    "id": 2,
    "employeeId": 1,
    "employeeName": "John Doe",
    "leaveType": "SICK",
    "startDate": "2025-01-23",
    "endDate": "2025-01-23",
    "status": "APPROVED",
    "approvedBy": "admin",
    "reviewedAt": "2025-01-21T11:00:00"
  }
}
```

---

### 7. Reject Leave
**Endpoint**: `POST /api/leaves/{leaveId}/reject`

**Request Body**:
```json
{
  "approverId": 3,
  "reason": "Project deadline is on that date"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Leave rejected",
  "data": {
    "id": 5,
    "employeeId": 1,
    "leaveType": "CASUAL",
    "status": "REJECTED",
    "rejectionReason": "Project deadline is on that date",
    "approvedBy": "admin",
    "reviewedAt": "2025-01-21T11:05:00"
  }
}
```

---

## Leave Balance Endpoints

### 1. Get Leave Balance
**Endpoint**: `GET /api/leaves/balance/{employeeId}`

**Example**: `GET /api/leaves/balance/1`

**Response**:
```json
{
  "success": true,
  "message": "success",
  "data": {
    "id": 1,
    "casualLeavesTotal": 10,
    "casualLeavesUsed": 2,
    "casualLeavesRemaining": 8,
    "sickLeavesTotal": 6,
    "sickLeavesUsed": 1,
    "sickLeavesRemaining": 5,
    "earnedLeavesTotal": 12,
    "earnedLeavesUsed": 0,
    "earnedLeavesRemaining": 12,
    "lastUpdated": "2025-01-21T11:00:00"
  }
}
```

---

### 2. Initialize Leave Balance
**Endpoint**: `POST /api/leaves/balance/initialize/{employeeId}`

**Example**: `POST /api/leaves/balance/initialize/2`

**Response**:
```json
{
  "success": true,
  "message": "Leave balance initialized successfully",
  "data": {
    "id": 2,
    "casualLeavesTotal": 10,
    "casualLeavesUsed": 0,
    "casualLeavesRemaining": 10,
    "sickLeavesTotal": 6,
    "sickLeavesUsed": 0,
    "sickLeavesRemaining": 6,
    "earnedLeavesTotal": 12,
    "earnedLeavesUsed": 0,
    "earnedLeavesRemaining": 12,
    "lastUpdated": "2025-01-21T12:00:00"
  }
}
```

---

## Using with cURL

### Submit Leave Request
```bash
curl -X POST http://localhost:8080/api/leaves \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": 1,
    "leaveType": "CASUAL",
    "startDate": "2025-01-25",
    "endDate": "2025-01-27",
    "reason": "Medical appointment"
  }'
```

### Get Leave Balance
```bash
curl -X GET http://localhost:8080/api/leaves/balance/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Recent Leaves
```bash
curl -X GET "http://localhost:8080/api/leaves/employee/1/recent?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Approve Leave
```bash
curl -X POST http://localhost:8080/api/leaves/1/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "approverId": 3
  }'
```

---

## Using with JavaScript/Fetch

### Submit Leave Request
```javascript
async function submitLeave(employeeId, leaveType, startDate, endDate, reason) {
  const token = localStorage.getItem('token');
  
  const response = await fetch('http://localhost:8080/api/leaves', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason
    })
  });
  
  const data = await response.json();
  return data;
}
```

### Get Leave Balance
```javascript
async function getLeaveBalance(employeeId) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:8080/api/leaves/balance/${employeeId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data.data;
}
```

### Get Recent Leaves
```javascript
async function getRecentLeaves(employeeId, limit = 5) {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    `http://localhost:8080/api/leaves/employee/${employeeId}/recent?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  return data.data;
}
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Leave request submitted |
| 400 | Bad Request - Invalid data or insufficient balance |
| 401 | Unauthorized - Missing/invalid token |
| 404 | Not Found - Resource not found |
| 500 | Server Error - Backend error |

---

## Common Error Responses

### Invalid Input
```json
{
  "success": false,
  "message": "Insufficient leave balance",
  "data": null
}
```

### Missing Employee
```json
{
  "success": false,
  "message": "Employee not found",
  "data": null
}
```

### Invalid Status Change
```json
{
  "success": false,
  "message": "Only PENDING leaves can be approved",
  "data": null
}
```

---

## Testing Workflow

1. **Create Leave Request**
   ```
   POST /api/leaves with all required fields
   ```

2. **Verify Submitted**
   ```
   GET /api/leaves/employee/{employeeId}/recent
   Check if leave appears with status PENDING
   ```

3. **Check Balance Updated**
   ```
   GET /api/leaves/balance/{employeeId}
   Check if "Used" count increased when approved
   ```

4. **Approve Leave**
   ```
   POST /api/leaves/{leaveId}/approve with approverId
   ```

5. **Verify Approval**
   ```
   GET /api/leaves/{leaveId}
   Check status is APPROVED
   ```

---

## Notes

- All timestamps are in ISO 8601 format
- Dates are in YYYY-MM-DD format
- Employee ID and Approver ID must exist
- Leave type must be uppercase: SICK, CASUAL, or EARNED
- Start date must be before or equal to end date
- Leave balance is validated before submission
