import java.util.Scanner;
public class Electricity_bill {
         public static void main(String[] args) {
             Scanner input = new Scanner(System.in);
             System.out.print("Enter total units consumed: ");
             int units = input.nextInt();
             double bill;
             if (units <= 100) {
                bill = units * 5;
             }
             else if (units <= 200) {
                bill = (100 * 5) + ((units - 100) * 7);
             }
             else {
                bill = (100 * 5) + (100 * 7) + ((units - 200) * 15);
             }

            System.out.println("Total Bill = Rs. " + bill);
        }
    }

