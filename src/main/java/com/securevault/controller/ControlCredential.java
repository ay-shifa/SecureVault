package com.securevault.controller;

public class ControlCredential {
    public String validateCredential(String website, String username, String password ){
        if(website == null || website.isBlank() ||
                username == null || username.isBlank() ||
                password == null || password.isBlank()){
            return "Please fill in all credentials";

        }
        return "Credentials are valid";
    }
    public String passwordStrength(String password){
        if(password == null || password.isBlank()){

            return "";
        }
        boolean hasUppercase = password.matches(".*[A-Z].*");
        boolean hasLowercase = password.matches(".*[a-z].*");
        boolean hasDigit = password.matches(".*\\d.*");
        boolean hasSpecialChar = password.matches(".*[!@#$%^&*(),.?\":{}|<>].*");
        if(password.length() >= 12 && hasDigit && hasUppercase && hasSpecialChar && hasLowercase){
            return "Strong";
        }
        if(password.length() >= 8 && hasDigit && hasLowercase ){
            return "Medium";
        }
        return "Weak";
    }
    public String validateMasterPasswordChange(String currentPassword, String newPassword, String confirmPassword){
        if(currentPassword == null || currentPassword.isBlank()){
            return "Current password cannot be empty";
        }
        if(newPassword == null || newPassword.isBlank() || confirmPassword == null || confirmPassword.isBlank()){
            return "Please fill both password fields";
        }
        if(!newPassword.equals(confirmPassword)){
            return "New passwords do not match";
        }
        if(newPassword.length() < 8){
            return "New password must be at least 8 characters";
        }
        if(currentPassword.equals(newPassword)){
            return "New password must be different from current password";
        }
        return "Valid";
    }
}
