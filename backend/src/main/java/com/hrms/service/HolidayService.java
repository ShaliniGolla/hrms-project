package com.hrms.service;

import com.hrms.model.Holiday;
import com.hrms.repository.HolidayRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HolidayService {

    @Autowired
    private HolidayRepository holidayRepository;

    public List<Holiday> getAllHolidays() {
        return holidayRepository.findAll();
    }

    public List<Holiday> getHolidaysByYear(Integer year) {
        return holidayRepository.findByYear(year + "-%");
    }

    public Holiday createHoliday(Holiday holiday) {
        return holidayRepository.save(holiday);
    }

    public Holiday updateHoliday(Long id, Holiday holidayDetails) {
        Holiday holiday = holidayRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Holiday not found with id: " + id));

        holiday.setName(holidayDetails.getName());
        holiday.setDate(holidayDetails.getDate());

        return holidayRepository.save(holiday);
    }

    public void deleteHoliday(Long id) {
        holidayRepository.deleteById(id);
    }
}
