import java.util.Scanner;

public class inc_dec {
         public static void main(String[] args) {

            Scanner input = new Scanner(System.in);

            System.out.print("Enter starting value: ");
            int start = input.nextInt();

            System.out.print("Enter ending value: ");
            int end = input.nextInt();

            if (start <= end) {
                System.out.println("Increasing Series:");

                for (int i = start; i <= end; i++) {
                    System.out.print(i + " ");
                }
            }
            else {
                System.out.println("Decreasing Series:");

                for (int i = start; i >= end; i--) {
                    System.out.print(i + " ");
                }
            }
        }
    }

