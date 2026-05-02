class Student{
    private String name;
    private int roll_no;
    Student(String name,int roll_no){
        this.name=name;
        this.roll_no=roll_no;
        System.out.println(name);
        System.out.println(roll_no);
    }
    public String getName(){return this.name;}
    public int getRoll_no(){return this.roll_no;}
    public void setName(String name){this.name = name;}
    public void setRoll_no(int roll_no){this.roll_no = roll_no;}
}

public class accessmod {
    public static void main(String[] args) {
            Student st = new Student("Shifa", 133);
            st.setName("Fatima");
            st.setRoll_no(2025133);

    }
}
