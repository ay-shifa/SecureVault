import java.util.Scanner;
public class calculator_t3 {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        System.out.println("Enter the value of your monthly salary : ");
        float monthly_salary = input.nextFloat(); //this is the monthly salary of the user
        System.out.println("Enter the value of amount you want to save, in decimal: ");
        float portion_saved = input.nextFloat(); // the portion user want to save from its salary like 10% or 15% etc
        System.out.println("Enter the total cost of your dream asset: ");
        int total_cost = input.nextInt(); // this is the total cost of the asset he wants to buy
        float monthly_saving = monthly_salary * portion_saved;

        // this is the amount which i want to save from my monthly salary


//        float current_savings = 0;
        double portion_down_payment = (0.25) * (total_cost);
        int no_of_months = 0;
        float current_savings = 0;
        while(current_savings < portion_down_payment) {
            float r = 0.04f;
            float monthly_interest = current_savings * r / 12; // this is the saving with the interest rate
            current_savings = current_savings + (monthly_saving + monthly_interest);
            no_of_months++;

        }

        System.out.println("Number of months: " + no_of_months);



    }
}
