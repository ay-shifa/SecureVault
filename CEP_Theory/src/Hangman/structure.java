package Hangman;

import java.util.Random;

public class structure {
    String[] list = {
            "China",
            "Japan",
            "Pakistan",
            "Malta",
            "Switzerland",
            "Canada",
            "Germany"
    };

    Random rand = new Random();
    int index = rand.nextInt(list.length);

    String selected_word = list[index].toLowerCase();
    int len = selected_word.length();

    char[] hidden_word = new char[len];

    int wrongGuesses = 0;
    int maxWrongGuesses = 6;

    public structure() {
        for (int i = 0; i < len; i++) {
            hidden_word[i] = '_';
        }
    }

    public void user_input(char input) {
        input = Character.toLowerCase(input);
        boolean found = false;

        for (int i = 0; i < len; i++) {
            if (input == selected_word.charAt(i)) {
                hidden_word[i] = selected_word.charAt(i);
                found = true;
            }
        }

        if (found) {
            System.out.println("Correct guess!");
        } else {
            wrongGuesses++;
            System.out.println("Wrong guess!");
            System.out.println("Wrong guesses left: " + (maxWrongGuesses - wrongGuesses));
        }
    }

    public void removeAttempt() {
        wrongGuesses++;
        System.out.println("Wrong guesses left: " + (maxWrongGuesses - wrongGuesses));
    }

    public void printWord() {
        System.out.print("Word: ");

        for (int i = 0; i < len; i++) {
            System.out.print(hidden_word[i] + " ");
        }

        System.out.println();
    }

    public boolean hasWon() {
        for (int i = 0; i < len; i++) {
            if (hidden_word[i] == '_') {
                return false;
            }
        }

        return true;
    }

    public boolean isGameOver() {
        return hasWon() || wrongGuesses >= maxWrongGuesses;
    }

    public void printHangman() {
        if (wrongGuesses == 0) {
            System.out.println("""
              +---+
              |   |
                  |
                  |
                  |
                  |
            =========
            """);
        } else if (wrongGuesses == 1) {
            System.out.println("""
              +---+
              |   |
              O   |
                  |
                  |
                  |
            =========
            """);
        } else if (wrongGuesses == 2) {
            System.out.println("""
              +---+
              |   |
              O   |
              |   |
                  |
                  |
            =========
            """);
        } else if (wrongGuesses == 3) {
            System.out.println("""
              +---+
              |   |
              O   |
             /|   |
                  |
                  |
            =========
            """);
        } else if (wrongGuesses == 4) {
            System.out.println("""
              +---+
              |   |
              O   |
             /|\\  |
                  |
                  |
            =========
            """);
        } else if (wrongGuesses == 5) {
            System.out.println("""
              +---+
              |   |
              O   |
             /|\\  |
             /    |
                  |
            =========
            """);
        } else {
            System.out.println("""
              +---+
              |   |
              O   |
             /|\\  |
             / \\  |
                  |
            =========
            """);
        }
    }
}






