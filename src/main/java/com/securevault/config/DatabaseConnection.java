package com.securevault.config;

import java.sql.SQLException;
import java.sql.Connection;
import java.sql.DriverManager;

public class DatabaseConnection {
    private static final String URL = "jdbc:sqlite:securevault.db";
    public static Connection getConnection() throws SQLException{
        System.out.println("Connecting to: " + URL);
        return DriverManager.getConnection(URL);
    }
}
