//Write a program that takes an integer n from command-line arguments and uses a while loop to compute the
//number of times you need to divide n by 2 until it is strictly less than 1.
// Print the error message “Illegal input” if n is negative.
import java.util.Scanner;
public class command_line_args {
    public static void main(String[] args) {
    Scanner input = new Scanner(System.in);
    System.out.println("Enter your number n: ");
    int num = input.nextInt();
    if (num < 0) {
        System.out.println("Illegal input");
        return;
    }
    int count = 0;
    while (num >= 1) {
        num = num / 2;
        count++;
    }
    System.out.println("The count is:" + count);
    }
}
