package com.securevault.service;

import java.security.SecureRandom;
import java.security.NoSuchAlgorithmException;
import java.security.spec.InvalidKeySpecException;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;


public class KeyDerivationService {
    public byte[] generateSalt(){
        byte [] salt = new byte[16];
        new SecureRandom().nextBytes(salt);
        return salt;
    }
    public SecretKey deriveKey(String password, byte[] salt){
         try{
             PBEKeySpec SKey = new PBEKeySpec(password.toCharArray(), salt, 65536, 256 );
             SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
             byte [] byteKey = factory.generateSecret(SKey).getEncoded();
             SKey.clearPassword();
             return new SecretKeySpec(byteKey, "AES");

         }catch(NoSuchAlgorithmException | InvalidKeySpecException e){
             throw new RuntimeException(e);
         }
    }
}
