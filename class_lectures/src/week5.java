public class week5 {
    public static void main() {
//        wrapper classes
        System.out.println("      Wrapper Classes\n");
        Integer myInt = 100;
        Boolean myBool = true;
        Double myDouble = 1.0;
        String myString = myInt.toString();
        System.out.println(myString.length());
//        here we used the toString() method to convert wrapper objects to strings
//        and then apply a string method length() on it.


//        similarly we can also concatanate
        String a = Integer.toString(123);
        String b = Boolean.toString(false);
        String c = Double.toString(3.14);

        String x = a+b+c;
        System.out.println(x);

//        a method to check a letter
        char letter = 'f'; // one thing, we use '', "" this will give error
        System.out.println(Character.isLetter(letter));
        System.out.println(Character.isUpperCase(letter)); // these are all built in methods


        System.out.println("       End of Wrapper class \n  ---------------------------------------------------\n");

//        Final keyword: used to fix the value
        System.out.println("\n     Final Keyword");

        double val = 3.12234;
        val = 4;
        System.out.println(val);

        final double pi = 3.149678;
       // pi = 4; //I can't change this, it's giving an error
        System.out.println(pi);

        Integer helo = 189;
        System.out.println(helo.toString().length());
//        double hy = 12.3;
        // old way
        Integer abc = new Integer(12345);
        System.out.println(abc);
       // abc = 123;
// new way
        Integer abcd = 123;
        System.out.println(abcd.toString().indexOf('2'));

        //autoboxing
        Boolean bool = true;

        //unboxing
        int xy = abcd;
        boolean yz = bool;
        System.out.println(abcd.toString());

        // super keyword



    }
}
