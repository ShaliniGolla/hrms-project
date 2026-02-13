package com.hrms.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class LeaveDTO {
    private Long id;
    
    @NotNull(message = "Employee ID is required")
    private Long employeeId;
    
    private String employeeName;
    
    @NotNull(message = "Start date is required")
    private LocalDate startDate;
    
    @NotNull(message = "End date is required")
    private LocalDate endDate;
    
    @NotNull(message = "Leave type is required")
    private String leaveType;
    
    private String reason;
    private String status;
    private String rejectionReason;
    private LocalDateTime submittedAt;
    private String approvedBy;
    private LocalDateTime reviewedAt;
    
    private Integer casualLeavesRemaining;
    private Integer sickLeavesRemaining;
    private Integer earnedLeavesRemaining;
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getLeaveType() { return leaveType; }
    public void setLeaveType(String leaveType) { this.leaveType = leaveType; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public Integer getCasualLeavesRemaining() { return casualLeavesRemaining; }
    public void setCasualLeavesRemaining(Integer casualLeavesRemaining) { this.casualLeavesRemaining = casualLeavesRemaining; }
    public Integer getSickLeavesRemaining() { return sickLeavesRemaining; }
    public void setSickLeavesRemaining(Integer sickLeavesRemaining) { this.sickLeavesRemaining = sickLeavesRemaining; }
    public Integer getEarnedLeavesRemaining() { return earnedLeavesRemaining; }
    public void setEarnedLeavesRemaining(Integer earnedLeavesRemaining) { this.earnedLeavesRemaining = earnedLeavesRemaining; }
}

