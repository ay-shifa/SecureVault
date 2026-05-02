import java.util.Scanner;
class percct{
    private double total;
    private double obt;

    public percct(double total, double obt  ) {
        this.total = total;
        this.obt = obt;
    }
    public double getObt() {return obt;}
    public double getTotal() {return total;}

    public double formula(){
        return (getObt()*100)/getTotal();
    }
}
public class constructor {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        percct prct = new percct(300,250);
        double a = prct.formula();
        System.out.println("Your percentage is:" + a );



    }
}

