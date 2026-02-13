package com.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManagerSummaryDTO {
    private Long id;
    private String fullName;
    private String email;
    private String corporateEmail;
}
