package com.jusizanggmail.myapp.template;


import com.google.gson.annotations.SerializedName;

public class TextElement extends Element{

    protected TextJson json = null;

    public TextJson getJson() {
        return json;
    }

    public void setJson(TextJson json) {
        this.json = json;
    }

    public static class TextJson{
        private float x;
        private float y;
        private float height;
        private float width;
        private String value;
        private String fontFamily;
        private int rotate;
        private float fontSize;
         @SerializedName("textAlignHorizonral")
        private int textAlignHorizontal;
        private int textAlignVertical;
        private float letterSpacing;
        private float lineSpacing;
        private int lineMode;
        private boolean[] fontStyle;

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

        public String getFontFamily() {
            return fontFamily;
        }

        public void setFontFamily(String fontFamily) {
            this.fontFamily = fontFamily;
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

        public int getTextAlignHorizontal() {
            return textAlignHorizontal;
        }

        public void setTextAlignHorizontal(int textAlignHorizontal) {
            this.textAlignHorizontal = textAlignHorizontal;
        }

        public int getTextAlignVertical() {
            return textAlignVertical;
        }

        public void setTextAlignVertical(int textAlignVertical) {
            this.textAlignVertical = textAlignVertical;
        }

        public float getLetterSpacing() {
            return letterSpacing;
        }

        public void setLetterSpacing(float letterSpacing) {
            this.letterSpacing = letterSpacing;
        }

        public float getLineSpacing() {
            return lineSpacing;
        }

        public void setLineSpacing(float lineSpacing) {
            this.lineSpacing = lineSpacing;
        }

        public int getLineMode() {
            return lineMode;
        }

        public void setLineMode(int lineMode) {
            this.lineMode = lineMode;
        }

        public boolean[] getFontStyle() {
            return fontStyle;
        }

        public void setFontStyle(boolean[] fontStyle) {
            this.fontStyle = fontStyle;
        }
    }

}
