package Pacman_Game;
import java.util.Random;
public class map {
    int row;
    int col;
    char [][] grid= {
            "############".toCharArray(), // 12
            "#P.......G.#".toCharArray(), // 12
            "#.####.....#".toCharArray(), // 12
            "#....#..o..#".toCharArray(), // 12
            "#....#.....#".toCharArray(), // 12
            "############".toCharArray()
    };
    public void printGrid(){
        for(int row=0; row<grid.length; row++){
            System.out.println(new String (grid[row]));
        }
        System.out.println();

    }
    public boolean wall_collision(int row, int col){
       if(row < 0 || row >= grid.length || col < 0 || col >= grid[row].length){
           return true;
       }
       boolean iswall =( grid[row][col] == '#');
       if(iswall){
           System.out.println("Ooops! You have hit the wall.");
       }
       return iswall;

    }
    private final Random rand = new Random();
    public void food_change(){
        int tries = 0;
        while (tries < 200) {
            int r = rand.nextInt(grid.length);
            int c = rand.nextInt(grid[0].length);

            if (grid[r][c] == '.') {
                grid[r][c] = 'o';
                return;
            }
            tries++;
        }
    }



}
