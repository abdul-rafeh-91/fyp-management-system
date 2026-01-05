# Final Year Project (FYP) Management System

## 1. Project Overview
This is a comprehensive **FYP Management System** designed to streamline the academic project lifecycle. It facilitates interaction between **Students**, **Supervisors**, **Evaluators**, and the **FYP Committee**.

## 2. Technology Stack & Initialization
The project was initialized using **Spring Initializr** with a production-grade configuration suitable for enterprise applications.

- **Framework**: Spring Boot 3.1.5
- **Language**: Java 17 (LTS)
- **Build Tool**: Maven
- **Database**: MySQL 8.0
- **Frontend Library**: React.js (Vite)

### Key Dependencies
- **Spring Web**: Builds the RESTful API layer.
- **Spring Data JPA**: Implements the Repository pattern for database abstraction.
- **Spring Security**: Provides robust authentication and role-based access control (RBAC).
- **JJWT (JSON Web Token)**: Handles stateless, secure session management.
- **Lombok**: Reduces boilerplate code (Getters, Setters, Builders).
- **MySQL Driver**: Connects the application to the relational database.

## 3. Architecture & Design Principles
The system adheres to a **Layered Architecture**, ensuring separation of concerns, scalability, and testability.

### 3.1 Backend Architecture
1.  **Controller Layer** (`com.fyp.controller`):
    -   **Role**: Handles HTTP requests/responses.
    -   **Principle**: Follows the **Single Responsibility Principle (SRP)**. Controllers delegate business logic to Services.
2.  **Service Layer** (`com.fyp.service`):
    -   **Role**: Encapsulates business logic.
    -   **Principle**: **Encapsulation**. Defines the core operations of the system independent of the interface.
3.  **Repository Layer** (`com.fyp.repository`):
    -   **Role**: Manages data persistence.
    -   **Pattern**: **Repository Pattern**. We use `JpaRepository` interfaces to abstract SQL complexity.
4.  **Model Layer** (`com.fyp.model`):
    -   **Role**: Maps database tables to Java Objects (Entities).
    -   **Pattern**: **Object-Relational Mapping (ORM)** via Hibernate.

### 3.2 Design Patterns Applied
-   **Data Transfer Object (DTO)**: Decouples the internal database schema from the external API to enhance security and versioning.
-   **Dependency Injection (DI)**: Utilizes Spring's IoC container to inject dependencies (e.g., `@Autowired`, `@RequiredArgsConstructor`), promoting loose coupling.
-   **Singleton**: Service and Controller components are managed as Singletons for memory efficiency.

## 4. Database Schema (MySQL)
The database (`fyp_management`) is normalized to support complex academic relationships.

### Core Entities
-   **User**: The base entity supporting **Polymorphism** via Roles (`STUDENT`, `SUPERVISOR`, `EVALUATOR`, `FYP_COMMITTEE`).
-   **ProjectGroup**: Connects Students to Supervisors. One Supervisor manages multiple Groups; one Group contains multiple Students.
-   **Document**: Represents deliverables (Proposals, Theses). Linked to a Group.
-   **Review**: Qualitative feedback provided by Supervisors on Documents.
-   **Grade**: Quantitative scoring provided by Evaluators based on Rubrics.
-   **ChatMessage**: Persists real-time communication within Project Groups.

## 5. Setup & Execution Guide

### 5.1 Prerequisites
-   Java Development Kit (JDK) 17+
-   Node.js (v16+) & npm
-   MySQL Server

### 5.2 Database Setup
1.  Open your MySQL Workbench or Terminal.
2.  Create the database: `CREATE DATABASE fyp_management;`
3.  *Note: The application will automatically generate tables upon the first run.*

### 5.3 Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Update `src/main/resources/application.properties` with your MySQL credentials:
    ```properties
    spring.datasource.username=YOUR_USERNAME
    spring.datasource.password=YOUR_PASSWORD
    ```
3.  Run the application:
    ```bash
    mvn spring-boot:run
    ```
    The server will start on **port 8080**.

### 5.4 Frontend Setup
1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be accessible at **http://localhost:5173**.

## 6. API & Integration
The Frontend communicates with the Backend via standard RESTful APIs using **Axios**.
-   **Authentication**: Users log in to receive a **JWT**. This token must be included in the `Authorization` header (`Bearer <token>`) for all subsequent protected requests.
-   **CORS**: Configured to allow requests from the frontend development port.
