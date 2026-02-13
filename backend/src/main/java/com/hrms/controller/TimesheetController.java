package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.TimesheetDTO;
import com.hrms.dto.EmployeeDTO;
import com.hrms.model.User;
import com.hrms.model.UserPrincipal;
import com.hrms.model.Role;
import com.hrms.service.TimesheetService;
import com.hrms.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/timesheets")
@CrossOrigin(origins = "http://localhost:3000")
public class TimesheetController {

    @Autowired
    private TimesheetService timesheetService;

    @Autowired
    private EmployeeService employeeService;

    private Long getEmployeeIdFromAuth(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()
                && authentication.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
            User user = userPrincipal.getUser();
            try {
                EmployeeDTO employee = employeeService.getEmployeeByUserId(user.getId());
                return employee.getId();
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<TimesheetDTO>>> getAllTimesheets(
            Authentication authentication,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "0") Integer page,
            @RequestParam(required = false, defaultValue = "10") Integer size) {

        Long effectiveEmployeeId = employeeId;
        
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
            User user = principal.getUser();
            
            // If user is just an EMPLOYEE or REPORTING_MANAGER, force them to only see their own timesheets.
            // ADMIN and HR can see anyone's timesheets.
            if (user.getRole() == Role.EMPLOYEE || user.getRole() == Role.REPORTING_MANAGER) {
                Long authEmployeeId = getEmployeeIdFromAuth(authentication);
                if (authEmployeeId != null) {
                    effectiveEmployeeId = authEmployeeId;
                }
            }
        }

        List<TimesheetDTO> timesheets = timesheetService.getAllTimesheets(
                effectiveEmployeeId, fromDate, toDate, status, page, size);
        return ResponseEntity.ok(ApiResponse.success(timesheets));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TimesheetDTO>> getTimesheetById(@PathVariable Long id) {
        TimesheetDTO timesheet = timesheetService.getTimesheetById(id);
        return ResponseEntity.ok(ApiResponse.success(timesheet));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TimesheetDTO>> createTimesheet(
            @Valid @RequestBody TimesheetDTO dto,
            Authentication authentication) {

        Long authEmployeeId = getEmployeeIdFromAuth(authentication);
        if (authEmployeeId != null) {
            dto.setEmployeeId(authEmployeeId);
        } else if (dto.getEmployeeId() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Employee profile not found. Are you logged in?"));
        }

        TimesheetDTO created = timesheetService.createTimesheet(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Timesheet submitted successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TimesheetDTO>> updateTimesheet(
            @PathVariable Long id,
            @Valid @RequestBody TimesheetDTO dto) {
        TimesheetDTO updated = timesheetService.updateTimesheet(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Timesheet updated successfully", updated));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<TimesheetDTO>> approveTimesheet(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        Long reviewerId = Long.valueOf(request.get("reviewerId").toString());
        String comments = request.getOrDefault("comments", "").toString();
        TimesheetDTO approved = timesheetService.approveTimesheet(id, reviewerId, comments);
        return ResponseEntity.ok(ApiResponse.success("Timesheet approved successfully", approved));
    }

    @GetMapping("/manager/{managerId}/team-timesheets")
    public ResponseEntity<ApiResponse<List<TimesheetDTO>>> getTeamTimesheets(@PathVariable Long managerId) {
        List<TimesheetDTO> timesheets = timesheetService.getTeamTimesheets(managerId);
        return ResponseEntity.ok(ApiResponse.success(timesheets));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<TimesheetDTO>> rejectTimesheet(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        Long reviewerId = Long.valueOf(request.get("reviewerId").toString());
        String reason = request.get("reason").toString();
        TimesheetDTO rejected = timesheetService.rejectTimesheet(id, reviewerId, reason);
        return ResponseEntity.ok(ApiResponse.success("Timesheet rejected", rejected));
    }

    @PostMapping("/save-weekly")
    public ResponseEntity<ApiResponse<Void>> saveWeekly(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        Long employeeId = getEmployeeIdFromAuth(authentication);
        if (employeeId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Employee not found"));
        }

        LocalDate weekStart = LocalDate.parse(request.get("weekStart").toString().split("T")[0]);
        List<Map<String, Object>> entriesList = (List<Map<String, Object>>) request.get("entries");
        
        // Convert Map to DTOs
        List<TimesheetDTO> dtos = entriesList.stream().map(m -> {
            TimesheetDTO d = new TimesheetDTO();
            d.setDate(LocalDate.parse(m.get("date").toString()));
            d.setStartTime(java.time.LocalTime.parse(m.get("startTime").toString()));
            d.setEndTime(java.time.LocalTime.parse(m.get("endTime").toString()));
            d.setProject(m.get("project") != null ? m.get("project").toString() : null);
            d.setTask(m.get("task") != null ? m.get("task").toString() : null);
            d.setNotes(m.get("notes") != null ? m.get("notes").toString() : null);
            d.setCategory(m.get("category") != null ? m.get("category").toString() : null);
            d.setProjectName(m.get("projectName") != null ? m.get("projectName").toString() : null);
            d.setTaskDescription(m.get("taskDescription") != null ? m.get("taskDescription").toString() : null);
            d.setOnsiteOffshore(m.get("onsiteOffshore") != null ? m.get("onsiteOffshore").toString() : null);
            d.setBillingLocation(m.get("billingLocation") != null ? m.get("billingLocation").toString() : null);
            d.setBillable(m.get("billable") != null ? (Boolean)m.get("billable") : null);
            d.setLeaveType(m.get("leaveType") != null ? m.get("leaveType").toString() : null);
            return d;
        }).collect(Collectors.toList());

        timesheetService.saveWeeklyTimesheet(employeeId, weekStart, dtos);
        return ResponseEntity.ok(ApiResponse.success("Weekly timesheet saved successfully", null));
    }
}
