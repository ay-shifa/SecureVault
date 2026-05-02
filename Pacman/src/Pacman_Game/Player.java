package Pacman_Game;

public class Player {
    private int pos_x;
    private int pos_y;
    private map m;

    int score =0;


    Player(map m){
        this.m = m;
        for(int r=0; r< m.grid.length; r++){
            for(int c=0; c < m.grid[0].length; c++){
                if(m.grid[r][c]=='P') {
                    pos_x = r;
                    pos_y = c;

                }
            }
        }
    }
    int new_posx;
    int new_posy;

    public void move(char input){
        new_posx = pos_x;
        new_posy = pos_y;
        switch (input) {
            case 'w':
                new_posx--;  // (up = row - 1)
                break;
            case 'a':
                new_posy--; // (left = col - 1)
                break;
            case 's':
                new_posx++; // (down = row + 1)
                break;
            case 'd':
                new_posy++; // (right = col + 1)
                break;
            default:
                System.out.println("Invalid Key!");
                return;
        }
        if(m.wall_collision(new_posx, new_posy)){
            System.out.println("You can't escape the boundary!");
            return;
        }

        score(new_posx, new_posy);

        m.grid[pos_x][pos_y] = '.';
        m.grid[new_posx][new_posy] = 'P';
        pos_x = new_posx;
        pos_y = new_posy;


    }
    public void score(int posx, int posy){
        if(m.grid[posx][posy] == 'o'){
            score += 1;
            m.food_change();
        }
    }
    public int getX(){
        return pos_x;
    }
    public int getY(){
        return pos_y;
    }

}

