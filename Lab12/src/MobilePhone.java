class MobilePhone {
    void call(){};
}
interface Camera{
    void open();
    void close();
}
interface MediaPlayer{
    void audio();
    void vedio();
}
interface GPS{
    void location();
    void HDMI();
}
class smartPhone extends MobilePhone implements Camera, MediaPlayer, GPS{
    @Override
    public void audio() {

    }

    @Override
    public void vedio() {

    }

    @Override
    public void location() {

    }

    @Override
    public void HDMI() {

    }
    @Override
    public void open() {

    }

    @Override
    public void close() {

    }

}

