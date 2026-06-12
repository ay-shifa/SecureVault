public interface Student {
    abstract void name();
    void rollNumber();
}
abstract class XY{
    void section(){};
}
class AB  extends XY implements  Student {
    @Override
    public void name(){
        System.out.println("Shifa Fatima");
    }

    @Override
    public void rollNumber() {

    }

//    @Override
//    public void TName() {}
}
