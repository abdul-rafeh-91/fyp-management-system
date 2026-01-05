package com.fyp.management.system.fyp_management_system;

import com.fyp.management.system.fyp_management_system.service.FileStorageService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableConfigurationProperties
public class FypManagementSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(FypManagementSystemApplication.class, args);
	}
	
	@Bean
	CommandLineRunner init(FileStorageService fileStorageService) {
		return args -> {
			fileStorageService.init();
		};
	}

}
