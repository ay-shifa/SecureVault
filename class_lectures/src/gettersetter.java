import java.util.Scanner;
class perctt{
    private double total;
    private double obt;


    public double getObt() {return obt;}
    public void setObt(int obt) {this.obt = obt;}
    public double getTotal() {return total;}
    public void setTotal(int total) {this.total = total;}


    public double formula(){
        return (getObt()*100)/getTotal();
    }
}
public class gettersetter {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        perctt prct = new perctt();
        prct.setTotal(300);
        prct.setObt(250);

        double a = prct.formula();
        System.out.println("Your percentage is:" + a );

    }
}
