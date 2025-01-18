# 🏥 Medical Case Tracker

A sophisticated Spring Boot application designed to help medical professionals manage patient cases and track treatment progress through image documentation. This project demonstrates enterprise-level software architecture, secure handling of sensitive medical data, and modern web application development practices.

## 🌟 Key Features

### Core Functionality
- **Patient Management**
  - Create, view, update, and delete patient records
  - Comprehensive patient history tracking
  - Secure storage of patient information

- **Image Management**
  - Upload and store medical images
  - Before/after treatment comparisons
  - Image categorization and tagging
  - Secure image storage with backup

- **Progress Tracking**
  - Visual timeline of treatment progress
  - Milestone tracking and documentation
  - Treatment outcome analysis

- **Appointment System**
  - Schedule and manage appointments
  - Automated reminders (planned)
  - Calendar integration

### Technical Features
- Secure authentication and authorization
- Role-based access control (Admin, Doctor, Staff)
- HIPAA-compliant data handling practices
- Audit logging for sensitive operations
- RESTful API architecture
- Responsive web design

## 🔧 Technology Stack

### Backend
- Java 17
- Spring Boot 3.x
- Spring Security for authentication
- Spring Data JPA for data persistence
- PostgreSQL database
- Maven for dependency management

### Frontend
- Thymeleaf template engine
- Bootstrap 5 for responsive design
- JavaScript for dynamic interactions
- HTML5 & CSS3

### Testing
- JUnit 5 for unit testing
- Mockito for mocking
- Spring Boot Test for integration testing

## 🚀 Getting Started

### Prerequisites
- JDK 17 or higher
- Maven 3.8+
- PostgreSQL 14+
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/mohamed-kadi/medical-case-tracker.git
cd medical-case-tracker
```

2. Configure database properties in `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/medical_tracker
spring.datasource.username=medical_user
spring.datasource.password=user1234
```

3. Build and run the application
```bash
mvn clean install
mvn spring-boot:run
```

4. Access the application at `http://localhost:8080`

## 🏗️ Project Structure
```
medical-case-tracker/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/yourname/medicaltracker/
│   │   │       ├── config/
│   │   │       ├── controller/
│   │   │       ├── model/
│   │   │       ├── repository/
│   │   │       ├── service/
│   │   │       └── security/
│   │   └── resources/
│   │       ├── static/
│   │       ├── templates/
│   │       └── application.properties
│   └── test/
└── pom.xml
```

## 🔄 API Endpoints

### Patient Management
- `GET /api/patients` - List all patients
- `GET /api/patients/{id}` - Get patient details
- `POST /api/patients` - Create new patient
- `PUT /api/patients/{id}` - Update patient
- `DELETE /api/patients/{id}` - Delete patient
- `Get /api/patients/search?lastName={lastName}` - Search by lastname
- `Get /api/patients/check-email` - Check email availability

### Case Management
- `GET /api/cases` - List all cases
- `POST /api/cases` - Create new case
- `PUT /api/cases/{id}` - Update case
- `POST /api/cases/{id}/images` - Upload case images


## 🔒 Security

- JWT-based authentication
- Role-based access control
- Password encryption
- Secure session management
- CORS configuration
- XSS protection

## 🧪 Testing

Run tests using:
```bash
mvn test
```

## 📊 Project Status
🚧 Under Development

### Upcoming Features
- Medical case management
- Image upload and storage
- Case process tracking
- Treatment timeline
- Appointment scheduling
- Email notifications
- Patient portal
- Advanced image analysis
- Treatment plan management
- Reporting and analytics

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing
While this is primarily a portfolio project, suggestions and feedback are welcome. Please open an issue to discuss potential changes.
