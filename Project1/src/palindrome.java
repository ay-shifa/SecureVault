import java.util.Scanner;
public class palindrome {
    public static void main(String[] args){
      Scanner input = new Scanner(System.in);
      System.out.println("Enter your number to check if palindrome or not: ");
      int num = input.nextInt();
      int originalNumber = num;
      int reverseNumber = 0;

      while (num !=0){
         int lastDigit = num % 10;
         reverseNumber =reverseNumber*10 + lastDigit;
         num = num / 10;
      }

      if(originalNumber==reverseNumber){
          System.out.println("Your number is palindrome.");
      }else{
          System.out.println("Your number is not palindrome.");
      }
//      int a=7;
//        int b= ++a;
//        System.out.println(b);

    }
}
