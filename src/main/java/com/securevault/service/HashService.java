package com.securevault.service;
//hashing is business/security logic, so it belongs in service, not in the UI or DAO.
import java.security.NoSuchAlgorithmException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
public class HashService {
    public String sha256(String input){
        try{
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte [] hashBytes = messageDigest.digest(input.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexString = new StringBuilder();
            for(byte b : hashBytes){
                hexString.append(String.format("%02x", b));
            }
            return hexString.toString();
        }
        catch(NoSuchAlgorithmException e){
            throw new RuntimeException ("Error while hashing password.", e);
        }
    }


}
