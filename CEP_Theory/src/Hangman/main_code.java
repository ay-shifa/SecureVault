package Hangman;

import java.util.Scanner;

public class main_code {
    public static void main(String[] args) {
        structure str = new structure();
        guessTracker tracker = new guessTracker();
        Scanner sc = new Scanner(System.in);

        System.out.println("Welcome to the Hangman Game.");
        System.out.println("""
         _                                            
        | |                                           
        | |__   __ _ _ __   __ _ _ __ ___   __ _ _ __ 
        | '_ \\ / _` | '_ \\ / _` | '_ ` _ \\ / _` | '_ \\
        | | | | (_| | | | | (_| | | | | | | (_| | | | |
        |_| |_|\\__,_|_| |_|\\__, |_| |_| |_|\\__,_|_| |_|
                            __/ |                      
                           |___/                       
        """);

        System.out.println("Guess a Country Word!");
        System.out.println();

        while (!str.isGameOver()) {
            str.printHangman();
            str.printWord();

            System.out.print("Please enter a letter: ");
            char guess = sc.next().charAt(0);

            boolean repeatedTooMuch = tracker.alreadyGuessed(guess);

            if (repeatedTooMuch) {
                str.removeAttempt();
            } else if (!tracker.wasRepeated) {
                str.user_input(guess);
            }

            System.out.println();
        }

        sc.close();
    }
}



