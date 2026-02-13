# Quick Start Guide - Leave Management System

## 🚀 5-Minute Setup

### Prerequisites
- Java 17 or higher
- MySQL 8.0.33+ running
- Node.js (with npm)
- Git (optional)

### Step 1: Start Backend (Terminal 1)
```bash
cd backend
mvn clean compile
mvn spring-boot:run
```

**Wait for:** 
```
Tomcat started on port(s): 8080
```

### Step 2: Install Frontend (Terminal 2)
```bash
cd hrmsproject
npm install
```

### Step 3: Start Frontend (Terminal 2 - after npm install)
```bash
npm run dev
```

**You should see:**
```
VITE v... ready in XXX ms
Local: http://localhost:5173
```

### Step 4: Access Application
- Open browser: http://localhost:5173
- Login with admin or employee credentials
- Proceed to testing

---

## 📝 Default Test User Credentials

### Admin User
- Username: `admin`
- Password: Check your database or initial setup

### Employee Users
- Any employee created in the system
- Check Employee module for created accounts

---

## ✅ First-Time Verification

### Admin Dashboard
1. Navigate to Admin Dashboard
2. Check "Leave Requests" tab
3. Should show pending leaves (or empty if no leaves submitted)
4. Stats should show correct pending count

### Employee Dashboard  
1. Login as employee
2. Navigate to "Leave" tab
3. Should see:
   - Leave balance cards (Casual: 10, Sick: 6, Earned: 12)
   - Recent leave history table
4. Try requesting 3 casual days

### Approval Workflow
1. Employee submits casual leave (3 days)
2. Should see success toast
3. Login as admin
4. Go to Leave Requests tab
5. Click "Approve"
6. Should see success toast
7. Login back as employee
8. Refresh dashboard
9. Should see:
   - Status changed to APPROVED
   - Casual balance reduced to 7
   - Admin name in "Approved By" column

---

## 🔧 Troubleshooting

### Backend won't start
```bash
# Check if port 8080 is in use
# Or check MySQL connection
mvn spring-boot:run
```

**Common error:** MySQL connection failed
- Solution: Verify MySQL is running
- Check `application.properties` for correct credentials

### Frontend won't install
```bash
# Clear npm cache and retry
npm cache clean --force
npm install
```

### Toast notifications not showing
- Check browser console (F12 → Console)
- Verify `npm install` completed
- Check App.jsx has ToastContainer

### Leave balance shows 0
- Data initializer runs on first startup
- Check backend logs for errors
- Restart backend to re-initialize

---

## 📊 Key URLs

| Component | URL | Credentials |
|-----------|-----|-------------|
| Frontend | http://localhost:5173 | Admin/Employee |
| Backend API | http://localhost:8080/api | Bearer Token |
| Database | localhost:3306 | From app.properties |

---

## 🎯 Common Workflows

### Submit Leave Request
1. Login as employee
2. Click "Leave" tab in sidebar
3. Select leave type (Casual/Sick/Earned)
4. Pick start and end dates
5. Add reason
6. Click "Submit"
7. See success toast
8. Balance should decrease

### Approve Leave
1. Login as admin
2. Click "Leave Requests" tab
3. Find pending leave
4. Click "Approve"
5. See success toast
6. Employee's balance decreases

### Reject Leave
1. Login as admin
2. Click "Leave Requests" tab
3. Find pending leave
4. Click "Reject"
5. Modal appears asking for reason
6. Type rejection reason
7. Click "Reject" in modal
8. See success toast
9. Employee sees rejected status

---

## 🐛 Debug Mode

### Enable Backend Logging
Edit `backend/src/main/resources/application.properties`:
```properties
logging.level.root=INFO
logging.level.com.hrms=DEBUG
logging.level.org.hibernate.SQL=DEBUG
```

### Check API Responses
Use browser DevTools (F12 → Network tab):
1. Perform action (submit leave, approve, etc.)
2. See request/response in Network tab
3. Check for errors in Response body

### Database Queries
Monitor SQL queries in backend console:
```
Hibernate: 
    select ... from leaves ...
```

---

## 📋 Testing Checklist

Use these tests to verify system is working:

- [ ] Employee can view balance
- [ ] Employee can submit leave
- [ ] Toast shows on successful submission
- [ ] Balance decreases on approval
- [ ] Admin can see pending leaves
- [ ] Admin can approve leave
- [ ] Approval toast shows
- [ ] Employee sees approved status
- [ ] Admin can reject with reason
- [ ] Rejection toast shows
- [ ] Employee sees rejected status
- [ ] Employee balance unchanged on rejection

---

## 🔐 Security Notes

1. **JWT Token** required for authenticated endpoints
2. **CORS** configured for localhost only
3. **Password** stored as encrypted in database
4. **Balance validation** enforced on server-side

Do NOT use in production without:
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Database backups set up
- [ ] Error logging configured
- [ ] Rate limiting added

---

## 📞 Getting Help

1. **Check logs:** Terminal where you ran `mvn spring-boot:run`
2. **Check console:** Browser F12 → Console tab
3. **Check API:** Browser F12 → Network tab
4. **Restart backend:** Ctrl+C then `mvn spring-boot:run`
5. **Restart frontend:** Ctrl+C then `npm run dev`
6. **Clear browser cache:** Ctrl+Shift+Delete

---

## 🎓 Learning Resources

Files to review:
- `ADMIN_APPROVAL_WORKFLOW.md` - System architecture
- `LEAVE_SYSTEM_TESTING_GUIDE.md` - Detailed testing
- `IMPLEMENTATION_COMPLETE_CHECKLIST.md` - Feature list

Code files:
- Backend: `backend/src/main/java/com/hrms/`
- Frontend: `hrmsproject/src/pages/employee/` and `admin/`

---

## ⚡ Performance Tips

1. **Backend startup takes 30-60 seconds** - First time with DB initialization
2. **Subsequent startups are faster** - 10-15 seconds
3. **Clear browser cache** if CSS/JS doesn't update
4. **Reload browser** after backend restart
5. **Use incognito mode** to avoid cached JWT tokens

---

## 📞 Support Checklist

Before reporting issues:
- [ ] Backend running (check for "Tomcat on 8080")
- [ ] Frontend running (check for "ready in X ms")
- [ ] MySQL accessible (check DB connectivity)
- [ ] No browser console errors
- [ ] No backend console errors
- [ ] Network tab shows successful API calls
- [ ] User logged in with valid token

---

**System Status:** ✅ Ready for Development/Testing
**Last Updated:** January 21, 2026
**Estimated Setup Time:** 5 minutes
