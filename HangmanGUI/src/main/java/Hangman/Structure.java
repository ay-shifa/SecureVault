package Hangman;

import java.util.Random;

public class Structure {
    String[] list = {"china", "japan", "pakistan", "paris", "malta", "switzerland", "canada", "germany"};
    Random rand = new Random();

    int index = rand.nextInt(list.length);
    String selectedWord = list[index];
    int len = selectedWord.length();

    char[] hidden = new char[len];
    int lives = 6;
    String guessedLetters = "";

    Structure() {
        for (int i = 0; i < len; i++) hidden[i] = '_';
    }

    // -1 = already guessed, 0 = wrong, 1 = correct
    public int userInput(char input) {
        if (guessedLetters.indexOf(input) != -1) return -1;

        guessedLetters += input + " ";
        boolean found = false;

        for (int i = 0; i < len; i++) {
            if (selectedWord.charAt(i) == input) {
                hidden[i] = input;
                found = true;
            }
        }
        return found ? 1 : 0;
    }

    public boolean isWon() {
        for (char c : hidden) if (c == '_') return false;
        return true;
    }

    public String getHiddenWord() {
        StringBuilder sb = new StringBuilder();
        for (char c : hidden) sb.append(c).append(' ');
        return sb.toString();
    }

    public String getGuessedLetters() {
        return guessedLetters;
    }
}

