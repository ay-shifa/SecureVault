package com.securevault;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

public class rough {
//    public void showSetupScreen(Stage primaryStage){
//        Label titleLabel = new Label("Secure Vault");
//        titleLabel.setStyle("-fx-font-size: 27px;");
//        Label introlabel = new Label("Create your Master Password");
//
//        PasswordField masterPassword = new PasswordField();
//        masterPassword.setPromptText("Master Password");
//        masterPassword.setMaxWidth(220);
//        PasswordField confirmPasswordField = new PasswordField();
//        confirmPasswordField.setPromptText("Confirm Master Password"); // wahi to krna he  jo wahi na heo skta he wahi to krna he jpo nahi ho skta he h jo
//        confirmPasswordField.setMaxWidth(220);
//        Button setPasswordButton = new Button("Set Master Password");
//        Label statuslabel = new Label();
//        setPasswordButton.setOnAction(event -> handleSetPassword(primaryStage, masterPassword, confirmPasswordField, statuslabel));
//
//        VBox root = new VBox(20);
//        root.setPadding(new Insets(15));
//        root.setAlignment(Pos.CENTER);
//
//        root.getChildren().addAll(
//                titleLabel,
//                introlabel,
//                masterPassword,
//                confirmPasswordField,
//                setPasswordButton,
//                statuslabel);
//
//        Scene scene = new Scene(root, 600, 400);
//        scene.getStylesheets().add(getClass().getResource("/styling.css").toExternalForm());
//        primaryStage.setTitle("SECURE VAULT");
//        primaryStage.setScene(scene);
//        primaryStage.show();
//    }
//
//    public void showLoginScreen(Stage primaryStage){
//        Label titleLabel = new Label("Secure Vault");
//        titleLabel.setStyle("-fx-font-size: 27px;");
//        Label loginLabel = new Label("Enter your Master Password");
//
//        PasswordField masterPassword = new PasswordField();
//        masterPassword.setPromptText("Master Password");
//        masterPassword.setMaxWidth(220);
//
//
//        Button unlockButton = new Button("Unlock Vault");
//        Label statuslabel = new Label();
//        unlockButton.setOnAction(event -> handleUnlock(primaryStage, masterPassword, statuslabel));
//
//        VBox root = new VBox(20);
//        root.setPadding(new Insets(15));
//        root.setAlignment(Pos.CENTER);
//
//        root.getChildren().addAll(
//                titleLabel,
//                loginLabel,
//                masterPassword,
//                unlockButton,
//                statuslabel);
//
//        Scene scene = new Scene(root, 600, 400);
//        scene.getStylesheets().add(getClass().getResource("/styling.css").toExternalForm());
//        primaryStage.setTitle("SECURE VAULT");
//        primaryStage.setScene(scene);
//        primaryStage.show();
//
//    }


//    public void showDashboardScreen(Stage primaryStage){
//        Label titleLabel = new Label("DASHBOARD")  ;
//        titleLabel.setStyle("-fx-font-size: 27px;");
//        TextField websiteField = new TextField();
//        websiteField.setPromptText("Website");
//        websiteField.setMaxWidth(250);
//        TextField usernameField = new TextField();
//        usernameField.setPromptText("Username");
//        usernameField.setMaxWidth(250);
//        PasswordField passwordField = new PasswordField();
//        passwordField.setPromptText("Password");
//        passwordField.setMaxWidth(250);
//
//        Button saveCredentialButton = new Button("Credentials Button");
//        TableView<Credentials> tableView = new TableView<>();
//        tableView.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
//        tableView.setMaxWidth(550);
//        tableView.setPrefHeight(200);
//
//        TableColumn<Credentials, String> websiteCol = new TableColumn<>("Website");
//        websiteCol.setCellValueFactory(new PropertyValueFactory<>("website"));
//        websiteCol.setPrefWidth(150);
//
//        TableColumn<Credentials, String> usernameCol = new TableColumn<>("Username");
//        usernameCol.setCellValueFactory(new PropertyValueFactory<>("username"));
//        usernameCol.setPrefWidth(150);
//
//        TableColumn<Credentials, Void> actionsCol = new TableColumn<>("Actions");
//        actionsCol.setPrefWidth(150);
//        actionsCol.setCellFactory(col -> new TableCell<>(){
//            final Button deleteBtn = new Button("Delete");
//            final Button editBtn = new Button("Edit");
//            protected void updateItem(Void item, boolean empty){
//                super.updateItem(item, empty);
//                if(empty ){
//                    setGraphic (null);
//                }else {
//                    Credentials credential = getTableView().getItems().get(getIndex());
//                    HBox bothButtons = new HBox(5, editBtn, deleteBtn);
//                    deleteBtn.setOnAction(event -> {
//                        try{
//                            credentialsDao.deleteCredential(credential.getId());
//                            loadCredentials(tableView);
//                        }catch(SQLException ex){
//                            ex.printStackTrace();
//                        }});
//                    editBtn.setOnAction(event -> {
//                        System.out.println("Edit clicked: " + credential.getWebsite());
//                        websiteField.setText(credential.getWebsite());
//                        usernameField.setText(credential.getUsername());
//                        editingCredentialId = credential.getId();
//                    });
//                    setGraphic(bothButtons);
//                }
//            }
//        });


//
//        tableView.getColumns().addAll(websiteCol, usernameCol, actionsCol);
//        loadCredentials(tableView);
//
//        TextField searchField = new TextField();
//        searchField.setPromptText("Search by Website");
//        searchField.setMaxWidth(250);
//        searchField.textProperty().addListener((observable, oldValue, newValue) -> {
//            try {
//                if (newValue == null || newValue.isBlank()) {
//                    loadCredentials(tableView);
//                } else {
//                    List<Credentials> results = credentialsDao.searchByWebsite(newValue);
//                    tableView.setItems(FXCollections.observableArrayList(results));
//                }
//            } catch (SQLException e) {
//                e.printStackTrace();
//            }
//        });
//
//        Label statuslabel = new Label();
//        saveCredentialButton.setOnAction(event -> handleCredentialButton(websiteField, usernameField, passwordField, statuslabel, tableView));
//
//        Button showPasswordButton = new Button("Show Latest Password");
//        Label passwordLabel = new Label();
//        showPasswordButton.setOnAction(event -> handlePasswordButton( passwordLabel));
//        Button clipboardButton = new Button("Clipboard");
//        clipboardButton.setOnAction(event -> handleClipboardButton(passwordLabel));
//        Button exportBtn = new Button("Export");
//        exportBtn.setOnAction(event -> handleExport());
//
//        Label strengthLabel = new Label();
//        passwordField.textProperty().addListener((observable, oldValue, newValue) -> {
//            String strength = credentialController.passwordStrength(newValue);
//            strengthLabel.setText("Strength: " + strength);
//            if(strength.equals("Weak")){
//                strengthLabel.setStyle("-fx-text-fill: red;");
//            }
//            else if(strength.equals("Medium")){
//                strengthLabel.setStyle("-fx-text-fill: orange");
//            }
//            else if(strength.equals("Strong")){
//                strengthLabel.setStyle("-fx-text-fill: green");
//            }
//        });
//
//        VBox root = new VBox(20);
//        root.setPadding(new Insets(15));
//        root.setAlignment(Pos.CENTER);
//        root.getChildren().addAll(
//                titleLabel,
//                websiteField,
//                usernameField,
//                passwordField,
//                strengthLabel,
//                saveCredentialButton,
//                statuslabel,
//                searchField,
//                tableView,
//                showPasswordButton,
//                exportBtn,
//                clipboardButton,
//                passwordLabel);
//
//        Scene scene = new Scene(root, 900, 700);
//        primaryStage.setTitle("SECURE VAULT-DASHBOARD");
//        scene.getStylesheets().add(getClass().getResource("/styling.css").toExternalForm());
//        primaryStage.setScene(scene);
//        primaryStage.show();
//    }

}
