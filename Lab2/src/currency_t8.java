public class currency_t8 {
    public static void main(String[] args) {
        String currency = "USD";
        switch (currency) {
            case "USD":
                System.out.println("United States Dollar");
                break;
            case "GBP":
                System.out.println("British Pound");
                break;
            case "EUR":
                System.out.println("Euro");
                break;
            default:
                System.out.println("Unknown Currency");
        }
    }
}
