package Hangman;

import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.scene.Scene;
import javafx.scene.canvas.Canvas;
import javafx.scene.canvas.GraphicsContext;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

public class MainCode extends Application {

    private Structure str = new Structure();

    private final Label wordLabel = new Label();
    private final Label livesLabel = new Label();
    private final Label guessedLabel = new Label();
    private final Label messageLabel = new Label("Enter one letter and press Guess.");

    private final TextField inputField = new TextField();
    private final Button guessButton = new Button("Guess");
    private final Button playAgainButton = new Button("Play Again");

    private final Canvas canvas = new Canvas(260, 260);

    @Override
    public void start(Stage stage) {
        Label title = new Label("Welcome to Hangman - Guess a Country Word!");

        inputField.setPromptText("a-z");
        inputField.setMaxWidth(80);

        guessButton.setOnAction(e -> handleGuess());
        inputField.setOnAction(e -> handleGuess());
        playAgainButton.setOnAction(e -> resetGame());

        VBox root = new VBox(10, title, wordLabel, livesLabel, guessedLabel, canvas, inputField, guessButton, playAgainButton, messageLabel);
        root.setPadding(new Insets(15));

        refreshUI();

        Scene scene = new Scene(root, 420, 560);
        stage.setTitle("Hangman (JavaFX)");
        stage.setScene(scene);
        stage.show();
    }

    private void handleGuess() {
        String text = inputField.getText().trim().toLowerCase();
        inputField.clear();

        if (text.length() != 1 || !Character.isLetter(text.charAt(0))) {
            messageLabel.setText("Please enter exactly one letter.");
            return;
        }

        char ch = text.charAt(0);
        int result = str.userInput(ch);

        if (result == -1) {
            messageLabel.setText("Already guessed: " + ch);
        } else if (result == 0) {
            str.lives--;
            messageLabel.setText("Wrong guess!");
        } else {
            messageLabel.setText("Good guess!");
        }

        refreshUI();
        checkGameEnd();
    }

    private void refreshUI() {
        wordLabel.setText("Word: " + str.getHiddenWord());
        livesLabel.setText("Lives: " + str.lives);
        guessedLabel.setText("Guessed: " + str.getGuessedLetters());
        drawHangman(6 - str.lives);
    }

    private void checkGameEnd() {
        if (str.isWon()) {
            messageLabel.setText("You won! Word was: " + str.selectedWord);
            guessButton.setDisable(true);
            inputField.setDisable(true);
        } else if (str.lives <= 0) {
            messageLabel.setText("Game Over! Word was: " + str.selectedWord);
            guessButton.setDisable(true);
            inputField.setDisable(true);
        }
    }

    private void resetGame() {
        str = new Structure();
        guessButton.setDisable(false);
        inputField.setDisable(false);
        messageLabel.setText("New game started.");
        refreshUI();
    }

    private void drawHangman(int wrong) {
        GraphicsContext g = canvas.getGraphicsContext2D();
        g.clearRect(0, 0, canvas.getWidth(), canvas.getHeight());

        // gallows
        g.strokeLine(20, 240, 140, 240);
        g.strokeLine(50, 240, 50, 20);
        g.strokeLine(50, 20, 150, 20);
        g.strokeLine(150, 20, 150, 50);

        if (wrong >= 1) g.strokeOval(130, 50, 40, 40);      // head
        if (wrong >= 2) g.strokeLine(150, 90, 150, 150);    // body
        if (wrong >= 3) g.strokeLine(150, 105, 120, 125);   // left arm
        if (wrong >= 4) g.strokeLine(150, 105, 180, 125);   // right arm
        if (wrong >= 5) g.strokeLine(150, 150, 125, 190);   // left leg
        if (wrong >= 6) g.strokeLine(150, 150, 175, 190);   // right leg
    }

    public static void main(String[] args) {
        launch(args);
    }
}

