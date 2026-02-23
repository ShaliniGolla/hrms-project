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
            String endDate, String reason, String role) {
        String subject = "Leave Request Submitted: " + employeeName;
        String body = String.format(
                "Hello,\n\n" +
                        "A leave request has been submitted with the following details:\n\n" +
                        "Employee Name: %s\n" +
                        "Role:          %s\n" +
                        "Leave Type:    %s\n" +
                        "Start Date:    %s\n" +
                        "End Date:      %s\n" +
                        "Reason:        %s\n\n" +
                        "Please log in to the HRMS portal to take necessary action.\n\n" +
                        "Best regards,\n" +
                        "HRMS Notification System",
                employeeName, role, leaveType, startDate, endDate, reason);
        sendEmail(to, cc, subject, body);
    }

    public void sendLeaveStatusEmail(String[] to, String[] cc, String employeeName, String leaveType, String startDate,
            String endDate, String status, String reason, String reviewerName) {
        String subject = "Leave Request " + status + ": " + employeeName;
        String body = String.format(
                "Hello %s,\n\n" +
                        "Your leave request has been %s.\n\n" +
                        "Details:\n" +
                        "--------------------------\n" +
                        "Employee Name: %s\n" +
                        "Leave Type:    %s\n" +
                        "Leave Dates:   %s to %s\n" +
                        "Status:        %s\n" +
                        "Approver:      %s\n" +
                        (reason != null && !reason.isEmpty() ? "Comments:      " + reason + "\n" : "") +
                        "--------------------------\n\n" +
                        "Best regards,\n" +
                        "HRMS Notification System",
                employeeName, status.toLowerCase(), employeeName, leaveType, startDate, endDate, status, reviewerName);
        sendEmail(to, cc, subject, body);
    }
}
