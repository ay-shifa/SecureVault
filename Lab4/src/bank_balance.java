//We are going to develop a menu-driven application to manage a simple bank account class. It supports the
//following operations
//a. Deposit money (to add an amount in current balance)
//b. Withdraw money (to subtract an amount from the current balance)
//c. Check balance (to display current balance of customer)
//Note: Use a Switch statement to enter the choice of operation from the user. For initially create a function
//withname saving account to store the current balance of the customer. Write a Java class along with a driver
//program to test it.

import java.util.Scanner;
class Bank_account{
    Scanner input = new Scanner(System.in);
    float current_balance = 0;
    public void deposit(){
        System.out.println("Enter your deposit amount: ");
        float dep_amount = input.nextFloat();
        current_balance = current_balance + dep_amount;
        System.out.println("Your money is SUCCESSFULLY deposited!");
        System.out.println("Your current balance is "+current_balance);
    }
    public void withdraw(){
        System.out.println("Enter your withdraw amount here: ");
        float wd_amount = input.nextFloat();
        if(wd_amount > current_balance){
            System.out.println("Insufficient amount in your balance!");
        }else {
            current_balance = current_balance - wd_amount;
            System.out.println("Here is your withdraw amount:" + wd_amount);
            //        System.out.println("Your current balance is "+new_balance);
        }
    }
    public void check_balance(){
        float new_balance = current_balance;
        System.out.println("Here is your current balance: " + new_balance);
    }
}
class Menu{
    Bank_account acc = new Bank_account();
    public void menu_show(){

        System.out.println("============== MENU ===============\n");
        System.out.println("What do you want to do? \n 1. Deposit money \n 2. Withdraw money \n 3. Check balance  ");
        System.out.println("Press key according to your choice: ");
    }
    public void menu_key(int choice){

        switch (choice){
            case 1:
                acc.deposit();
                break;
            case 2:
                acc.withdraw();
                break;
            case 3:
                acc.check_balance();
                break;
            default:
                System.out.println("Invalid Key!");}

    }
}
public class bank_balance {
    public static void main(String [] args) {
       Scanner sc = new Scanner(System.in);
       Menu menu = new Menu();
       boolean run = true;
       while(run) {
           menu.menu_show();
           int key = sc.nextInt();
           menu.menu_key(key);
           System.out.println("Press 1 to continue and 0 to stop!");
           int stop_key = sc.nextInt();
           if(stop_key == 0){
               run = false;
           }

       }
    }
}
