//Write a code that takes a number value from user and displays the inverse of it.
// Number can be of any length.

import java.util.Scanner;
public class inverse_no {
    public static void main(String[] args){
        Scanner input = new Scanner(System.in);
        System.out.println("Enter your number: ");
        int number = input.nextInt();
        int original = number;
        int reverse_number = 0;
        while(original != 0){
            int last_digit = original % 10;
            reverse_number = reverse_number * 10 + last_digit;
            original = original / 10;
        }
        System.out.println("Reverse number is: " + reverse_number );
        System.out.println("Original number was: "+ number);
    }
}
