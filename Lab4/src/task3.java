import java.util.Scanner;
import java.util.Random;

class Move {
    public int current_x_cor_ali = 0;
    public int current_y_cor_ali = 0;
    public int current_x_cor_hassan = 0;
    public int current_y_cor_hassan = 0;
    public void hassan_movement() {
        Random rand = new Random();
        int direction = rand.nextInt(4);
        switch (direction) {
            case 1:
                current_y_cor_hassan += 1;
                break;
            case 2:
                current_y_cor_hassan -= 1;
                break;
            case 3:
                current_x_cor_hassan += 1;
                break;
            case 4:
                current_x_cor_hassan -= 1;
                break;
            default:
                System.out.println("invalid keyword");}

        System.out.println("Now: Current location of Hassan is: " + "(" + current_x_cor_hassan + "," + current_y_cor_hassan + ")");

//        return Integer.parseInt("("+current_x_cor_hassan+","+current_y_cor_hassan+")") ;

//        return (current_x_cor_hassan, current_y_cor_hassan)


        }

        public void hurdles () {
            if (current_x_cor_hassan == 1 && current_y_cor_hassan == 2) {
                System.out.println("Hassan Hit a Hurdle!");
            }
            if (current_x_cor_hassan == 2 && current_y_cor_hassan == 1) {
                System.out.println("Hassan Hit a Hurdle!");
            }
            if (current_x_cor_hassan == 5 && current_y_cor_hassan == 6) {
                System.out.println("Hassan Hit a Hurdle!");
            }
            if (current_x_cor_hassan == 3 && current_y_cor_hassan == 4) {
                System.out.println("Hassan Hit a Hurdle!");
            }
            if (current_x_cor_hassan == -1 && current_y_cor_hassan == -3) {
                System.out.println("Hassan Hit a Hurdle!");
            }
            if (current_x_cor_hassan == -2 && current_y_cor_hassan == 5) {
                System.out.println("Hassan Hit a Hurdle!");
            }
            if (current_x_cor_hassan == 5 && current_y_cor_hassan == -8) {
                System.out.println("Hassan Hit a Hurdle!");
            }
            if (current_x_cor_hassan == -3 && current_y_cor_hassan == -6) {
                System.out.println("Hassan Hit a Hurdle!");
            }
            if (current_x_cor_hassan == 1 && current_y_cor_hassan == 0) {
                System.out.println("Hassan Hit a Hurdle!");
            }
            if (current_x_cor_hassan == 5 && current_y_cor_hassan == 1) {
                System.out.println("Hassan Hit a Hurdle!");
            }
            if (current_x_cor_hassan == 4 && current_y_cor_hassan == -2) {
                System.out.println("Hassan Hit a Hurdle!");
            }
            if (current_x_cor_hassan == 3 && current_y_cor_hassan == 5) {
                System.out.println("Hassan Hit a Hurdle!");}


        }

        public void movement ( char input){
            switch (input) {
                case 'v':
                    current_y_cor_ali += 1;
                    break;
                case 'w':
                    current_y_cor_ali -= 1;
                    break;
                case 'p':
                    current_x_cor_ali += 1;
                    break;
                case 'q':
                    current_x_cor_ali -= 1;
                    break;
                default:
                    System.out.println("invalid keyword");
            }
            System.out.println("Now: Current location of Ali is: " + "(" + current_x_cor_ali + "," + current_y_cor_ali + ")");


        }


    }
public class task3 {
        public static void main(String[] args) {
            Scanner input = new Scanner(System.in);
//        Random rand = new Random();


//        first to create a boundary
            final int x_cor = 20;
            final int y_cor = 20;
//        ali or hassan ki position b set krni he, hm movement ke liye ek alag class bnaye gy

            Move move = new Move();
            System.out.println("Starting: Current location of Ali is: " + "(" + move.current_x_cor_ali + "," + move.current_y_cor_ali + ")");
            System.out.println("Starting: Current location of Hassan is: " + "(" + move.current_x_cor_hassan + "," + move.current_y_cor_hassan + ")");
            boolean run = true;
            while (run) {
                System.out.println("To move Ali: Press 'v' to move up, 'w' to down, 'p' to right and 'q' to left! ");
                char user_input = input.next().charAt(0);
                move.movement(user_input);
//            System.out.println("Now: Current location of Ali is: " + "(" + move.current_x_cor_ali + "," + move.current_y_cor_ali + ")");

//        int hassan_ran_pos = rand.nextInt(20) +1;
                move.hassan_movement();
                String xy = "(" + move.current_x_cor_hassan + "," + move.current_y_cor_hassan + ")";
                move.hurdles();
                System.out.println("Press 00 to stop!");
                int choice =  input.nextInt();
                if(choice == 00){
                    run = false;
                }else{
                    run = true;
                }


            }

        }
    }

