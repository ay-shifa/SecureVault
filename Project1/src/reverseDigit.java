import java.util.Scanner;
public class reverseDigit {
    public static void main(String[] args){
     Scanner sc = new Scanner(System.in);
     System.out.println("Enter your digit to reverse:");
     int num = sc.nextInt();
     int originalNumber = num;
     int reverseNumber = 0;
     while (num !=0){
         int lastDigit = num % 10;
         reverseNumber =reverseNumber*10 + lastDigit;
         num = num / 10;
        }
     System.out.println(reverseNumber);

    }
}
