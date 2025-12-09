package com.jusizanggmail.myapp.template;


import com.google.gson.annotations.SerializedName;

public class InitDrawingBoardParam {
    private float width;
    private float height;
    private int rotate;
    private String path;
    private float verticalShift;
    @SerializedName("HorizontalShift") // 处理大写字段名
    private float horizontalShift;
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

    public int getRotate() {
        return rotate;
    }

    public void setRotate(int rotate) {
        this.rotate = rotate;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public float getVerticalShift() {
        return verticalShift;
    }

    public void setVerticalShift(float verticalShift) {
        this.verticalShift = verticalShift;
    }

    public float getHorizontalShift() {
        return horizontalShift;
    }

    public void setHorizontalShift(float horizontalShift) {
        this.horizontalShift = horizontalShift;
    }



}
