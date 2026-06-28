package com.securevault.model;

public class MasterPassword {
    private int id;
    private String hashPassword;
    private String createdAt;

    public MasterPassword(int id, String hashPassword, String createdAt){
        this.id = id;
        this.hashPassword = hashPassword;
        this.createdAt = createdAt;
    }
    public int getId(){return id;}
    public String getHashPassword(){return hashPassword;}
    public String getCreatedAt(){return createdAt;}
}
