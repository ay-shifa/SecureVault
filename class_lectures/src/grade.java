import java.util.Scanner;

class percctt{
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
public class grade {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);
        percctt prct = new percctt();
        prct.setTotal(300);
        prct.setObt(250);


        double a = prct.formula();
        System.out.println("Your percentage is:" + a );
        String grade;
            if(a>=90){
                System.out.println("grade = \"A\"");}
            else if(a>=85 && a<90){
                System.out.println("grade = \"A-\"");}
            else if(a>=80 && a<85){
                System.out.println("grade = \"B+\"");}
            else if(a>=75 && a<80){
                System.out.println("grade = \"B\"");}
            else if(a>=70 && a<75){
                System.out.println("grade = \"B-\"");}
            else if(a>=65 && a<70){
                System.out.println("grade = \"C+\"");}
            else if(a>=60){
                System.out.println("grade = \"C\"");};

    }

}
