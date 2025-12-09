package com.jusizanggmail.myapp.template;

import java.util.List;

public class PrintTemplate {
    private InitDrawingBoardParam InitDrawingBoardParam;
    private List<Element> elements;
    
    public InitDrawingBoardParam getInitDrawingBoardParam() { return InitDrawingBoardParam; }
    public void setInitDrawingBoardParam(InitDrawingBoardParam initDrawingBoardParam) {
        InitDrawingBoardParam = initDrawingBoardParam; 
    }
    
    public List<Element> getElements() { return elements; }
    public void setElements(List<Element> elements) { this.elements = elements; }
}
