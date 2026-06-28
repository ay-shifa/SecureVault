package com.securevault.controller;
import com.securevault.service.HashService;

public class LoginController {
    private final HashService hashservice = new HashService();
    public String validatePasswordInput(String enteredPassword){
        if(enteredPassword == null || enteredPassword.isBlank()){
            return "Please enter your Master Password";
        }
        return "Unlock button clicked";
    }
    public String validateConfirmPassword(String password, String confirmPassword){
        if(password == null || password.isBlank() || confirmPassword == null || confirmPassword.isBlank()){
            return "Please fill in both Fields";
        }
        if(!password.equals(confirmPassword)){
            return "Password do not match";
        }
        if(password.length() < 8){
            return "Password should be 8 characters.";
        }
        return "Valid Master Password";
    }
    public boolean verifyMasterPassword(String enteredPassword, String storedHash){
        if(enteredPassword == null || enteredPassword.isBlank() || storedHash == null){
            return false;
        }
        String enteredHash = hashservice.sha256(enteredPassword);
        return enteredHash.equals(storedHash);

    }
}
