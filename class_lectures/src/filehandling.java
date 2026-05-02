import java.io.File;
import java.io.IOException;
public class filehandling {
    public static void main(String[] args) throws IOException{
        System.out.println("File handling in java");
        File file = new File("myfile.txt");
//        System.out.println(file.exists()); //false
        file.createNewFile(); //it gives an exception error
        System.out.println(file.exists());
    }
}
