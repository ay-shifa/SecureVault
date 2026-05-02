package NumberGuess;
import java.util.Random;
public class guessing {
    Random rand = new Random();
    int number;
    int attempts;
    public int numberSelect(String user_input){
        if(user_input.equals("Hard")||user_input.equals("hard")){
             number = rand.nextInt(1, 1000);
             attempts = 20;
        }else if(user_input.equals("Medium")||user_input.equals("medium")){
             number = rand.nextInt(1, 500);
             attempts = 15;
        }else if(user_input.equals("Easy")||user_input.equals("easy")){
             number = rand.nextInt(1, 100);
             attempts = 10;
        }
        return number;
    }

    public boolean check_guess(int input, ASCII art){
        if(input == number){
            art.printCorrectArt();
            System.out.println("Woohooooo! \uD83E\uDD73 You have got it right!!");
            return true;
        }else{
            System.out.println("Ooops! ☹\uFE0F Your guess is wrong.");
            System.out.println("Here's the \uD83E\uDD29 Hint:");
            if(input < number){
                art.printHigherArt();
                System.out.println("The number is Greater!");
            }else {
                art.printLowerArt();
                System.out.println("The number is Lower!");
            }
            return false;

        }
    }
}
