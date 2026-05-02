package Hangman;

import java.util.ArrayList;

public class guessTracker {
    ArrayList<Character> guessedLetters = new ArrayList<>();
    int repeatWarnings = 3;
    boolean wasRepeated = false;

    public boolean alreadyGuessed(char input) {
        input = Character.toLowerCase(input);
        wasRepeated = false;

        if (guessedLetters.contains(input)) {
            wasRepeated = true;
            repeatWarnings--;

            System.out.println("This letter is already guessed!");
            System.out.println("Warnings left: " + repeatWarnings);

            if (repeatWarnings == 0) {
                repeatWarnings = 3;
                System.out.println("You repeated guesses 3 times, so one attempt is removed.");
                return true;
            }

            return false;
        }

        guessedLetters.add(input);
        return false;
    }
}


