package com.jusizanggmail.myapp.template;


public class ImageElement extends Element{
    protected ImageJson json = null;

    public ImageJson getJson() {
        return json;
    }

    public void setJson(ImageJson json) {
        this.json = json;
    }

    public static class ImageJson{
        private float x;
        private float y;
        private float height;
        private float width;
        private int rotate;
        private String imageData;
        private int imageProcessingType;
        private float imageProcessingValue;

        public float getX() {
            return x;
        }

        public void setX(float x) {
            this.x = x;
        }

        public float getY() {
            return y;
        }

        public void setY(float y) {
            this.y = y;
        }

        public float getHeight() {
            return height;
        }

        public void setHeight(float height) {
            this.height = height;
        }

        public float getWidth() {
            return width;
        }

        public void setWidth(float width) {
            this.width = width;
        }

        public int getRotate() {
            return rotate;
        }

        public void setRotate(int rotate) {
            this.rotate = rotate;
        }

        public String getImageData() {
            return imageData;
        }

        public void setImageData(String imageData) {
            this.imageData = imageData;
        }

        public int getImageProcessingType() {
            return imageProcessingType;
        }

        public void setImageProcessingType(int imageProcessingType) {
            this.imageProcessingType = imageProcessingType;
        }

        public float getImageProcessingValue() {
            return imageProcessingValue;
        }

        public void setImageProcessingValue(float imageProcessingValue) {
            this.imageProcessingValue = imageProcessingValue;
        }
    }

}
