package NumberGuess;

public class ASCII {

    public void printBanner() {
        System.out.println("""
         _   _                 _                  _____
        | \\ | |               | |                / ____|
        |  \\| |_   _ _ __ ___ | |__   ___ _ __  | |  __ _   _  ___  ___ ___
        | . ` | | | | '_ ` _ \\| '_ \\ / _ \\ '__| | | |_ | | | |/ _ \\/ __/ __|
        | |\\  | |_| | | | | | | |_) |  __/ |    | |__| | |_| |  __/\\__ \\__ \\
        |_| \\_|\\__,_|_| |_| |_|_.__/ \\___|_|     \\_____|\\__,_|\\___||___/___/
        """);

        System.out.println("Find the secret number before attempts run out!");
        System.out.println("==============================================================");
    }

    public void printMenuArt() {
        System.out.println("""
        .-----------------------------.
        |        CHOOSE A LEVEL       |
        '-----------------------------'

        [ Easy ]    1 - 100      10 tries
        [ Medium ]  1 - 500      15 tries
        [ Hard ]    1 - 1000     20 tries
        """);
    }

    public void printRangeArt(String input) {
        if (input.equals("Hard") || input.equals("hard")) {
            System.out.println("""
            HARD MODE UNLOCKED
            |1|---------|500|---------|1000|

            Big range. Bigger glory.
            """);
        } else if (input.equals("Medium") || input.equals("medium")) {
            System.out.println("""
            MEDIUM MODE
            |1|-----------|250|-----------|500|

            Balanced. Brave. Reasonable.
            """);
        } else if (input.equals("Easy") || input.equals("easy")) {
            System.out.println("""
            EASY MODE
            |1|-------------|50|-------------|100|

            Warm-up round. Still counts.
            """);
        } else {
            System.out.println("""
            [X] Wrong input!
            Please restart and choose Easy, Medium, or Hard.
            """);
        }
    }

    public void printCorrectArt() {
        System.out.println("""
         ___________
        '._==_==_=_.' 
        .-\\:      /-.
       | (|:.     |) |
        '-|:.     |-'
          \\::.    /
           '::. .'
             ) (
           _.' '._
          `-------`
    """);
    }

    public void printHigherArt() {
        System.out.println("""
                ^
               / \\
              /   \\
             /_____\\
               | |
               | |   Hint: aim HIGHER!
        """);
    }

    public void printLowerArt() {
        System.out.println("""
               | |
               | |   Hint: aim LOWER!
             \\_____/
              \\   /
               \\ /
                v
        """);
    }

    public void printDuplicateArt() {
        System.out.println("""
             __
        ____/ /___  ____  ____
       / __  / __ \\/ __ \\/ __ \\
      / /_/ / /_/ / /_/ / /_/ /
      \\__,_/\\____/\\____/ .___/
                      /_/

        You already tried that number.
        """);
    }

    public void printGameOver() {
        System.out.println("""
          _____                         ____                 
         / ____|                       / __ \\                
        | |  __  __ _ _ __ ___   ___  | |  | |_   _____ _ __ 
        | | |_ |/ _` | '_ ` _ \\ / _ \\ | |  | \\ \\ / / _ \\ '__|
        | |__| | (_| | | | | | |  __/ | |__| |\\ V /  __/ |   
         \\_____|\\__,_|_| |_| |_|\\___|  \\____/  \\_/ \\___|_|   
        """);

        System.out.println("Thank you for playing!");
    }
}

