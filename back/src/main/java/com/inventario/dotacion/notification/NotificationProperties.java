package com.inventario.dotacion.notification;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.notifications")
public class NotificationProperties {

    private boolean enabled = false;

    private String mailFrom = "wwaddep@gmail.com";

    private String birthdaySubject = "Felicitaciones en tu cumpleanos";

    private String birthdayCron = "0 0 8 * * *";

    private String birthdayZone = "America/Bogota";
}
