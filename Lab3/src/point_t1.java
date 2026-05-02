import java.util.Scanner;
class Point {
//    first i initialize three private attributes
    private int a, b ,c;
//    private int b;
//    private int c;
    public Point(int a, int b, int c) {
        this.a = a;
        this.b = b;
        this.c = c;
    }
    // now i generate a getter and setter methods for each attribute
    public int getA() {return a;}
    public int setA(int a) {return a;}
    public int getB() {return b;}
    public int setB(int b) {return b;}
    public int getC() {return c;}
    public int setC(int c) {return c;}
}
public class point_t1 {
    public static void main() {
        Point point = new Point(2, 5, 7);
        Scanner input = new Scanner(System.in);
        System.out.println("Enter your a value:");
        int x = input.nextInt();
//        point.setA(x);
        System.out.println("Enter your b value:");
        int y = input.nextInt();
//        point.setB(y);
        System.out.println("Enter your c value:");
        int z = input.nextInt();
//        point.setC(z);
        System.out.println("Your original values are: "+ point.getA()+ " " + point.getB()+" " +point.getC() );
        System.out.println("Your set values are: "+ point.setA(x)+ " " + point.setB(y)+" " +point.setC(z) );




    }
}