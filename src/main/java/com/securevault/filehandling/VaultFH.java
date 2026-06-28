package com.securevault.filehandling;

import com.securevault.model.Credentials;
import com.securevault.service.EncryptionService;
import java.io.BufferedWriter;
import java.io.FileWriter;
import java.io.IOException;
import java.util.List;
import javax.crypto.SecretKey;
import java.nio.file.Path;

public class VaultFH {
    private final EncryptionService encryptionService;
    //the constructor is to use the same encryption object (dependency injection)
    public VaultFH(EncryptionService encryptionService) {
        this.encryptionService = encryptionService;
    }
    public void exportCredentials(List<Credentials> credentials, Path filePath, SecretKey key) throws IOException{
        try(BufferedWriter bw = new BufferedWriter(new FileWriter(filePath.toFile()))){
            for(Credentials cred : credentials){
                String decryptedPass = encryptionService.decrypt(cred.getEncryptedPassword(), key);
                bw.write("Website: "+ cred.getWebsite());
                bw.newLine();
                bw.write("Username: "+ cred.getUsername());
                bw.newLine();
                bw.write("Password: "+ decryptedPass);
                bw.newLine();
                bw.write("-------------------------------");
                bw.newLine();
            }

        }catch (IOException e){
            e.printStackTrace();
        }

    }
}
// buffered writer works like a wrap to store data first in memory and after closing, hit the disk, while alone
//filewriter hit disk for every character