package Pacman_Game;
import java.util.Random;
public class Ghost {
    private final Random rand = new Random();
    private int pos_x;
    private int pos_y;
    private final map m;

    Ghost(map m){
        this.m = m;
        for(int r=0; r< m.grid.length; r++){
            for(int c=0; c < m.grid[0].length; c++){
                if(m.grid[r][c]=='G') {
                    pos_x = r;
                    pos_y = c;
                    return;
                }
            }
        }
    }


    public void ghostMove() {
        int tries = 0;
        while (tries < 10) {
            int new_posx = pos_x;
            int new_posy = pos_y;
            int random_no = rand.nextInt(4);
            switch (random_no) {
                case 0:
                    new_posx--;  // (up = row - 1)
                    break;
                case 1:
                    new_posx++; // (down = row + 1)
                    break;
                case 2:
                    new_posy++; // (right = col + 1)
                    break;
                case 3:
                    new_posy--; // (right = col + 1)
                    break;
                default:
                    System.out.println("Invalid Key!");
                    return;

            }

        if (new_posx<0 || new_posx>= m.grid.length || new_posy <0 || new_posy >= m.grid[0].length || m.grid[new_posx][new_posy]== '#') {
            tries++;
            continue;
        }
        m.grid[pos_x][pos_y] = '.';
        pos_x = new_posx;
        pos_y = new_posy;
        m.grid[new_posx][new_posy] = 'G';
        return;
        }
    }
    public boolean player_caught(Player p){
        return (pos_x == p.getX() && pos_y == p.getY());
    }
}
