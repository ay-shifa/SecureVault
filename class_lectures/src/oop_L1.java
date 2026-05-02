//USER DEFINED DATA TYPE
class st
{
    int roll;
    float marks;
    String name;
    // roll, marks, name are instance variables

        }
public class oop_L1 {
    public static void main(){
        // to create a object
        st st1 = new st(); // this is the object created: st1
        // st1 is also the reference variable
        // heap memory always allocate on run time
        // the memory allocation on run time is called "dynamic memory allocation"
        // stack memory access on compile time
        String [] st_name = new String [5];
        int [] st_roll = new int [5];
        float [] st_marks = new float [5];
        st [] s = new st[5]; // the best way yet to store multiple data types in a single array


    }
}
