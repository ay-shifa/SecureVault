package com.securevault;

import com.securevault.controller.LoginController;
import com.securevault.controller.ControlCredential;
import com.securevault.service.HashService;
import com.securevault.dao.MasterPasswordDAO;
import com.securevault.dao.CredentialsDAO;
import com.securevault.service.EncryptionService;
import com.securevault.model.Credentials;
import com.securevault.service.KeyDerivationService;
import com.securevault.filehandling.VaultFH;

import javafx.application.Application;
import javafx.scene.control.*;
import javafx.stage.Stage;
import javafx.geometry.Pos;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.layout.VBox;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.sql.SQLException;

import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;

import java.util.List;
import javafx.scene.input.Clipboard;
import javafx.scene.input.ClipboardContent;
import javafx.animation.PauseTransition;
import javafx.util.Duration;
import javax.crypto.SecretKey;

import javafx.scene.layout.BorderPane;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;

public class MainApp extends Application {

    private final LoginController controlLogin = new LoginController();
    private final MasterPasswordDAO masterPasswordDao = new MasterPasswordDAO();
    private final HashService hashService = new HashService();
    private final ControlCredential credentialController = new ControlCredential();
    private final CredentialsDAO credentialsDao = new CredentialsDAO();
    private final EncryptionService encryptionService = new EncryptionService();
    private final KeyDerivationService keyDerivationService = new KeyDerivationService();
    private SecretKey sessionKey;
    private int editingCredentialId = -1;
    private final VaultFH FH = new VaultFH(encryptionService);

