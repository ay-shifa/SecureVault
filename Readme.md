# SecureVault - Java Password Manager

A secure password management application built with Java, featuring encryption, user authentication, and MySQL database integration.

## Features

* 🔐 **AES Encryption** for stored passwords
* 👤 **User Authentication** with secure login
* 💾 **MySQL Database** with organized credential management
* 🔑 **Master Password** with hashing
* 📁 **Credential Organization** by categories
* 🔍 **Search & Filter** functionality for quick access
* 📊 **Encrypted Password Display** with verification
* 💾 **Export Functionality** for backups

## Tech Stack

* **Language:** Java
* **Build Tool:** Maven
* **Database:** MySQL
* **Security:** AES Encryption, Password Hashing (SHA-256)
* **Architecture:** MVC with DAO pattern
* **UI Framework:** JavaFX

## Project Structure

```
SecureVault/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/securevault/
│   │   │       ├── controller/
│   │   │       ├── model/
│   │   │       ├── view/
│   │   │       ├── util/
│   │   │       └── MainApp.java
│   │   └── resources/
│   └── test/
├── pom.xml
└── README.md
```

## Setup & Installation

### Prerequisites

* Java 11+
* MySQL Server
* Maven 3.6+

### Steps

1. **Clone the repository**

```bash
git clone https://github.com/ay-shifa/2025-CYS-133.git
cd 2025-CYS-133
```

2. **Create MySQL database**

```sql
CREATE DATABASE securevault;
```

3. **Update database credentials** in `DatabaseConnection.java`

```java
private static final String URL = "jdbc:mysql://localhost:3306/securevault";
private static final String USER = "root";
private static final String PASSWORD = "your_password";
```

4. **Build and run**

```bash
mvn clean install
mvn exec:java -Dexec.mainClass="com.securevault.MainApp"
```

---

## User Interface

### 1. Master Password Login Screen
![Master Password Login](<img width="896" height="628" alt="Screenshot 2026-06-29 202748" src="https://github.com/user-attachments/assets/d9fcdde3-2dfd-4190-bd48-3b0fdea20aa7" />
)

The initial login screen where users enter their master password to unlock the vault. This implements secure password verification using SHA-256 hashing.

---

### 2. Main Dashboard - Credential Management
![Main Dashboard](<img width="1342" height="1083" alt="Screenshot 2026-06-29 202833" src="https://github.com/user-attachments/assets/34073bd3-e77d-4aa9-bf1b-d315eca66bf0" />
)

The central hub featuring:
- **Add New Credential** form for storing website/app credentials
- **Credential Table** displaying stored passwords (Website, Username, Actions)
- **Action Buttons** for managing credentials:
  - 🗑️ Delete - Remove credentials
  - 📋 Copy - Copy username to clipboard
- **Navigation Sidebar** with Vault and Export options
- **Search Functionality** to quickly find stored credentials

---

### 3. Credential Verification Dialog
![Credential Verification](<img width="1344" height="1088" alt="Screenshot 2026-06-29 202945" src="https://github.com/user-attachments/assets/5a83ec48-7cfd-4300-879f-306255632405" />
)

A security layer that requires password verification before editing stored credentials, ensuring unauthorized access is prevented even if the vault is unlocked.

---

### 4. View Encrypted Passwords
![Encrypted Password Display](<img width="1351" height="1100" alt="Screenshot 2026-06-29 203109" src="https://github.com/user-attachments/assets/40549f1a-ffe0-44d4-8829-0d167c2a93c2" />
)

The encrypted password viewer showing:
- **Credential List** (google.com, github, youtube12, hackerRank, instagram, tiktok)
- **Encrypted Password Display** area showing the decrypted password for selected credential
- **Select & View** functionality for viewing specific passwords securely

---

## Key Features in Action

### 🔐 Security Features
- Master password protected access
- AES encryption for all stored passwords
- Credential verification before editing
- SHA-256 password hashing
- Secure logout with "Lock" button

### 💾 Credential Management
- Add new website/app credentials
- Edit existing credentials
- Delete credentials
- Search and filter by website
- Copy username/password to clipboard
- Export vault data

### 📊 User Experience
- Intuitive JavaFX GUI
- Organized navigation sidebar
- Clean, modern interface
- Real-time credential table updates
- Input validation with error messages

---

## Skills Demonstrated

✅ **Java OOP & Design Patterns**  
✅ **Maven Dependency Management**  
✅ **Database Design & SQL**  
✅ **Cryptography (AES, Hashing)**  
✅ **Secure Credential Handling**  
✅ **MVC Architecture**  
✅ **JavaFX GUI Development**  
✅ **JDBC Database Integration**  
✅ **Exception Handling & Validation**  

---

## Future Improvements

* 🔄 Two-factor authentication (2FA)
* 📊 Password strength analyzer
* ⏱️ Auto-backup system
* 🌐 Cloud synchronization
* 📱 Mobile companion app
* 🔔 Breach notification alerts
* 🎨 Customizable themes
* 🌍 Multi-language support

---

## Security Best Practices Implemented

1. **Master Password Hashing:** SHA-256 hashing with salt for master password storage
2. **AES Encryption:** Military-grade AES encryption for password storage
3. **Secure Session:** Session management with automatic lock timeout
4. **Input Validation:** All inputs validated to prevent injection attacks
5. **Credential Verification:** Additional password verification before sensitive operations
6. **No Plain Text Storage:** Passwords never stored in plain text

---

## Usage Examples

### Creating a New Credential

1. Open SecureVault and unlock with master password
2. Fill in the "Add New Credential" form:
   - Website/Application name
   - Username
   - Password
3. Click "Save Credential"
4. Credential is encrypted and stored in database

### Viewing an Encrypted Password

1. Click "Show Encrypted Password" button
2. Select a credential from the list
3. Password is decrypted and displayed
4. Click "Copy" to copy username to clipboard

### Exporting Your Vault

1. Click "Export" button in sidebar
2. Choose export location
3. Vault data is exported securely

---

## License

This project is part of the Cyber SEcurity course at UET.

---

## Author

**Shifa Fatima**

GitHub: [@ay-shifa](https://github.com/ay-shifa)

---

## Support

For issues, feature requests, or contributions, please open an issue on the GitHub repository.

---

## Disclaimer

This is an educational project. For production use, additional security measures and professional security audits are recommended.

