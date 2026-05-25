package NumberGuess;
import java.util.Scanner;
import java.util.ArrayList;
public class main_file {
    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);
        guessing gs = new guessing();
        ASCII art = new ASCII();

        art.printBanner();
        art.printMenuArt();

        //System.out.println("NUMBER GUESSING GAME!");
        //System.out.println("Choose the level:\nHard\nMedium\nEasy");

        String input = sc.nextLine();
        art.printRangeArt(input);
        gs.numberSelect(input);

//        if(input.equals("Hard")|| input.equals("hard")){
//            System.out.println("Guess in range of 1-1000.");
//        }else if(input.equals("Medium")|| input.equals("medium")){
//            System.out.println("Guess in range of 1-500.");
//        }else if(input.equals("Easy")|| input.equals("easy")){
//            System.out.println("Guess in range of 1-100.");
//        }else{
//            System.out.println("Wrong input!");
//        }


        ArrayList<Integer> store = new ArrayList<>();
        int warnings =5;
        while(gs.attempts>0){
            System.out.println("What is your guess?");
            int guess = sc.nextInt();
            if(store.contains(guess)){
                warnings--;
                art.printDuplicateArt();
                System.out.println("Your remaining warnings are: " + warnings/5);

                if(warnings==0){
                    art.printGameOver();
                    break;
                }
                continue;
            }
            store.add(guess);
            boolean result = gs.check_guess(guess, art);
            if(result == true){
                break;
            }
            gs.attempts--;
            System.out.println("Your attempts left:" + gs.attempts);
            if(gs.attempts == 0){
                System.out.println("Game over! You have ran out of attempts.");
            }



        }
    }
}
