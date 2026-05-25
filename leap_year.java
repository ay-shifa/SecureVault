//Write a Program that takes year as an input from user and determine
// if it’s a leap year or not.
import java.util.Scanner;
public class leap_year {
    public static void main(String[] args){
        Scanner input = new Scanner(System.in);
        System.out.println("Enter your year: ");
        int leapyear = input.nextInt();
        if(leapyear % 400 ==0){
            System.out.println("This is a leap year!");
        }else if(leapyear % 100 == 0){
            System.out.println("This is not a leap year!");
        }
        else if(leapyear % 4 == 0) {
            System.out.println("This is a leap year!");
        }
        else{
            System.out.println("This is not a leap year!");
        }
    }
}
