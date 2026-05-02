package Pacman_Game;
import java.util.Scanner;

public class main_file {
    public static void main(String[] args){
        Scanner sc = new Scanner(System.in);
        map is_map = new map();
        Player P = new Player(is_map);
        Ghost G = new Ghost(is_map);

        System.out.println("      WELCOME TO THE PACMAN GAME!       \n =====================================\n");
        boolean run = true;
        while(run){
            System.out.println("Your score is " + P.score);
            is_map.printGrid();
            System.out.println("\nWhere do you want to move? \nPress w for upward, s for left, a for downward, d for right!");
            char user_choice = sc.next().charAt(0);
            P.move(user_choice);
            G.ghostMove();

            if (G.player_caught(P)) {
                System.out.println("💀 Game Over! Ghost caught you!");
                run = false;
            }




        }
    }

}
