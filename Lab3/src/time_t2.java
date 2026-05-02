import java.util.Scanner;
class Time{
    private int hours;
    private int minutes;
    private int seconds;

    public int getHours() {return hours;}
    public void setHours(int hours) {this.hours = hours;}
    public int getMinutes() {return minutes;}
    public void setMinutes(int minutes) {this.minutes = minutes;}
    public int getSeconds() {return seconds;}
    public void setSeconds(int seconds) {this.seconds = seconds;}

    public void what_Time(int no_of_sec_till_noon){
        int current_seconds = 43200 - no_of_sec_till_noon;
        this.hours = current_seconds / 3600;
        int remaining =  current_seconds % 3600;
        this.minutes = remaining / 60;
        this.seconds = remaining % 60;
    }
}
public class time_t2 {
    public static  void main(String args[]) {
        Time t = new Time();

        Scanner sc = new Scanner(System.in);
        System.out.println("Enter your seconds here: ");
        int no_of_sec = sc.nextInt();
        t.what_Time(no_of_sec);

        System.out.println(t.getHours() + ":" + t.getMinutes() + ":" + t.getSeconds());

    }
}