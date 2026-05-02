import java.util.Scanner;
public class factorial {
    public static void main(String[]args){
        Scanner number = new Scanner(System.in);
        System.out.println("Enter a number to find factorial of:");
        int num = number.nextInt();
        //int i = 1;
        int result = 1;
        for(int i =1; i<=num; i++) {
            //int result = 1;
            result *= i;
            //System.out.println("The factorial is: " + result);


        }
        System.out.println("The factorial is: " + result);
    }

}
