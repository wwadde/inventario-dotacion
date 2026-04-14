package com.inventario.dotacion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class DotacionApplication {

	public static void main(String[] args) {
		SpringApplication.run(DotacionApplication.class, args);
	}

}
