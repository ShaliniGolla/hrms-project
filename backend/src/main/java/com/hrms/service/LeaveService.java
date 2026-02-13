package com.hrms.service;

import com.hrms.dto.LeaveDTO;
import com.hrms.dto.CalendarAttendanceDTO;
import com.hrms.model.Employee;
import com.hrms.model.Leave;
import com.hrms.model.LeaveBalance;
import com.hrms.model.LeaveStatus;
import com.hrms.model.LeaveType;
import com.hrms.model.User;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.LeaveRepository;
import com.hrms.repository.LeaveBalanceRepository;
import com.hrms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class LeaveService {
    
    @Autowired
    private LeaveRepository leaveRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LeaveBalanceRepository leaveBalanceRepository;

    @Autowired
    private com.hrms.repository.EmployeeReportingRepository employeeReportingRepository;
        // Fetch all leaves for team members of a manager
        public List<Leave> getTeamLeavesByManagerId(Long managerId) {
            List<com.hrms.model.EmployeeReporting> team = employeeReportingRepository.findAllByReportingManager_Id(managerId);
            List<Long> employeeIds = team.stream().map(er -> er.getEmployee().getId()).collect(java.util.stream.Collectors.toList());
            if (employeeIds.isEmpty()) {
                return java.util.Collections.emptyList();
            }
            return leaveRepository.findByEmployeeIdIn(employeeIds);
        }
    
    public List<LeaveDTO> getAllLeaves() {
        return leaveRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public LeaveDTO getLeaveById(Long id) {
        Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave not found"));
        return convertToDTO(leave);
    }
    
    public List<LeaveDTO> getLeavesByEmployeeId(Long employeeId) {
        return leaveRepository.findByEmployeeIdOrderBySubmittedAtDesc(employeeId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<LeaveDTO> getRecentLeavesByEmployeeId(Long employeeId, int limit) {
        return leaveRepository.findByEmployeeIdOrderBySubmittedAtDesc(employeeId).stream()
                .limit(limit)
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public LeaveDTO createLeave(LeaveDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeId(dto.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave balance not found"));
        
        LeaveType leaveType = LeaveType.valueOf(dto.getLeaveType().toUpperCase());
        int daysRequested = calculateLeaveDays(dto.getStartDate(), dto.getEndDate());
        
        // Check if employee has sufficient balance
        if (!hassufficientBalance(balance, leaveType, daysRequested)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient leave balance");
        }
        
        Leave leave = new Leave();
        leave.setEmployee(employee);
        leave.setStartDate(dto.getStartDate());
        leave.setEndDate(dto.getEndDate());
        leave.setLeaveType(leaveType);
        leave.setReason(dto.getReason());
        leave.setStatus(LeaveStatus.PENDING);
        
        Leave saved = leaveRepository.save(leave);
        
        // Deduct balance immediately on submission
        updateLeaveBalance(saved, true);
        
        return convertToDTO(saved);
    }
    
    public LeaveDTO approveLeave(Long id, Long approverId) {
        Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave not found"));
        
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PENDING leaves can be approved");
        }
        
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Approver not found"));
        
        leave.setStatus(LeaveStatus.APPROVED);
        leave.setApprovedBy(approver);
        leave.setReviewedAt(LocalDateTime.now());
        
        Leave approved = leaveRepository.save(leave);
        // Balance already deducted on submission, no need to update here.
        
        return convertToDTO(approved);
    }
    
    public LeaveDTO rejectLeave(Long id, Long approverId, String reason) {
        Leave leave = leaveRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave not found"));
        
        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PENDING leaves can be rejected");
        }
        
        User approver = userRepository.findById(approverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Approver not found"));
        
        leave.setStatus(LeaveStatus.REJECTED);
        leave.setRejectionReason(reason);
        leave.setApprovedBy(approver);
        leave.setReviewedAt(LocalDateTime.now());
        
        Leave rejected = leaveRepository.save(leave);
        
        // Restore balance on rejection
        updateLeaveBalance(rejected, false);
        
        return convertToDTO(rejected);
    }
    
    private boolean hassufficientBalance(LeaveBalance balance, LeaveType leaveType, int daysRequested) {
        return switch (leaveType) {
            case CASUAL -> balance.getCasualLeavesRemaining() >= daysRequested;
            case SICK -> balance.getSickLeavesRemaining() >= daysRequested;
            case EARNED -> balance.getEarnedLeavesRemaining() >= daysRequested;
        };
    }
    
    private int calculateLeaveDays(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) return 0;
        int days = 0;
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            if (date.getDayOfWeek() != java.time.DayOfWeek.SATURDAY && date.getDayOfWeek() != java.time.DayOfWeek.SUNDAY) {
                days++;
            }
        }
        return days;
    }
    
    private void updateLeaveBalance(Leave leave, boolean deduct) {
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeId(leave.getEmployee().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leave balance not found"));
        
        int days = calculateLeaveDays(leave.getStartDate(), leave.getEndDate());
        int change = deduct ? days : -days;
        
        switch (leave.getLeaveType()) {
            case CASUAL:
                balance.setCasualLeavesUsed(Math.max(0, balance.getCasualLeavesUsed() + change));
                break;
            case SICK:
                balance.setSickLeavesUsed(Math.max(0, balance.getSickLeavesUsed() + change));
                break;
            case EARNED:
                balance.setEarnedLeavesUsed(Math.max(0, balance.getEarnedLeavesUsed() + change));
                break;
        }
        
        leaveBalanceRepository.save(balance);
    }

    public CalendarAttendanceDTO getCalendarAttendance(LocalDate start, LocalDate end) {
        System.out.println("CALENDAR_DEBUG: Fetching attendance from " + start + " to " + end);
        try {
            // Use repository to filter by status directly
            List<Leave> allApproved = leaveRepository.findByStatus(LeaveStatus.APPROVED);
            
            System.out.println("CALENDAR_DEBUG: Total approved leaves in DB: " + allApproved.size());

            // Filter by date range in memory
            List<Leave> approvedLeaves = allApproved.stream()
                    .filter(l -> l.getStartDate() != null && l.getEndDate() != null)
                    .filter(l -> !(l.getEndDate().isBefore(start) || l.getStartDate().isAfter(end)))
                    .collect(Collectors.toList());
            
            System.out.println("CALENDAR_DEBUG: Approved leaves in range: " + approvedLeaves.size());

            Map<String, List<String>> dailyLeaves = new HashMap<>();

            for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
                if (date.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
                    continue;
                }

                final LocalDate current = date;
                List<String> names = approvedLeaves.stream()
                        .filter(l -> l.getEmployee() != null)
                        .filter(l -> !current.isBefore(l.getStartDate()) && !current.isAfter(l.getEndDate()))
                        .map(l -> l.getEmployee().getFirstName() + " " + l.getEmployee().getLastName())
                        .collect(Collectors.toList());

                if (!names.isEmpty()) {
                    dailyLeaves.put(current.toString(), names);
                }
            }

            return new CalendarAttendanceDTO(dailyLeaves);
        } catch (Exception e) {
            System.err.println("CALENDAR_ERROR: Failed to calculate attendance: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    
    public LeaveDTO convertToDTO(Leave leave) {
        LeaveDTO dto = new LeaveDTO();
        dto.setId(leave.getId());
        dto.setEmployeeId(leave.getEmployee().getId());
        dto.setEmployeeName(leave.getEmployee().getFirstName() + " " + leave.getEmployee().getLastName());
        dto.setStartDate(leave.getStartDate());
        dto.setEndDate(leave.getEndDate());
        dto.setLeaveType(leave.getLeaveType().name());
        dto.setReason(leave.getReason());
        dto.setStatus(leave.getStatus().name());
        dto.setRejectionReason(leave.getRejectionReason());
        dto.setSubmittedAt(leave.getSubmittedAt());
        if (leave.getApprovedBy() != null) {
            // Look up Employee by User to get full name
            String fullName = null;
            try {
                var empOpt = employeeRepository.findByUser(leave.getApprovedBy());
                if (empOpt.isPresent()) {
                    var emp = empOpt.get();
                    fullName = emp.getFirstName() + " " + emp.getLastName();
                }
            } catch (Exception ignored) {}
            dto.setApprovedBy(fullName != null ? fullName : leave.getApprovedBy().getUsername());
        }
        dto.setReviewedAt(leave.getReviewedAt());

        // Populate leave balance
        leaveBalanceRepository.findByEmployeeId(leave.getEmployee().getId()).ifPresent(balance -> {
            dto.setCasualLeavesRemaining(balance.getCasualLeavesRemaining());
            dto.setSickLeavesRemaining(balance.getSickLeavesRemaining());
            dto.setEarnedLeavesRemaining(balance.getEarnedLeavesRemaining());
        });

        return dto;
    }
}

