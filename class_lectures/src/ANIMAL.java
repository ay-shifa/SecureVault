class janwar{
    public void  eat(){
//        doggy dog = new doggy();
        System.out.println("Animal is eating");
//        dog.eating;
    }
}
class doggy extends janwar{
    public void  eating(){
        System.out.println("Dog is barking");
    }
}
class puppy{
    
}

public class ANIMAL {
    public static void main(String[] args) {
        System.out.println("Eat!");
        doggy ani = new doggy();
        ani.eat();
        ani.eating();


    }
}
