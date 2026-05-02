import java.util.Scanner;
public class hello{
    public static void main(String args[]) {
        //int a = 21;
        //int b = 12;

        Scanner sc = new Scanner(System.in);
        System.out.println("Enter a num, 1 for add, 2 for subtract, 3 for multiply, 4 for divide: ");
        int num = sc.nextInt();
        System.out.println("Enter your value of a:");
        int a = sc.nextInt();
        System.out.println("Enter your value of b:");
        int b = sc.nextInt();
        if (num == 1){
            System.out.println(a+b);
        }
        else if(num == 2){
            System.out.println(a-b);
        }
        else if(num == 3){
            System.out.println(a*b);
        }
        else if(num == 4) {
            System.out.println((double)a / b);
        }
        else{
            System.out.println("Invalid");
        }


    }
}



