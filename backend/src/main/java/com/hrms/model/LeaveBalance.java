package com.hrms.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "leave_balances")
public class LeaveBalance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    @JsonIgnore
    private Employee employee;
    
    private Integer casualLeavesTotal = 0;
    private Integer casualLeavesUsed = 0;
    
    private Integer sickLeavesTotal = 0;
    private Integer sickLeavesUsed = 0;
    
    private Integer earnedLeavesTotal = 0;
    private Integer earnedLeavesUsed = 0;
    
    private LocalDateTime lastUpdated;
    
    @PrePersist
    protected void onCreate() {
        lastUpdated = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Employee getEmployee() {
        return employee;
    }
    
    public void setEmployee(Employee employee) {
        this.employee = employee;
    }
    
    public Integer getCasualLeavesTotal() {
        return casualLeavesTotal;
    }
    
    public void setCasualLeavesTotal(Integer casualLeavesTotal) {
        this.casualLeavesTotal = casualLeavesTotal;
    }
    
    public Integer getCasualLeavesUsed() {
        return casualLeavesUsed;
    }
    
    public void setCasualLeavesUsed(Integer casualLeavesUsed) {
        this.casualLeavesUsed = casualLeavesUsed;
    }
    
    public Integer getCasualLeavesRemaining() {
        return casualLeavesTotal - casualLeavesUsed;
    }
    
    public Integer getSickLeavesTotal() {
        return sickLeavesTotal;
    }
    
    public void setSickLeavesTotal(Integer sickLeavesTotal) {
        this.sickLeavesTotal = sickLeavesTotal;
    }
    
    public Integer getSickLeavesUsed() {
        return sickLeavesUsed;
    }
    
    public void setSickLeavesUsed(Integer sickLeavesUsed) {
        this.sickLeavesUsed = sickLeavesUsed;
    }
    
    public Integer getSickLeavesRemaining() {
        return sickLeavesTotal - sickLeavesUsed;
    }
    
    public Integer getEarnedLeavesTotal() {
        return earnedLeavesTotal;
    }
    
    public void setEarnedLeavesTotal(Integer earnedLeavesTotal) {
        this.earnedLeavesTotal = earnedLeavesTotal;
    }
    
    public Integer getEarnedLeavesUsed() {
        return earnedLeavesUsed;
    }
    
    public void setEarnedLeavesUsed(Integer earnedLeavesUsed) {
        this.earnedLeavesUsed = earnedLeavesUsed;
    }
    
    public Integer getEarnedLeavesRemaining() {
        return earnedLeavesTotal - earnedLeavesUsed;
    }
    
    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }
    
    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
