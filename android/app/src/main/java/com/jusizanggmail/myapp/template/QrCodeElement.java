package com.jusizanggmail.myapp.template;

public class QrCodeElement extends Element {
    protected QrCodeJson json = null;

    public QrCodeJson getJson() {
        return json;
    }

    public void setJson(QrCodeJson json) {
        this.json = json;
    }

    public static class QrCodeJson{
        private float x;
        private float y;
        private float height;
        private float width;
        private String value;
        private int codeType;
        private int rotate;

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

        public String getValue() {
            return value;
        }

        public void setValue(String value) {
            this.value = value;
        }

        public int getCodeType() {
            return codeType;
        }

        public void setCodeType(int codeType) {
            this.codeType = codeType;
        }

        public int getRotate() {
            return rotate;
        }

        public void setRotate(int rotate) {
            this.rotate = rotate;
        }
    }
}
