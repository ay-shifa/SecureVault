package com.securevault.model;

public class Credentials {
    int id;
    String website;
    String username;
    String encryptedPassword;
    String createdAt;

    public Credentials(int id, String website, String username, String encryptedPassword, String createdAt) {
        this.id = id;
        this.website = website;
        this.username = username;
        this.encryptedPassword = encryptedPassword;
        this.createdAt = createdAt;
    }
    public int getId() {
        return id;
    }
    public String getCreatedAt() {
        return createdAt;
    }

    public String getEncryptedPassword() {
        return encryptedPassword;
    }

    public String getUsername() {
        return username;
    }

    public String getWebsite() {
        return website;
    }
}
