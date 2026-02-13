package com.hrms.config;

import com.hrms.model.*;
import com.hrms.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private LeaveBalanceRepository leaveBalanceRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        System.out.println("=== DataSeeder: Starting ===");

        // Check if admin user already exists
        if (userRepository.findByUsername("admin").isEmpty()) {
            System.out.println("=== Creating admin user and sample employees ===");

            // Create admin user
            User admin = new User();
            admin.setUsername("admin");
            admin.setEmail("admin@hrms.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);

            System.out.println("✓ Admin user created");

            // Create HR user
            User hr = new User();
            hr.setUsername("hr");
            hr.setEmail("hr@hrms.com");
            hr.setPassword(passwordEncoder.encode("hr123"));
            hr.setRole(Role.HR);
            hr.setActive(true);
            userRepository.save(hr);

            System.out.println("✓ HR user created");

            // Create departments
            Department itDept = new Department();
            itDept.setName("IT");
            itDept.setDescription("Information Technology");
            itDept = departmentRepository.save(itDept);

            Department hrDept = new Department();
            hrDept.setName("HR");
            hrDept.setDescription("Human Resources");
            hrDept = departmentRepository.save(hrDept);

            System.out.println("✓ Departments created");

            // Create sample employees
            // createSampleEmployee("John", "Doe", "john.doe@company.com", "9876543210",
            // itDept, "Software Engineer");
            // createSampleEmployee("Jane", "Smith", "jane.smith@company.com", "9876543211",
            // itDept, "Senior Developer");
            // createSampleEmployee("Mike", "Johnson", "mike.johnson@company.com",
            // "9876543212", hrDept, "HR Manager");
            // createSampleEmployee("Sarah", "Williams", "sarah.williams@company.com",
            // "9876543213", hrDept, "Recruiter");
            // createSampleEmployee("David", "Brown", "david.brown@company.com",
            // "9876543214", itDept, "Team Lead");

            System.out.println("✓ Sample employees created");
            System.out.println("\n=== Login Credentials ===");
            System.out.println("Admin - Username: admin, Password: admin123");
            System.out.println("HR    - Username: hr, Password: hr123");
        } else {
            System.out.println("=== Admin user already exists, skipping seed ===");
        }

        // Initialize leave balances for any employees without them
        initializeLeaveBalances();

        System.out.println("=== DataSeeder: Completed ===");
    }

    private void createSampleEmployee(String firstName, String lastName, String email,
            String phone, Department dept, String designation) {
        Employee employee = new Employee();
        employee.setFirstName(firstName);
        employee.setLastName(lastName);
        employee.setEmail(email);
        employee.setPhoneNumber(phone);
        employee.setDepartment(dept);
        employee.setHireDate(LocalDate.now().minusMonths((long) (Math.random() * 24)));
        employee.setDesignation(designation);
        employee.setGender(Math.random() > 0.5 ? "Male" : "Female");
        employee.setActive(true);
        employeeRepository.save(employee);
    }

    private void initializeLeaveBalances() {
        employeeRepository.findAll().forEach(employee -> {
            if (leaveBalanceRepository.findByEmployeeId(employee.getId()).isEmpty()) {
                LeaveBalance balance = new LeaveBalance();
                balance.setEmployee(employee);
                balance.setCasualLeavesTotal(10);
                balance.setCasualLeavesUsed(0);
                balance.setSickLeavesTotal(6);
                balance.setSickLeavesUsed(0);
                balance.setEarnedLeavesTotal(12);
                balance.setEarnedLeavesUsed(0);
                leaveBalanceRepository.save(balance);
            }
        });
    }
}
