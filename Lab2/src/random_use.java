public class random_use {
    public static void main(String[] args) {
        int Guess = 5;
        int random = (int)(Math.random()*11);
        System.out.println("Your Random Number is: "+random);
        if (Guess==random)
        {
            System.out.println("Which Is: True");
        }else
        {
            System.out.println("Which Is: False");
        }
    }
}
