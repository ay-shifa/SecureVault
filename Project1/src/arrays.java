import java.util.Scanner;

public class arrays {
    double a= 9.9;
    float b =8.9F;
    long c = (long) 8.9998;


    void main(){
        Scanner input = new Scanner(System.in);
        int [] students=new int[3];
        int i = 0;
        while(i<3) {
            //int []students =new int[3];

            System.out.println("Enter your value: ");
            int num = input.nextInt();
            students[i] = num;
            i += 1;

        }
        System.out.println(students[0] + " "+students[1]+ " "+students[2]);


    }
}
