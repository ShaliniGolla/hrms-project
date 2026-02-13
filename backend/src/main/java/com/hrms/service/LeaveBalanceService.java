package com.hrms.service;

import com.hrms.model.Employee;
import com.hrms.model.LeaveBalance;
import com.hrms.repository.LeaveBalanceRepository;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.CompanyDetailRepository;
import com.hrms.model.CompanyDetail;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class LeaveBalanceService {

    @Autowired
    private LeaveBalanceRepository leaveBalanceRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private CompanyDetailRepository companyDetailRepository;

    public LeaveBalance initializeLeaveBalance(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));

        // Check if balance already exists
        if (leaveBalanceRepository.findByEmployeeId(employeeId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Leave balance already exists for this employee");
        }

        LeaveBalance balance = new LeaveBalance();
        balance.setEmployee(employee);
        balance.setCasualLeavesTotal(0);
        balance.setCasualLeavesUsed(0);
        balance.setSickLeavesTotal(0);
        balance.setSickLeavesUsed(0);
        balance.setEarnedLeavesTotal(0);
        balance.setEarnedLeavesUsed(0);

        LeaveBalance saved = leaveBalanceRepository.save(balance);
        return refreshLeaveBalance(saved);
    }

    public LeaveBalance refreshLeaveBalance(LeaveBalance balance) {
        if (balance == null || balance.getEmployee() == null) return balance;
        
        CompanyDetail detail = companyDetailRepository.findByEmployee_Id(balance.getEmployee().getId())
                .orElse(null);
        
        if (detail == null || detail.getJoiningDate() == null) {
            // No joining date, keep at 0
            return balance;
        }

        LocalDate now = LocalDate.now();
        LocalDate joiningDate = detail.getJoiningDate();
        
        long monthsSinceJoining = ChronoUnit.MONTHS.between(joiningDate, now);
        
        // Rules:
        // 1. First 6 months: 0
        // 2. After 6 months: 6 Sick, 10 Casual
        // 3. After 1 year: +1 Earned per month (starting from month 13)
        
        if (monthsSinceJoining < 6) {
            balance.setSickLeavesTotal(0);
            balance.setCasualLeavesTotal(0);
            balance.setEarnedLeavesTotal(0);
        } else {
            balance.setSickLeavesTotal(6);
            balance.setCasualLeavesTotal(10);
            
            if (monthsSinceJoining >= 12) {
                // months 12, 13, 14...
                // At exactly 12 months, do they get 1? 
                // "after one year from joining date keep adding 1 earned leave per month"
                // Let's assume anniversary month (12) is the first month they get 1.
                int earned = (int) (monthsSinceJoining - 11); 
                balance.setEarnedLeavesTotal(earned);
            } else {
                balance.setEarnedLeavesTotal(0);
            }
        }
        
        return leaveBalanceRepository.save(balance);
    }

    public LeaveBalance getLeaveBalance(Long employeeId) {
        LeaveBalance balance = leaveBalanceRepository.findByEmployeeId(employeeId)
                .orElseGet(() -> initializeLeaveBalance(employeeId));
        return refreshLeaveBalance(balance);
    }

    public int getRemainingLeaves(Long employeeId) {
        LeaveBalance balance = getLeaveBalance(employeeId);
        return balance.getCasualLeavesRemaining() + balance.getSickLeavesRemaining()
                + balance.getEarnedLeavesRemaining();
    }
}
