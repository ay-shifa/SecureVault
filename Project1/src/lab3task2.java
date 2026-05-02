//create a program that prints the multiplication table of any number given by the user
import java.util.Scanner;
public class lab3task2 {
    public static void main(String[] args){
        Scanner sc = new Scanner(System.in);
        System.out.println("Enter your number: ");
        int num = sc.nextInt();
        int i = 1;
        while(i<=10){
            int result = i*num;
            System.out.println(num + " * " + i+ " = " + result);
            i += 1;
        }
    }
}

