package com.securevault.dao;
//DAO stands for Data Access Object. It is the class responsible for talking to the database.
//A PreparedStatement is a safer way to send SQL values from Java to the database.

import com.securevault.config.DatabaseConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.ResultSet;
import java.util.Base64;

public class MasterPasswordDAO {

        public void saveMasterPassword(String hashPassword, byte[] salt,  String createdAt) throws SQLException{
            String sql = "INSERT INTO master_password (password_hash, salt, created_at) VALUES (?,?,?)";
            try(Connection connection = DatabaseConnection.getConnection();
            PreparedStatement preparedstatement = connection.prepareStatement(sql)){
                // prepareStatement() is a built in sql method
                preparedstatement.setString(1, hashPassword);
                String encodedSalt =  Base64.getEncoder().encodeToString((salt));
                preparedstatement.setString(2, encodedSalt);
                preparedstatement.setString(3, createdAt);
                preparedstatement.executeUpdate();
            }
        }

        public boolean hasMasterPassword()throws SQLException{
            String sql = "SELECT COUNT (*) FROM master_password";
            try (Connection connection = DatabaseConnection.getConnection();
                 PreparedStatement preparedstatement = connection.prepareStatement(sql);
                 ResultSet resultset = preparedstatement.executeQuery();){
                if(resultset.next()){
                    return resultset.getInt(1) >0;
                }
                return false;
            }
        }

        public String getStoredPasswordHash()throws SQLException {
            String sql = "SELECT password_hash FROM master_password LIMIT 1";

            try
                    (Connection connection = DatabaseConnection.getConnection();
            PreparedStatement preparedstatement = connection.prepareStatement(sql);
            ResultSet resultset = preparedstatement.executeQuery())
            {
                if (resultset.next()){
                    return resultset.getString("password_hash");
                }
                return null;
            }
        }

        public byte[] getSalt() throws SQLException{
            String sql = "SELECT salt FROM master_password LIMIT 1";
            try
                    (Connection connection = DatabaseConnection.getConnection();
                     PreparedStatement preparedstatement = connection.prepareStatement(sql);
                     ResultSet resultset = preparedstatement.executeQuery())
            {
                if (resultset.next()){
                    String saltString = resultset.getString("salt");
                    byte[] decodedByte = Base64.getDecoder().decode(saltString);
                    return decodedByte;
                }
                return null;
            }

        }

    public void updateMasterPassword(String newHashPassword) throws SQLException{
        String sql = "UPDATE master_password SET password_hash = ? WHERE id = 1";
        try(Connection connection = DatabaseConnection.getConnection();
            PreparedStatement preparedstatement = connection.prepareStatement(sql)){
            preparedstatement.setString(1, newHashPassword);
            preparedstatement.executeUpdate();
        }
    }


}