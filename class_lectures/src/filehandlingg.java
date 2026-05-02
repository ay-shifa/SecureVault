import java.io.File;
import java.io.IOException;

public class filehandlingg {
    public static void main(String[] args) throws Exception {
        File file = new File("data.txt");
//        file.createNewFile();
        System.out.println(file.exists());
    }
}
