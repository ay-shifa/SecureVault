public class con_chain_t7 {
    public static void main(String[] args) {
        int random = (int)(Math.random()*24);
        if (random>=5&&random<=11)
        {
            System.out.println("Good Morning!!");
        }
        else if (random>=12&&random<=17)
        {
            System.out.println("Good Afternoon!!");
        }
        else if (random>=18&&random<=23)
        {
            System.out.println("Good Evening!!");
        }else
        {
            System.out.println("Ooops! Invalid Hour");
        }
    }
}
