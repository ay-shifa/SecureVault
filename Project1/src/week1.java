import java.util.Scanner;
public class week1 {
    public static void task1 (String[] args){
        Scanner sc = new Scanner(System.in);
        //int num = sc.nextInt();
        //String name = sc.nextline();
        System.out.println("So here are the week one t;" +
                "asks!\n Task No.1: ");
        System.out.println("Enter your byte number: ");
        int num = sc.nextInt();
        //System.out.println("Type m for megabyte conversion and type g for giga byte conversion");
        System.out.println("Gigabyte:"+ (num*2)+ "\nMegabyte:" + (num*3));

    }
    // Task 2 aggregate calculator
    public static void main(String[] args){
        Scanner sc = new Scanner(System.in);
        System.out.println("Enter your Ecat marks: ");
        int ecat = sc.nextInt();
        System.out.println("Enter your intermediate part 1 marks: ");
        int inter = sc.nextInt();
        System.out.println("Enter your matric marks: ");
        int matric = sc.nextInt();
        double formula = (((ecat*33)/100) + ((inter*50)/100) + ((matric*17)/100)) ;
        System.out.println("Your aggregate is: "+ formula);

    }
}

