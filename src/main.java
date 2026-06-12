abstract class Studentt {
    void name(){};
    void rollNumber(){};
    void print(){
        System.out.println("Section C");
    }
}
abstract class Teacherr{
    void name(){};
}
class ABC extends Studentt {
    @Override
    public void name(){
        System.out.println("Shifa Fatima");
    }

    @Override
    public void rollNumber() {

    }
}

public class main {
    public static void main(String[] args) {}
    Studentt s1 = new ABC();
//    s1.name();
}
