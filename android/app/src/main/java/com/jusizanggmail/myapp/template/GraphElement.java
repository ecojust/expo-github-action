package com.jusizanggmail.myapp.template;


import com.google.gson.annotations.SerializedName;

import java.util.List;

public class GraphElement extends Element{
    protected GraphJson json = null;

    public GraphJson getJson() {
        return json;
    }

    public void setJson(GraphJson json) {
        this.json = json;
    }

    public static class GraphJson{
        private float x;
        private float y;
        private float height;
        private float width;
        private int graphType;
        private int rotate;
        private float cornerRadius;
        private float lineWidth;
        private int lineType;
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

        public int getGraphType() {
            return graphType;
        }

        public void setGraphType(int graphType) {
            this.graphType = graphType;
        }

        public int getRotate() {
            return rotate;
        }

        public void setRotate(int rotate) {
            this.rotate = rotate;
        }

        public float getCornerRadius() {
            return cornerRadius;
        }

        public void setCornerRadius(float cornerRadius) {
            this.cornerRadius = cornerRadius;
        }

        public float getLineWidth() {
            return lineWidth;
        }

        public void setLineWidth(float lineWidth) {
            this.lineWidth = lineWidth;
        }

        public int getLineType() {
            return lineType;
        }

        public void setLineType(int lineType) {
            this.lineType = lineType;
        }

        public float[] getDashWidth() {
            return dashWidth;
        }

        public void setDashWidth(float[] dashWidth) {
            this.dashWidth = dashWidth;
        }
    }
}
