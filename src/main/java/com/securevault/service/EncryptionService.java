package com.securevault.service;
import java.util.Base64;
//to encode encrypted data into text format
import javax.crypto.Cipher;
// javax = java extension and Cipher is a class to perform encryption decryption
import javax.crypto.SecretKey;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import javax.crypto.spec.IvParameterSpec;

public class EncryptionService {


    public String encrypt(String userText, SecretKey key){
        try{
        byte [] iv = new byte[16];
        new SecureRandom().nextBytes(iv);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);
//
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, key, ivSpec);
        byte [] encryptedBytes = cipher.doFinal(userText.getBytes(StandardCharsets.UTF_8));
        String iv64 = Base64.getEncoder().encodeToString(iv);
        String cipher64 = Base64.getEncoder().encodeToString(encryptedBytes);
        return iv64 + ":" + cipher64;
        }
        catch (Exception e) {
            throw new RuntimeException("Error while encrypting.");
        }
    }
    public String decrypt(String encryptedText, SecretKey key){
        try{
            String[] textParts = encryptedText.split(":");
            byte[] iv = Base64.getDecoder().decode(textParts[0]);
            byte[] cipherbyte = Base64.getDecoder().decode(textParts[1]);
            IvParameterSpec ivSpec = new IvParameterSpec(iv);

            Cipher cipher = Cipher.getInstance(("AES/CBC/PKCS5Padding"));
            cipher.init(Cipher.DECRYPT_MODE, key, ivSpec);
            byte [] decryptedBytes = cipher.doFinal(cipherbyte);
            return new String (decryptedBytes, StandardCharsets.UTF_8);
        }
        catch (Exception e) {
            throw new RuntimeException("Error while decrypting.");
        }
    }
}
