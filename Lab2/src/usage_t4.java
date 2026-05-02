public class usage_t4 {
    public static void main(String[] args) {
        boolean has_ID = true;
        boolean is_Over_18 = false;
        if (has_ID&&is_Over_18){
            System.out.println("The Access is Granted!!");
        }else if (has_ID||is_Over_18){
            System.out.println("Special Guest!!");
        }else{
            System.out.println("Access Denied!!");
        }
    }
}
