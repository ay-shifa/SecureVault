import java.util.Scanner;
class Time{
   int hour, min, sec;
   int sec_diff;

    public Time(int hour, int min, int sec) {
        this.hour = hour;
        this.min = min;
        this.sec = sec;
    }

    public Time() {

    }

    int sec_formula(){
        int total_sec = (hour * 3600)+(min*60)+(sec);
        return total_sec;

    }
    void diff_in_sec(int value1, int value2){
         sec_diff =  Math.abs(value1 - value2);
    }
    void back(){
        hour = sec_diff/3600;
        min = (sec_diff%3600)/60;
        sec = sec_diff%60;
    }
}
public class JTime {
    public static void main(String[] args) {
       Scanner input = new Scanner(System.in);
        System.out.println("Enter your hours: ");
        int hours1 = input.nextInt();
        System.out.println("Enter your minutes: ");
        int minutes1 = input.nextInt();
        System.out.println("Enter your seconds: ");
        int seconds1 = input.nextInt();
        System.out.println("Enter your second time hours: ");
        int hours2 = input.nextInt();
        System.out.println("Enter your second time minutes: ");
        int minutes2 = input.nextInt();
        System.out.println("Enter your second time seconds: ");
        int seconds2 = input.nextInt();
        Time time_stamp1 = new Time(hours1, minutes1, seconds1);
        Time time_stamp2 = new Time(hours2, minutes2, seconds2);
        Time diff = new Time();
        diff.diff_in_sec( time_stamp1.sec_formula(), time_stamp2.sec_formula());
        diff.back();
        System.out.println("Your Seconds Difference Is: "+ diff.sec_diff);

        System.out.printf("Your Time Difference Is: " + diff.hour+" Hours, " + diff.min+" Minutes, "+ diff.sec+" Seconds  ");




    }
}
