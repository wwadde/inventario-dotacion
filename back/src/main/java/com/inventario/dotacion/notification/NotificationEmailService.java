package com.inventario.dotacion.notification;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

import com.inventario.dotacion.employee.Employee;
import gg.jte.TemplateEngine;
import gg.jte.output.StringOutput;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class NotificationEmailService {

    private static final Logger log = LoggerFactory.getLogger(NotificationEmailService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final TemplateEngine templateEngine;
    private final NotificationProperties notificationProperties;

    @Value("${app.company-name:Inventario Dotacion S.A.S.}")
    private String companyName;

    public void sendBirthdayGreeting(Employee employee, LocalDate today) {
        if (!notificationProperties.isEnabled()) {
            return;
        }

        if (!StringUtils.hasText(employee.getEmail())) {
            return;
        }

        Map<String, Object> model = new HashMap<>();
        model.put("companyName", companyName);
        model.put("employeeName", employee.getFullName());
        model.put("today", DATE_FORMATTER.format(today));

        sendHtmlEmail(
                employee.getEmail().trim(),
                notificationProperties.getBirthdaySubject(),
                "emails/birthday-greeting.jte",
                model
        );
    }

    private void sendHtmlEmail(String recipientEmail, String subject, String templateName, Map<String, Object> model) {
        try {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                log.warn("JavaMailSender is not configured; email was skipped for {}", recipientEmail);
                return;
            }

            StringOutput output = new StringOutput();
            templateEngine.render(templateName, model, output);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    true,
                    StandardCharsets.UTF_8.name()
            );
            helper.setFrom(notificationProperties.getMailFrom());
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(output.toString(), true);

            mailSender.send(mimeMessage);
        } catch (Exception ex) {
            log.warn("No fue posible enviar correo a {}", recipientEmail, ex);
        }
    }
}
