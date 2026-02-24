package com.hrms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendEmail(String[] to, String[] cc, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromEmail != null) {
                message.setFrom(fromEmail);
            }
            if (to != null && to.length > 0) {
                message.setTo((String[]) to);
            }
            if (cc != null && cc.length > 0) {
                message.setCc(cc);
            }
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            System.out.println("Email sent successfully to: " + String.join(", ", to));
        } catch (Exception e) {
            System.err.println("Failed to send email: " + e.getMessage());
        }
    }

    public void sendOtpEmail(String to, String otp) {
        String subject = "Your Password Reset OTP";
        String body = "Dear User,\n\n" +
                "Your OTP for password reset is: " + otp + "\n\n" +
                "This OTP will expire in 10 minutes. If you did not request this, please ignore this email.\n\n" +
                "Best regards,\n" +
                "HR Team";
        sendEmail(new String[] { to }, null, subject, body);
    }

    public void sendLeaveRequestEmail(String[] to, String[] cc, String employeeName, String leaveType, String startDate,
            String endDate, Double daysCount, String reason, String role, String breakdown, Double casualBal, Double sickBal, Double earnedBal) {
        String subject = "Leave Request Submitted: " + employeeName;
        StringBuilder body = new StringBuilder();
        body.append("Hello,\n\n");
        body.append("A leave request has been submitted with the following details:\n\n");
        body.append("Employee Name: ").append(employeeName).append("\n");
        body.append("Role:          ").append(role).append("\n");
        body.append("Leave Type:    ").append(leaveType).append("\n");
        body.append(String.format("Total Days:    %.1f\n", daysCount));
        body.append("Start Date:    ").append(startDate).append("\n");
        body.append("End Date:      ").append(endDate).append("\n");
        
        if (breakdown != null && !breakdown.isEmpty()) {
            body.append("\nLeave Breakdown:\n").append(breakdown).append("\n");
        }
        
        body.append("Reason:        ").append(reason).append("\n\n");
        body.append("Current Available Balances (Post-Request):\n");
        body.append(String.format(" - Casual Leaves: %.2f\n", casualBal));
        body.append(String.format(" - Sick Leaves:   %.2f\n", sickBal));
        body.append(String.format(" - Earned Leaves: %.2f\n\n", earnedBal));
        body.append("Please log in to the HRMS portal to take necessary action.\n\n");
        body.append("Best regards,\n");
        body.append("HRMS Notification System");
        
        sendEmail(to, cc, subject, body.toString());
    }

    public void sendLeaveStatusEmail(String[] to, String[] cc, String employeeName, String leaveType, String startDate,
            String endDate, Double daysCount, String status, String reason, String reviewerName, String breakdown, Double casualBal, Double sickBal, Double earnedBal) {
        String subject = "Leave Request " + status + ": " + employeeName;
        StringBuilder body = new StringBuilder();
        body.append("Hello ").append(employeeName).append(",\n\n");
        body.append("Your leave request has been ").append(status.toLowerCase()).append(".\n\n");
        body.append("Details:\n");
        body.append("--------------------------\n");
        body.append("Employee Name: ").append(employeeName).append("\n");
        body.append("Leave Type:    ").append(leaveType).append("\n");
        body.append(String.format("Total Days:    %.1f\n", daysCount));
        body.append("Leave Dates:   ").append(startDate).append(" to ").append(endDate).append("\n");
        
        if (breakdown != null && !breakdown.isEmpty()) {
            body.append("\nLeave Breakdown:\n").append(breakdown).append("\n");
        }
        
        body.append("Status:        ").append(status).append("\n");
        body.append("Approver:      ").append(reviewerName).append("\n");
        
        if (reason != null && !reason.isEmpty()) {
            body.append("Comments:      ").append(reason).append("\n");
        }
        
        body.append("--------------------------\n\n");
        body.append("Available Balances:\n");
        body.append(String.format(" - Casual Leaves: %.2f\n", casualBal));
        body.append(String.format(" - Sick Leaves:   %.2f\n", sickBal));
        body.append(String.format(" - Earned Leaves: %.2f\n\n", earnedBal));
        body.append("Best regards,\n");
        body.append("HRMS Notification System");
        
        sendEmail(to, cc, subject, body.toString());
    }
}
