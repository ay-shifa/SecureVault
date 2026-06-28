# SecureVault - Java Password Manager

A secure password management application built with Java, featuring encryption, user authentication, and MySQL database integration.

## Features
- 🔐 **AES Encryption** for stored passwords
- 👤 **User Authentication** with secure login
- 💾 **MySQL Database** with organized credential management
- 🔑 **Master Password** with hashing
- 📁 **Credential Organization** by categories

## Tech Stack
- **Language**: Java
- **Build Tool**: Maven
- **Database**: MySQL
- **Security**: AES Encryption, Password Hashing (SHA-256)
- **Architecture**: MVC with DAO pattern

## Project Structure

## Setup & Installation

### Prerequisites
- Java 11+
- MySQL Server
- Maven

### Steps
1. Clone the repository
```bash
   git clone https://github.com/ay-shifa/2025-CYS-133.git
   cd 2025-CYS-133
```

2. Create MySQL database
```sql
   CREATE DATABASE securevault;
```

3. Update database credentials in `DatabaseConnection.java`
```java
   private static final String URL = "jdbc:mysql://localhost:3306/securevault";
   private static final String USER = "root";
   private static final String PASSWORD = "your_password";
```

4. Build and run
```bash
   mvn clean install
   mvn exec:java -Dexec.mainClass="com.securevault.MainApp"
```

## Skills Demonstrated
✅ Java OOP & Design Patterns  
✅ Maven Dependency Management  
✅ Database Design & SQL  
✅ Cryptography (AES, Hashing)  
✅ Secure Credential Handling  
✅ MVC Architecture

## Future Improvements
- [ ] GUI with JavaFX
- [ ] Two-factor authentication
- [ ] Password strength analyzer
- [ ] Auto-backup system
- [ ] Search & filter functionality

## Author
ay-shifa