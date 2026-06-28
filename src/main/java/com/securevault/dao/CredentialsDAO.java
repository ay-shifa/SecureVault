package com.securevault.dao;
import com.securevault.model.Credentials;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.PreparedStatement;
import com.securevault.config.DatabaseConnection;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;


public class CredentialsDAO {
    public void saveCredential(String website, String username, String encryptedPassword, String createdAt) throws SQLException{
        String sql = "INSERT INTO credentials (website, username, encrypted_password, created_at) VALUES (?,?,?,?)";
        try(Connection connection = DatabaseConnection.getConnection();
            PreparedStatement preparedstatement = connection.prepareStatement(sql);){
            preparedstatement.setString(1, website);
            preparedstatement.setString(2, username);
            preparedstatement.setString(3, encryptedPassword);
            preparedstatement.setString(4, createdAt);

            preparedstatement.executeUpdate();
        }
    }
    public  List<Credentials> getCredentialsDB() throws SQLException{
        String sql = "SELECT id, website, username, encrypted_password, created_at FROM credentials";
        List<Credentials> credentialsList = new ArrayList<>();

        try (Connection  connection = DatabaseConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql);
             ResultSet resultset = preparedStatement.executeQuery();
        ){
            while(resultset.next()) {
                Credentials credentialObj = new Credentials(resultset.getInt("id"),
                        resultset.getString("website"),
                        resultset.getString("username"),
                        resultset.getString("encrypted_password"),
                        resultset.getString("created_at")
                );
                credentialsList.add(credentialObj)   ;
            }
        }
        return credentialsList;
    }
    public Credentials getLastCredentials() throws SQLException{
        String sql = "SELECT id, website, username, encrypted_password, created_at"+
                " FROM credentials order by id DESC limit 1";


        try (Connection  connection = DatabaseConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql);
             ResultSet resultset = preparedStatement.executeQuery();
        ){
            if(resultset.next()) {
                return new Credentials
                        (resultset.getInt("id"),
                                resultset.getString("website"),
                                resultset.getString("username"),
                                resultset.getString("encrypted_password"),
                                resultset.getString("created_at")
                        );
            }
        }
        return null;
    }
    public void deleteCredential(int id) throws SQLException{
        String sql = "DELETE FROM credentials WHERE id = ?";
        try (Connection  connection = DatabaseConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql);){
            preparedStatement.setInt(1, id);
            preparedStatement.executeUpdate();
        }
    }

    // BUG FIX #7: Kept only ONE updateCredential method (removed duplicate)
    public void updateCredential(int id, String website, String username, String encryptedPassword) throws SQLException{
        String sql = "UPDATE credentials SET website = ?, username = ?, encrypted_password = ? WHERE id = ?";
        try (Connection  connection = DatabaseConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql);) {
            preparedStatement.setString(1, website);
            preparedStatement.setString(2, username);
            preparedStatement.setString(3, encryptedPassword);
            preparedStatement.setInt(4, id);
            preparedStatement.executeUpdate();
        }
    }

    public  List<Credentials> searchByWebsite(String keyword) throws SQLException{
        String sql = "SELECT id, website, username, encrypted_password, created_at " +
                "FROM credentials " +
                "WHERE website LIKE ? ";
        List<Credentials> credentialsList = new ArrayList<>();

        try (Connection  connection = DatabaseConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql);){
            preparedStatement.setString(1, "%" + keyword + "%");
            ResultSet resultset = preparedStatement.executeQuery();
            while(resultset.next()) {
                Credentials credentialObj = new Credentials(resultset.getInt("id"),
                        resultset.getString("website"),
                        resultset.getString("username"),
                        resultset.getString("encrypted_password"),
                        resultset.getString("created_at")
                );
                credentialsList.add(credentialObj)   ;
            }
        }
        return credentialsList;
    }

    public Credentials getCredentialById(int id) throws SQLException{
        String sql = "SELECT id, website, username, encrypted_password, created_at FROM credentials WHERE id = ?";

        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sql)){
            preparedStatement.setInt(1, id);
            ResultSet resultset = preparedStatement.executeQuery();

            if(resultset.next()){
                return new Credentials(
                        resultset.getInt("id"),
                        resultset.getString("website"),
                        resultset.getString("username"),
                        resultset.getString("encrypted_password"),
                        resultset.getString("created_at")
                );
            }
        }
        return null;
    }

}


