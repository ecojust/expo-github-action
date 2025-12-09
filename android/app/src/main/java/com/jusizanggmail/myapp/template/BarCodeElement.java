package com.jusizanggmail.myapp.template;


public class BarCodeElement extends Element{
    private BarCodeJson json;

    public BarCodeJson getJson() {
        return json;
    }

    public void setJson(BarCodeJson json) {
        this.json = json;
    }

    public static class BarCodeJson  {
        private float x;
        private float y;
        private float width;
        private float height;
        private String value;
        private int rotate;
        private float fontSize;
        private int codeType;


        private int textHeight;
        private int textPosition;



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

        public float getWidth() {
            return width;
        }

        public void setWidth(float width) {
            this.width = width;
        }

        public float getHeight() {
            return height;
        }

        public void setHeight(float height) {
            this.height = height;
        }

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }


        public int getRotate() {
            return rotate;
        }

        public void setRotate(int rotate) {
            this.rotate = rotate;
        }

        public float getFontSize() {
            return fontSize;
        }

        public void setFontSize(float fontSize) {
            this.fontSize = fontSize;
        }

        public int getCodeType() {
            return codeType;
        }

        public void setCodeType(int codeType) {
            this.codeType = codeType;
        }

        public int getTextHeight() {
            return textHeight;
        }

        public void setTextHeight(int textHeight) {
            this.textHeight = textHeight;
        }

        public int getTextPosition() {
            return textPosition;
        }

        public void setTextPosition(int textPosition) {
            this.textPosition = textPosition;
        }
    }



}
