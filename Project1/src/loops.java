//take a double num from user and convert it into int and print natural numbers upto it
import java.util.Scanner;
public class loops {
    public static void main(String[]args){
      Scanner sc = new Scanner(System.in);
      System.out.println("Enter your number in double:");
      double num = sc.nextDouble();
      int number = (int)num;
      int i = 1;
      while(i <= number ){
          System.out.println(i);
          i += 1;
      }

    }
}
