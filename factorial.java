import java.util.Scanner;
public class factorial {
    public static void main(String[] args){
        Scanner input = new Scanner(System.in);
        System.out.print("Enter a number: ");
        int n = input.nextInt();
        long fact;
        if(n<0){
            System.out.println("Invalid!");
        }else{
            fact = 1;
            for(int i =1; i<= n; i++){
                fact = fact * i;
            }
            System.out.println("Factorial of your number is: "+ fact);
        }
    }
}
