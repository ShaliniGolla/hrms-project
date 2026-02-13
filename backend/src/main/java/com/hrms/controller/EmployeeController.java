package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.EmployeeDTO;
import com.hrms.service.EmployeeService;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
// @CrossOrigin(origins = "http://localhost:3000") // OPTIONAL – can remove if global CORS exists
public class EmployeeController {

    @Autowired
    private EmployeeService employeeService;

    @Autowired
    private com.hrms.service.FileStorageService fileStorageService;

    @Autowired
    private com.hrms.repository.EmployeeRepository employeeRepository;

    /* =========================
       GET ALL EMPLOYEES
       ========================= */
    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeDTO>>> getAllEmployees() {

        List<EmployeeDTO> employees = employeeService.getAllEmployees();

        return ResponseEntity.ok(
                ApiResponse.success(employees)
        );
    }

    /* =========================
       GET EMPLOYEE BY ID
       ========================= */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeDTO>> getEmployeeById(
            @PathVariable Long id
    ) {
        EmployeeDTO employee = employeeService.getEmployeeById(id);

        return ResponseEntity.ok(
                ApiResponse.success(employee)
        );
    }

    /* =========================
       CREATE EMPLOYEE
       (PHASE 1 – PERSONAL DETAILS ONLY)
       ========================= */
    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeDTO>> createEmployee(
            @RequestBody EmployeeDTO dto
    ) {
        // Manual validation for debugging
        if (dto.getFirstName() == null || dto.getFirstName().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("First name is required"));
        }
        if (dto.getLastName() == null || dto.getLastName().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Last name is required"));
        }
        if (dto.getEmail() == null || dto.getEmail().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Email is required"));
        }
        
        EmployeeDTO created = employeeService.createEmployee(dto);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Employee created successfully",
                        created
                ));
    }

    /* =========================
       UPDATE EMPLOYEE
       ========================= */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeDTO>> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeDTO dto
    ) {
        EmployeeDTO updated = employeeService.updateEmployee(id, dto);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Employee updated successfully",
                        updated
                )
        );
    }

    /* =========================
       UPLOAD PHOTO
       ========================= */
    @PostMapping("/upload-photo")
    public ResponseEntity<?> uploadPhoto(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam("employeeId") Long employeeId
    ) {
        try {
            com.hrms.model.Employee employee = employeeRepository.findById(employeeId)
                    .orElseThrow(() -> new RuntimeException("Employee not found"));

            String fileName = fileStorageService.storeFile(file, "profile_" + employeeId);
            String fileDownloadUri = org.springframework.web.servlet.support.ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/uploads/")
                    .path(fileName)
                    .toUriString();

            employee.setPhotoPath(fileDownloadUri);
            employeeRepository.save(employee);

            return ResponseEntity.ok(ApiResponse.success("Photo uploaded successfully", fileDownloadUri));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Could not upload photo: " + e.getMessage()));
        }
    }

    /* =========================
       DELETE EMPLOYEE
       ========================= */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(
            @PathVariable Long id
    ) {
        employeeService.deleteEmployee(id);

        return ResponseEntity.ok(
                ApiResponse.success(
                        "Employee deleted successfully",
                        null
                )
        );
    }
}
