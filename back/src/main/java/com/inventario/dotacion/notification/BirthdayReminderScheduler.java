package com.inventario.dotacion.notification;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import com.inventario.dotacion.employee.Employee;
import com.inventario.dotacion.employee.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BirthdayReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(BirthdayReminderScheduler.class);

    private final EmployeeRepository employeeRepository;
    private final NotificationEmailService notificationEmailService;
    private final NotificationProperties notificationProperties;

    @Scheduled(
            cron = "${app.notifications.birthday-cron:0 0 8 * * *}",
            zone = "${app.notifications.birthday-zone:America/Bogota}"
    )
    public void sendDailyBirthdayGreetings() {
        if (!notificationProperties.isEnabled()) {
            return;
        }

        LocalDate today = LocalDate.now(resolveZoneId());
        List<Employee> birthdayEmployees = employeeRepository.findActiveEmployeesWithBirthday(
                today.getMonthValue(),
                today.getDayOfMonth()
        );

        if (birthdayEmployees.isEmpty()) {
            return;
        }

        for (Employee employee : birthdayEmployees) {
            notificationEmailService.sendBirthdayGreeting(employee, today);
        }

        log.info("Birthday reminders sent: {}", birthdayEmployees.size());
    }

    private ZoneId resolveZoneId() {
        try {
            return ZoneId.of(notificationProperties.getBirthdayZone());
        } catch (Exception ex) {
            return ZoneId.systemDefault();
        }
    }
}
