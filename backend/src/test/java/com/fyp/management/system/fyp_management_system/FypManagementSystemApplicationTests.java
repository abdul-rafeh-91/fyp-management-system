package com.fyp.management.system.fyp_management_system;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
		"spring.mail.host=localhost",
		"spring.mail.port=3025"
})
class FypManagementSystemApplicationTests {

	@Test
	void contextLoads() {
		// Context loads successfully with H2 in-memory database
	}

}
