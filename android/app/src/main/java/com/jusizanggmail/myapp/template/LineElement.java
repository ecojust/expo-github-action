package com.jusizanggmail.myapp.template;


import com.google.gson.annotations.SerializedName;

import java.util.List;

public class LineElement extends Element{
    protected LineJson json = null;

    public LineJson getJson() {
        return json;
    }

    public void setJson(LineJson json) {
        this.json = json;
    }

    public static class LineJson{
        private float x;
        private float y;
        private float height;
        private float width;
        private int lineType;
        private int rotate;
        @SerializedName("dashwidth")
        private float[] dashWidth;

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

        public int getLineType() {
            return lineType;
        }

        public void setLineType(int lineType) {
            this.lineType = lineType;
        }

        public int getRotate() {
            return rotate;
        }

        public void setRotate(int rotate) {
            this.rotate = rotate;
        }

        public float[] getDashWidth() {
            return dashWidth;
        }

        public void setDashWidth(float[] dashWidth) {
            this.dashWidth = dashWidth;
        }

        public float[] getDashwidth() {
            return this.dashWidth;
        }
    }
}
