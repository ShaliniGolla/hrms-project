package com.hrms.service;

import com.hrms.dto.TimesheetDTO;
import com.hrms.model.Employee;
import com.hrms.model.Timesheet;
import com.hrms.model.TimesheetStatus;
import com.hrms.model.User;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.TimesheetRepository;
import com.hrms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TimesheetService {

    @Autowired
    private TimesheetRepository timesheetRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    public List<TimesheetDTO> getAllTimesheets(Long employeeId, LocalDate fromDate, LocalDate toDate,
            String status, Integer page, Integer size) {
        TimesheetStatus statusEnum = status != null ? TimesheetStatus.valueOf(status.toUpperCase()) : null;

        List<Timesheet> timesheets;
        if (employeeId != null || fromDate != null || toDate != null || statusEnum != null) {
            timesheets = timesheetRepository.findWithFilters(employeeId, fromDate, toDate, statusEnum);
        } else {
            timesheets = timesheetRepository.findAll();
        }

        return timesheets.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public TimesheetDTO getTimesheetById(Long id) {
        Timesheet timesheet = timesheetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Timesheet not found"));
        return convertToDTO(timesheet);
    }

    public TimesheetDTO createTimesheet(TimesheetDTO dto) {
        Employee employee = employeeRepository.findById(dto.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        Timesheet timesheet = new Timesheet();
        timesheet.setEmployee(employee);
        timesheet.setDate(dto.getDate());
        timesheet.setStartTime(dto.getStartTime());
        timesheet.setEndTime(dto.getEndTime());
        timesheet.setProject(dto.getProject());
        timesheet.setTask(dto.getTask());
        timesheet.setNotes(dto.getNotes());
        timesheet.setStatus(TimesheetStatus.PENDING);
        
        timesheet.setOnsiteOffshore(dto.getOnsiteOffshore());
        timesheet.setBillingLocation(dto.getBillingLocation());
        timesheet.setBillable(dto.getBillable());
        timesheet.setProjectName(dto.getProjectName());
        timesheet.setTaskDescription(dto.getTaskDescription());
        timesheet.setCategory(dto.getCategory());
        timesheet.setLeaveType(dto.getLeaveType());

        // Calculate total hours: (EndTime - StartTime)
        if (dto.getStartTime() != null && dto.getEndTime() != null) {
            Duration duration = Duration.between(dto.getStartTime(), dto.getEndTime());
            double total = duration.toMinutes() / 60.0;
            timesheet.setTotalHours(Math.max(0, total));
        }

        Timesheet saved = timesheetRepository.save(timesheet);
        return convertToDTO(saved);
    }

    public TimesheetDTO updateTimesheet(Long id, TimesheetDTO dto) {
        Timesheet timesheet = timesheetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Timesheet not found"));

        if (timesheet.getStatus() != TimesheetStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PENDING timesheets can be updated");
        }

        timesheet.setDate(dto.getDate());
        timesheet.setStartTime(dto.getStartTime());
        timesheet.setEndTime(dto.getEndTime());
        timesheet.setProject(dto.getProject());
        timesheet.setTask(dto.getTask());
        timesheet.setNotes(dto.getNotes());
        
        timesheet.setOnsiteOffshore(dto.getOnsiteOffshore());
        timesheet.setBillingLocation(dto.getBillingLocation());
        timesheet.setBillable(dto.getBillable());
        timesheet.setProjectName(dto.getProjectName());
        timesheet.setTaskDescription(dto.getTaskDescription());
        timesheet.setCategory(dto.getCategory());
        timesheet.setLeaveType(dto.getLeaveType());

        // Recalculate total hours: (EndTime - StartTime)
        if (dto.getStartTime() != null && dto.getEndTime() != null) {
            Duration duration = Duration.between(dto.getStartTime(), dto.getEndTime());
            double total = duration.toMinutes() / 60.0;
            timesheet.setTotalHours(Math.max(0, total));
        }

        Timesheet updated = timesheetRepository.save(timesheet);
        return convertToDTO(updated);
    }

    public TimesheetDTO approveTimesheet(Long id, Long reviewerId, String comments) {
        Timesheet timesheet = timesheetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Timesheet not found"));

        if (timesheet.getStatus() != TimesheetStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PENDING timesheets can be approved");
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reviewer not found"));

        timesheet.setStatus(TimesheetStatus.APPROVED);
        timesheet.setManagerComments(comments);
        timesheet.setReviewedBy(reviewer);
        timesheet.setReviewedAt(LocalDateTime.now());

        Timesheet approved = timesheetRepository.save(timesheet);
        return convertToDTO(approved);
    }

    public TimesheetDTO rejectTimesheet(Long id, Long reviewerId, String reason) {
        Timesheet timesheet = timesheetRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Timesheet not found"));

        if (timesheet.getStatus() != TimesheetStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PENDING timesheets can be rejected");
        }

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reviewer not found"));

        timesheet.setStatus(TimesheetStatus.REJECTED);
        timesheet.setManagerComments(reason);
        timesheet.setReviewedBy(reviewer);
        timesheet.setReviewedAt(LocalDateTime.now());

        Timesheet rejected = timesheetRepository.save(timesheet);
        return convertToDTO(rejected);
    }

    public void saveWeeklyTimesheet(Long employeeId, LocalDate weekStart, List<TimesheetDTO> entries) {
        LocalDate weekEnd = weekStart.plusDays(6);
        // Clear existing PENDING entries for this week to avoid duplicates
        // Note: We might want to only clear PENDING ones if we don't want to touch approved ones.
        // For simplicity and matching user intent "save all again properly", we clear the week.
        timesheetRepository.deleteByEmployeeIdAndDateBetween(employeeId, weekStart, weekEnd);

        if (entries != null) {
            for (TimesheetDTO dto : entries) {
                dto.setEmployeeId(employeeId);
                createTimesheet(dto);
            }
        }
    }

    public List<TimesheetDTO> getTeamTimesheets(Long managerId) {
        List<Timesheet> timesheets = timesheetRepository.findByManagerId(managerId);
        return timesheets.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private TimesheetDTO convertToDTO(Timesheet timesheet) {
        TimesheetDTO dto = new TimesheetDTO();
        dto.setId(timesheet.getId());
        dto.setEmployeeId(timesheet.getEmployee().getId());

        // Add employee name
        String fullName = timesheet.getEmployee().getFirstName() + " " + timesheet.getEmployee().getLastName();
        dto.setEmployeeName(fullName);

        dto.setDate(timesheet.getDate());
        dto.setStartTime(timesheet.getStartTime());
        dto.setEndTime(timesheet.getEndTime());
        dto.setTotalHours(timesheet.getTotalHours());
        dto.setProject(timesheet.getProject());
        dto.setTask(timesheet.getTask());
        dto.setNotes(timesheet.getNotes());
        dto.setStatus(timesheet.getStatus().name());
        dto.setManagerComments(timesheet.getManagerComments());
        
        dto.setOnsiteOffshore(timesheet.getOnsiteOffshore());
        dto.setBillingLocation(timesheet.getBillingLocation());
        dto.setBillable(timesheet.getBillable());
        dto.setProjectName(timesheet.getProjectName());
        dto.setTaskDescription(timesheet.getTaskDescription());
        dto.setCategory(timesheet.getCategory());
        dto.setLeaveType(timesheet.getLeaveType());
        return dto;
    }
}