    public void start(Stage primaryStage) {
        try {
            if (masterPasswordDao.hasMasterPassword()) {
                showLoginScreen(primaryStage);
            } else {
                showSetupScreen(primaryStage);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    public void showLoginScreen(Stage primaryStage) {
        Label titleLabel = new Label("🔒 Secure Vault");
        titleLabel.getStyleClass().add("login-title");

        Label loginLabel = new Label("Enter your Master Password to continue");
        loginLabel.getStyleClass().add("login-subtitle");

        PasswordField masterPassword = new PasswordField();
        masterPassword.setPromptText("Master Password");
        masterPassword.getStyleClass().add("input-field");
        Label statuslabel = new Label();
        statuslabel.getStyleClass().add("status-label");
        Button unlockButton = new Button("Unlock Vault");
        unlockButton.getStyleClass().add("primary-button");
        unlockButton.setOnAction(event -> handleUnlock(primaryStage, masterPassword, statuslabel));

        VBox root = new VBox(20);
        root.setPadding(new Insets(60));
        root.setAlignment(Pos.CENTER);
        root.setStyle("-fx-background-color: #f5f5f5;");
        root.getChildren().addAll(
                titleLabel,
                loginLabel,
                masterPassword,
                unlockButton,
                statuslabel);

        Scene scene = new Scene(root, 600, 400);
        scene.getStylesheets().add(
                getClass().getResource("/styling.css").toExternalForm());
        primaryStage.setTitle("SECURE VAULT");
        primaryStage.setScene(scene);
        primaryStage.show();
    }

    public void showSetupScreen(Stage primaryStage) {
        Label titleLabel = new Label("🔒 Secure Vault");
        titleLabel.getStyleClass().add("login-title");

        Label introLabel = new Label("Create your Master Password to get started");
        introLabel.getStyleClass().add("login-subtitle");

        PasswordField masterPassword = new PasswordField();
        masterPassword.setPromptText("Master Password");
        masterPassword.getStyleClass().add("input-field");

        PasswordField confirmPasswordField = new PasswordField();
        confirmPasswordField.setPromptText("Confirm Master Password");
        confirmPasswordField.getStyleClass().add("input-field");

        Button setPasswordButton = new Button("Set Master Password");
        setPasswordButton.getStyleClass().add("primary-button");

        Label statuslabel = new Label();
        statuslabel.getStyleClass().add("status-label");

        setPasswordButton.setOnAction(event ->
                handleSetPassword(primaryStage, masterPassword, confirmPasswordField, statuslabel));

        VBox root = new VBox(20);
        root.setPadding(new Insets(60));
        root.setAlignment(Pos.CENTER);
        root.setStyle("-fx-background-color: #f5f5f5;");
        root.getChildren().addAll(
                titleLabel,
                introLabel,
                masterPassword,
                confirmPasswordField,
                setPasswordButton,
                statuslabel);

        Scene scene = new Scene(root, 600, 400);
        scene.getStylesheets().add(
                getClass().getResource("/styling.css").toExternalForm());
        primaryStage.setTitle("SECURE VAULT");
        primaryStage.setScene(scene);
        primaryStage.show();
    }

    public void showDashboardScreen(Stage primaryStage) {

        Label sidebarTitle = new Label("🔒 Secure Vault");
        sidebarTitle.getStyleClass().add("sidebar-title");

        Button vaultBtn = new Button("🗄 Vault");
        vaultBtn.getStyleClass().add("sidebar-button");

        Button exportBtn = new Button("📤 Export");
        exportBtn.getStyleClass().add("sidebar-button");

        Button lockBtn = new Button("🔒 Lock");
        lockBtn.getStyleClass().add("lock-button");

        Region spacer = new Region();
        VBox.setVgrow(spacer, Priority.ALWAYS);

        VBox sidebar = new VBox(15);
        sidebar.getStyleClass().add("sidebar");
        sidebar.getChildren().addAll(
                sidebarTitle,
                vaultBtn,
                exportBtn,
                spacer,
                lockBtn
        );

        Label contentTitle = new Label("Add New Credential");
        contentTitle.getStyleClass().add("content-title");

        TextField websiteField = new TextField();
        websiteField.setPromptText("Website");
        websiteField.getStyleClass().add("input-field");

        TextField usernameField = new TextField();
        usernameField.setPromptText("Username");
        usernameField.getStyleClass().add("input-field");

        PasswordField passwordField = new PasswordField();
        passwordField.setPromptText("Password");
        passwordField.getStyleClass().add("input-field");

        Label strengthLabel = new Label();
        passwordField.textProperty().addListener((obs, oldVal, newVal) -> {
            String strength = credentialController.passwordStrength(newVal);
            strengthLabel.setText("Strength: " + strength);
            strengthLabel.getStyleClass().removeAll(
                    "strength-weak", "strength-medium", "strength-strong"
            );
            if (strength.equals("Weak"))
                strengthLabel.getStyleClass().add("strength-weak");
            else if (strength.equals("Medium"))
                strengthLabel.getStyleClass().add("strength-medium");
            else if (strength.equals("Strong"))
                strengthLabel.getStyleClass().add("strength-strong");
        });

        Label statusLabel = new Label();
        statusLabel.getStyleClass().add("status-label");

        Button saveBtn = new Button("Save Credential");
        saveBtn.getStyleClass().add("primary-button");

        TextField searchField = new TextField();
        searchField.setPromptText("Search by website...");
        searchField.getStyleClass().add("input-field");

        TableView<Credentials> tableView = new TableView<>();
        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        tableView.setPrefHeight(300);
        tableView.getStyleClass().add("table-view");

        TableColumn<Credentials, String> websiteCol = new TableColumn<>("Website");
        websiteCol.setCellValueFactory(new PropertyValueFactory<>("website"));

        TableColumn<Credentials, String> usernameCol = new TableColumn<>("Username");
        usernameCol.setCellValueFactory(new PropertyValueFactory<>("username"));

        TableColumn<Credentials, Void> actionsCol = new TableColumn<>("Actions");
        actionsCol.setPrefWidth(150);
        actionsCol.setCellFactory(col -> new TableCell<Credentials, Void>() {
//            final Button editBtn = new Button("Edit");
            final Button deleteBtn = new Button("Delete");
            final Button copyBtn = new Button("Copy");

            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                if (empty) {
                    setGraphic(null);
                } else {
                    Credentials credential = getTableView().getItems().get(getIndex());
                    HBox buttons = new HBox(5,  deleteBtn, copyBtn);

//                    editBtn.setOnAction(e -> {
//                        websiteField.setText(credential.getWebsite());
//                        usernameField.setText(credential.getUsername());
//                        editingCredentialId = credential.getId();
//                    });

                    deleteBtn.setOnAction(e -> {
                        try {
                            credentialsDao.deleteCredential(credential.getId());
                            loadCredentials(tableView);
                        } catch (SQLException ex) {
                            ex.printStackTrace();
                        }
                    });

                    copyBtn.setOnAction(e -> {
                        String decrypted = encryptionService.decrypt(
                                credential.getEncryptedPassword(), sessionKey);
                        Clipboard clipboard = Clipboard.getSystemClipboard();
                        ClipboardContent content = new ClipboardContent();
                        content.putString(decrypted);
                        clipboard.setContent(content);
                        statusLabel.setText("Password copied — clears in 10 seconds");
                        PauseTransition pause = new PauseTransition(Duration.seconds(10));
                        pause.setOnFinished(ev -> {
                            clipboard.setContent(new ClipboardContent());
                            statusLabel.setText("");
                        });
                        pause.play();
                    });

                    setGraphic(buttons);
                }
            }
        });

        tableView.getColumns().addAll(websiteCol, usernameCol, actionsCol);
        loadCredentials(tableView);

        searchField.textProperty().addListener((obs, oldVal, newVal) -> {
            try {
                if (newVal == null || newVal.isBlank()) {
                    loadCredentials(tableView);
                } else {
                    List<Credentials> results = credentialsDao.searchByWebsite(newVal);
                    tableView.setItems(FXCollections.observableArrayList(results));
                }
            } catch (SQLException e) {
                e.printStackTrace();
            }
        });

        saveBtn.setOnAction(e ->
                handleCredentialButton(websiteField, usernameField, passwordField, statusLabel, tableView));

        exportBtn.setOnAction(e -> handleExport(statusLabel));

        lockBtn.setOnAction(e -> showLoginScreen(primaryStage));

//        Button changePasswordButton = new Button("Change Master Password");
//        changePasswordButton.getStyleClass().add("change-password-button");
//        changePasswordButton.setOnAction(event -> showChangePasswordDialog(primaryStage));

        Button editCredentialButton = new Button("Edit Credential");
        editCredentialButton.getStyleClass().add("edit-credential-button");
        editCredentialButton.setOnAction(event -> showEditCredentialDialog(primaryStage,
                websiteField, usernameField, passwordField, statusLabel, tableView));

        Button showEncryptedButton = new Button("Show Encrypted Password");
        showEncryptedButton.getStyleClass().add("show-encrypted-button");
        showEncryptedButton.setOnAction(event -> showEncryptedPasswordDialog(statusLabel));

        VBox contentArea = new VBox(15);
        contentArea.getStyleClass().add("content-area");
        contentArea.getChildren().addAll(
                contentTitle,
                websiteField,
                usernameField,
                passwordField,
                strengthLabel,
                saveBtn,
//                changePasswordButton,
                editCredentialButton,
                showEncryptedButton,
                statusLabel,
                searchField,
                tableView
        );

        // ── ROOT LAYOUT ──────────────────────────
        BorderPane root = new BorderPane();
        root.setLeft(sidebar);
        root.setCenter(contentArea);

        Scene scene = new Scene(root, 900, 700);
        scene.getStylesheets().add(
                getClass().getResource("/styling.css").toExternalForm());
        primaryStage.setTitle("SECURE VAULT");
        primaryStage.setScene(scene);
        primaryStage.show();
    }

    public void showChangePasswordDialog(Stage primaryStage) {

        Label titleLabel = new Label("Change Master Password");
        titleLabel.getStyleClass().add("dialog-title");

        PasswordField currentPasswordField = new PasswordField();
        currentPasswordField.setPromptText("Current Master Password");
        currentPasswordField.getStyleClass().add("input-field");

        PasswordField newPasswordField = new PasswordField();
        newPasswordField.setPromptText("New Master Password");
        newPasswordField.getStyleClass().add("input-field");

        PasswordField confirmPasswordField = new PasswordField();
        confirmPasswordField.setPromptText("Confirm New Password");
        confirmPasswordField.getStyleClass().add("input-field");

        Button changeButton = new Button("Change Password");
        changeButton.getStyleClass().add("primary-button");

        Button cancelButton = new Button("Cancel");
        cancelButton.getStyleClass().add("tertiary-button");

        Label statusLabel = new Label();
        statusLabel.getStyleClass().add("status-label");

//        changeButton.setOnAction(event ->
//                handleChangePassword(primaryStage,
//                        currentPasswordField,
//                        newPasswordField,
//                        confirmPasswordField,
//                        statusLabel));

        cancelButton.setOnAction(event -> showDashboardScreen(primaryStage));

        VBox root = new VBox(15);
        root.getStyleClass().add("dialog-root");
        root.setAlignment(Pos.CENTER);

        root.getChildren().addAll(
                titleLabel,
                currentPasswordField,
                newPasswordField,
                confirmPasswordField,
                changeButton,
                cancelButton,
                statusLabel
        );

        Scene scene = new Scene(root, 600, 400);

        scene.getStylesheets().add(
                getClass().getResource("/styling.css").toExternalForm());

        Stage changePasswordStage = new Stage();
        changePasswordStage.setTitle("Change Master Password");
        changePasswordStage.setScene(scene);
        changePasswordStage.show();
    }

    private void ConfirmPasswordSetUp(PasswordField masterPassword,
                                      PasswordField confirmPasswordField,
                                      Label statuslabel) {
        String password = masterPassword.getText();
        String confirmPassword = confirmPasswordField.getText();
        String message = controlLogin.validateConfirmPassword(password, confirmPassword);
        statuslabel.setText(message);
    }

    private void handleSetPassword(Stage primaryStage, PasswordField masterPassword,
                                   PasswordField confirmPasswordField,
                                   Label statuslabel) {
        String password = masterPassword.getText();
        String confirmPassword = confirmPasswordField.getText();
        String validationMessage = controlLogin.validateConfirmPassword(password, confirmPassword);

        if (!validationMessage.equals("Valid Master Password")) {
            statuslabel.setText(validationMessage);
            return;
        }
        try {
            if (masterPasswordDao.hasMasterPassword()) {
                statuslabel.setText("Master Password Already Exists");
                return;
            }
            byte[] salt = keyDerivationService.generateSalt();
            sessionKey = keyDerivationService.deriveKey(password, salt);
            String hashPassword = hashService.sha256(password);
            String createdAt = LocalDateTime.now().toString();

            masterPasswordDao.saveMasterPassword(hashPassword, salt, createdAt);
            showDashboardScreen(primaryStage);

        } catch (SQLException e) {
            statuslabel.setText("Failed to save Master Password!");
            e.printStackTrace();
        }
    }

    public void handleUnlock(Stage primaryStage, PasswordField masterPassword, Label statuslabel) {
        String enteredPassword = masterPassword.getText();
        String validationMessage = controlLogin.validatePasswordInput(enteredPassword);
        if (!validationMessage.equals("Unlock button clicked")) {
            statuslabel.setText(validationMessage);
            return;
        }
        try {
            String storedHash = masterPasswordDao.getStoredPasswordHash();
            if (storedHash == null) {
                statuslabel.setText("Master Password Not Found");
                return;
            }
            boolean isValid = controlLogin.verifyMasterPassword(enteredPassword, storedHash);
            if (isValid) {
                byte[] salt = masterPasswordDao.getSalt();
                if (salt == null) {
                    statuslabel.setText("Salt not found. Database is corrupted");
                    return;
                }
                sessionKey = keyDerivationService.deriveKey(enteredPassword, salt);
                showDashboardScreen(primaryStage);
            } else {
                statuslabel.setText("Incorrect Master Password.");
            }

        } catch (SQLException e) {
            statuslabel.setText("Database error during verification.");
            e.printStackTrace();
        }
    }

    // BUG FIX #1 & #2: Fixed method signature and parameter type
    private void handleCredentialButton(TextField websiteField, TextField usernameField, PasswordField passwordField, Label statusLabel, TableView<Credentials> tableView) {
        String website = websiteField.getText();
        String username = usernameField.getText();
        String password = passwordField.getText();
        String message = credentialController.validateCredential(website, username, password);

        if (!message.equals("Credentials are valid")) {
            statusLabel.setText(message);
            return;
        }

        String createdAt = LocalDateTime.now().toString();
        try {
            // BUG FIX #3: Added missing sessionKey parameter to encrypt method
            String encryptedPassword = encryptionService.encrypt(password, sessionKey);

            if (editingCredentialId != -1) {
                // Editing existing credential
                credentialsDao.updateCredential(editingCredentialId, website, username, encryptedPassword);
                statusLabel.setText("Credential updated successfully");
                editingCredentialId = -1;
            } else {
                // Saving new credential
                credentialsDao.saveCredential(website, username, encryptedPassword, createdAt);
                statusLabel.setText("Credential saved successfully");
            }

            websiteField.clear();
            usernameField.clear();
            passwordField.clear();
            loadCredentials(tableView);

        } catch (SQLException e) {
            statusLabel.setText("Failed to save credential");
            e.printStackTrace();
        }
    }

    // BUG FIX #4: Fixed method signature - added missing sessionKey parameter to decrypt
    private void handleEditCredentialWithVerification(int credentialId, TextField websiteField, TextField usernameField, PasswordField passwordField, Label statusLabel) {
        // Show a dialog asking for the password to verify ownership
        Stage verificationStage = new Stage();
        verificationStage.setTitle("Verify Credential");

        Label promptLabel = new Label("Enter the password of this credential to edit it:");
        PasswordField verificationPasswordField = new PasswordField();
        verificationPasswordField.setPromptText("Credential password");
        verificationPasswordField.setMaxWidth(250);

        Button verifyButton = new Button("Verify");
        Button cancelButton = new Button("Cancel");
        Label verifyStatusLabel = new Label();
        promptLabel.getStyleClass().add("dialog-label");

        verificationPasswordField.getStyleClass().add("input-field");

        verifyButton.getStyleClass().add("primary-button");

        cancelButton.getStyleClass().add("tertiary-button");

        verifyStatusLabel.getStyleClass().add("status-label");

        verifyButton.setOnAction(event -> {
            try {
                Credentials cred = credentialsDao.getCredentialById(credentialId);
                if (cred == null) {
                    verifyStatusLabel.setText("Credential not found");
                    return;
                }

                // BUG FIX #4: Added missing sessionKey parameter
                String decryptedPassword = encryptionService.decrypt(cred.getEncryptedPassword(), sessionKey);
                String enteredPassword = verificationPasswordField.getText();

                if (!decryptedPassword.equals(enteredPassword)) {
                    verifyStatusLabel.setText("Password is incorrect");
                    return;
                }

                // Password verified - populate fields for editing
                websiteField.setText(cred.getWebsite());
                usernameField.setText(cred.getUsername());
                passwordField.setText(decryptedPassword);
                statusLabel.setText("Verified. Edit the fields and save.");

                editingCredentialId = credentialId;  // Mark as editing
                verificationStage.close();

            } catch (SQLException e) {
                verifyStatusLabel.setText("Database error");
                e.printStackTrace();
            }
        });

        cancelButton.setOnAction(event -> verificationStage.close());

        VBox root = new VBox(10);
        root.getStyleClass().add("dialog-root");
        root.setPadding(new Insets(15));
        root.setAlignment(Pos.CENTER);
        root.getChildren().addAll(promptLabel, verificationPasswordField, verifyButton, cancelButton, verifyStatusLabel);

        Scene scene = new Scene(root, 400, 200);
        scene.getStylesheets().add(
                getClass().getResource("/styling.css").toExternalForm()
        );
        verificationStage.setScene(scene);
        verificationStage.show();
    }

    // BUG FIX #5 & #6: Fixed parameter types - TextArea changed to TableView
    private void showEditCredentialDialog(Stage primaryStage, TextField websiteField, TextField usernameField, PasswordField passwordField, Label statusLabel, TableView<Credentials> tableView) {
        try {
            List<Credentials> credentialsList = credentialsDao.getCredentialsDB();
            if (credentialsList.isEmpty()) {
                statusLabel.setText("No credentials to edit");
                return;
            }

            Stage selectionStage = new Stage();
            selectionStage.setTitle("Select Credential to Edit");

            VBox root = new VBox(10);
            root.getStyleClass().add("dialog-root");
            root.setPadding(new Insets(15));

            Label instructionLabel = new Label("Click on a credential to edit:");
            instructionLabel.getStyleClass().add("instruction-label");
            root.getChildren().add(instructionLabel);

            for (Credentials cred : credentialsList) {
                Button credButton = new Button(cred.getWebsite() + " - " + cred.getUsername());
                credButton.getStyleClass().add("secondary-button");
                credButton.setMaxWidth(300);
                credButton.setOnAction(event -> {
                    handleEditCredentialWithVerification(cred.getId(), websiteField, usernameField, passwordField, statusLabel);
                    selectionStage.close();
                });
                root.getChildren().add(credButton);
            }

            Scene scene = new Scene(root, 400, 300);
            scene.getStylesheets().add(
                    getClass().getResource("/styling.css").toExternalForm());
            selectionStage.setScene(scene);
            selectionStage.show();

        } catch (SQLException e) {
            statusLabel.setText("Failed to load credentials");
            e.printStackTrace();
        }
    }

    private void loadCredentials(TableView<Credentials> tableView) {
        try {
            List<Credentials> credentialsList = credentialsDao.getCredentialsDB();
            ObservableList<Credentials> data = FXCollections.observableArrayList(credentialsList);
            System.out.println("Credentials loaded: " + credentialsList.size());
            tableView.setItems(data);
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    private void handlePasswordButton(Label passwordLabel) {
        try {
            Credentials lastCredential = credentialsDao.getLastCredentials();
            if (lastCredential == null) {
                passwordLabel.setText("No credentials found");
                return;
            }
            String decryptedPassword = encryptionService.decrypt(lastCredential.getEncryptedPassword(), sessionKey);
            passwordLabel.setText("Last Password:" + decryptedPassword);
        } catch (SQLException e) {
            passwordLabel.setText("Failed to load credentials.");
            e.printStackTrace();
        } catch (RuntimeException e) {
            throw new RuntimeException(e);
        }
    }

    private void handleClipboardButton(Label passwordLabel) {
        try {
            Credentials lastcredential = credentialsDao.getLastCredentials();
            if (lastcredential == null) {
                passwordLabel.setText("No credentials found");
                return;
            }
            String decryptedPassword = encryptionService.decrypt(lastcredential.getEncryptedPassword(), sessionKey);
            Clipboard clipboard = Clipboard.getSystemClipboard();
            ClipboardContent content = new ClipboardContent();
            content.putString(decryptedPassword);
            clipboard.setContent(content);
            passwordLabel.setText("Last password copied to clipboard");

            PauseTransition pause = new PauseTransition(Duration.seconds(10));
            pause.setOnFinished(event -> {
                passwordLabel.setText("Last password copied to clipboard - clear it manually for security");
            });
            pause.play();

        } catch (SQLException e) {
            passwordLabel.setText("Failed to load credentials.");
            e.printStackTrace();
        } catch (RuntimeException e) {
            throw new RuntimeException(e);
        }
    }

    private void handleExport(Label statusLabel) {
        try {
            List<Credentials> getCred = credentialsDao.getCredentialsDB();
            Path filepath = Path.of("Backup.txt");
            FH.exportCredentials(getCred, filepath, sessionKey);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

//    private void handleChangePassword(Stage primaryStage, PasswordField currentPasswordField, PasswordField newPasswordField, PasswordField confirmPasswordField, Label statusLabel) {
//        String currentPassword = currentPasswordField.getText();
//        String newPassword = newPasswordField.getText();
//        String confirmPassword = confirmPasswordField.getText();
//
//        // Validate input format
//        String validationMessage = credentialController.validateMasterPasswordChange(currentPassword, newPassword, confirmPassword);
//        if (!validationMessage.equals("Valid")) {
//            statusLabel.setText(validationMessage);
//            return;
//        }
//
//        try {
//            // Get stored hash to verify current password
//            String storedHash = masterPasswordDao.getStoredPasswordHash();
//            if (storedHash == null) {
//                statusLabel.setText("Master password not found");
//                return;
//            }
//
//            // Verify current password matches
//            boolean isCurrentPasswordValid = controlLogin.verifyMasterPassword(currentPassword, storedHash);
//            if (!isCurrentPasswordValid) {
//                statusLabel.setText("Current password is incorrect");
//                return;
//            }
//
//            // Current password verified, now hash and save new password
//            String newHashPassword = hashService.sha256(newPassword);
//            masterPasswordDao.updateMasterPassword(newHashPassword);
//
//            statusLabel.setText("Master password changed successfully");
//
//            // Clear fields
//            currentPasswordField.clear();
//            newPasswordField.clear();
//            confirmPasswordField.clear();
//
//            // Show dashboard again after short delay
//            PauseTransition pause = new PauseTransition(Duration.seconds(2));
//            pause.setOnFinished(event -> showDashboardScreen(primaryStage));
//            pause.play();
//
//        } catch (SQLException e) {
//            statusLabel.setText("Failed to change master password");
//            e.printStackTrace();
//        }
//    }

    private void showEncryptedPasswordDialog(Label statusLabel) {
        try {
            List<Credentials> credentialsList = credentialsDao.getCredentialsDB();
            if (credentialsList.isEmpty()) {
                statusLabel.setText("No credentials to display");
                return;
            }

            Stage displayStage = new Stage();
            displayStage.setTitle("View Encrypted Password");

            VBox root = new VBox(15);
            root.getStyleClass().add("dialog-root");
            root.setPadding(new Insets(15));

            Label instructionLabel = new Label("Select a credential to view encrypted password:");
            instructionLabel.getStyleClass().add("instruction-label");
            root.getChildren().add(instructionLabel);

            TextArea encryptedDisplayArea = new TextArea();
            encryptedDisplayArea.getStyleClass().add("text-area");
            encryptedDisplayArea.setEditable(false);
            encryptedDisplayArea.setWrapText(true);
            encryptedDisplayArea.setPrefHeight(150);
            encryptedDisplayArea.setPrefWidth(500);

            for (Credentials cred : credentialsList) {
                Button credButton = new Button(cred.getWebsite() + " - " + cred.getUsername());
                credButton.getStyleClass().add("secondary-button");
                credButton.setMaxWidth(400);
                credButton.setOnAction(event -> {
                    StringBuilder display = new StringBuilder();
                    display.append("Website: ").append(cred.getWebsite()).append("\n");
                    display.append("Username: ").append(cred.getUsername()).append("\n");
                    display.append("Encrypted Password:\n").append(cred.getEncryptedPassword()).append("\n\n");
                    display.append("(This is the Base64 encoded encrypted form stored in database)");
                    encryptedDisplayArea.setText(display.toString());
                });
                root.getChildren().add(credButton);
            }

            root.getChildren().add(new Label("Encrypted Password Display:"));
            root.getChildren().add(encryptedDisplayArea);

            Button closeButton = new Button("Close");
            closeButton.getStyleClass().add("tertiary-button");
            closeButton.setOnAction(event -> displayStage.close());
            root.getChildren().add(closeButton);

            Scene scene = new Scene(root, 600, 500);
            scene.getStylesheets().add(
                    getClass().getResource("/styling.css").toExternalForm());
            displayStage.setScene(scene);
            displayStage.show();

        } catch (SQLException e) {
            statusLabel.setText("Failed to load credentials");
            e.printStackTrace();
        }
    }

    public static void main(String[] args) {
        launch(args);
    }
}